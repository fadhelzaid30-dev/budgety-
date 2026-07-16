import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentBusiness, getCategories } from "@/lib/data/queries";
import { normalizeRows, type ColumnMapping, type RawRow } from "@/lib/csv/mapping";
import { categorizeByRules, FALLBACK_CATEGORY } from "@/lib/categorize/rules";

const MAX_ROWS = 5000;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business found" }, { status: 400 });

  let body: { rows?: RawRow[]; mapping?: ColumnMapping };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { rows, mapping } = body;
  if (!Array.isArray(rows) || !mapping?.date || !mapping?.amount) {
    return NextResponse.json({ error: "Missing rows or column mapping" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows (max ${MAX_ROWS}). Split the file and try again.` },
      { status: 400 },
    );
  }

  const { valid, errors } = normalizeRows(rows, mapping);
  if (valid.length === 0) {
    return NextResponse.json(
      { error: "No valid rows to import.", errors },
      { status: 400 },
    );
  }

  // Build a category name → id map once (business categories + system defaults).
  const categories = await getCategories(business.id);
  const catByName = new Map<string, string>();
  for (const c of categories) {
    // Prefer business-specific over system default of the same name.
    if (c.business_id || !catByName.has(c.name)) catByName.set(c.name, c.id);
  }

  const inserts = valid.map((t) => {
    const name = categorizeByRules(t.description, t.type) ?? FALLBACK_CATEGORY;
    return {
      business_id: business.id,
      amount: t.amount,
      occurred_on: t.occurred_on,
      description: t.description,
      type: t.type,
      category_id: catByName.get(name) ?? null,
      source: "csv" as const,
      raw_import: rows[t.sourceIndex] ?? null,
    };
  });

  const supabase = await createServerSupabase();
  const { error, count } = await supabase
    .from("transactions")
    .insert(inserts, { count: "exact" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: count ?? inserts.length,
    skipped: errors.length,
    errors: errors.slice(0, 20),
  });
}
