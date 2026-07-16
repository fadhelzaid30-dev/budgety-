import { type NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { generateAndStoreReport } from "@/lib/reports/generate";
import type { Business } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Weekly report job. Triggered by Vercel Cron every Monday (see vercel.json).
 * Guarded by CRON_SECRET — Vercel sends it as `Authorization: Bearer <secret>`.
 * Uses the service-role client to run across all businesses.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminSupabase();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("onboarding_complete", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: { businessId: string; ok: boolean; error?: string }[] = [];

  for (const business of (businesses as Business[]) ?? []) {
    // Look up the owner's email for delivery.
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", business.user_id)
      .maybeSingle();

    const { report, error: genError } = await generateAndStoreReport(supabase, business, {
      emailTo: profile?.email ?? null,
    });
    results.push({
      businessId: business.id,
      ok: Boolean(report),
      error: genError,
    });
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    results,
  });
}
