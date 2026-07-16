import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { categorizeByRules, FALLBACK_CATEGORY } from "@/lib/categorize/rules";

/**
 * Resolve a category *name* to a category id visible to this business (its own
 * custom category or a system default). Returns null if not found.
 */
export async function resolveCategoryIdByName(
  supabase: SupabaseClient,
  businessId: string,
  name: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("categories")
    .select("id, business_id")
    .eq("name", name)
    .or(`business_id.eq.${businessId},business_id.is.null`)
    // Prefer a business-specific category over the system default of the same name.
    .order("business_id", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Pick a category id for a new transaction using deterministic keyword rules,
 * falling back to the "Uncategorized" default. (AI classification is a separate,
 * opt-in pass so transaction creation stays fast and offline.)
 */
export async function autoCategoryId(
  supabase: SupabaseClient,
  businessId: string,
  description: string,
  type: "revenue" | "expense",
): Promise<string | null> {
  const name = categorizeByRules(description, type) ?? FALLBACK_CATEGORY;
  return resolveCategoryIdByName(supabase, businessId, name);
}
