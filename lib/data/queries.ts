import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { computeAggregates, type FinancialAggregates } from "@/lib/finance/aggregates";
import { computeHealthScore, type HealthScoreResult } from "@/lib/finance/healthScore";
import type { Business, Category, Profile, Transaction } from "@/types";

/**
 * Ensure a profile row exists for the signed-in Clerk user, then return it.
 * Idempotent — safe to call on every authenticated page load.
 */
export async function ensureProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing as Profile;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const { data } = await supabase
    .from("profiles")
    .insert({ user_id: userId, email })
    .select("*")
    .single();
  return (data as Profile) ?? null;
}

/** The current user's single business (MVP: one per user), or null if not set up. */
export async function getCurrentBusiness(): Promise<Business | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as Business) ?? null;
}

/** Categories visible to a business: its custom ones plus the system defaults. */
export async function getCategories(businessId: string): Promise<Category[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .or(`business_id.eq.${businessId},business_id.is.null`)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });
  return (data as Category[]) ?? [];
}

export interface TransactionQuery {
  search?: string;
  categoryId?: string;
  type?: "revenue" | "expense";
  /** Filter by recurrence series: "one-time" = not part of any series. */
  frequency?: "one-time" | "monthly" | "biweekly";
  from?: string;
  to?: string;
  limit?: number;
}

export async function getTransactions(
  businessId: string,
  q: TransactionQuery = {},
): Promise<Transaction[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("transactions")
    .select("*, category:categories(id, name, kind)")
    .eq("business_id", businessId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (q.search) query = query.ilike("description", `%${q.search}%`);
  if (q.categoryId) query = query.eq("category_id", q.categoryId);
  if (q.type) query = query.eq("type", q.type);
  if (q.frequency === "one-time") query = query.is("recurrence_frequency", null);
  else if (q.frequency === "monthly" || q.frequency === "biweekly")
    query = query.eq("recurrence_frequency", q.frequency);
  if (q.from) query = query.gte("occurred_on", q.from);
  if (q.to) query = query.lte("occurred_on", q.to);
  if (q.limit) query = query.limit(q.limit);

  const { data } = await query;
  return (data as Transaction[]) ?? [];
}

/**
 * Persist a health-score snapshot, throttled to at most once every 12 hours per
 * business, so the dashboard builds a trend without writing on every page load.
 */
export async function maybeSnapshotHealthScore(
  businessId: string,
  health: HealthScoreResult,
): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: latest } = await supabase
    .from("health_scores")
    .select("computed_at")
    .eq("business_id", businessId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
  if (latest && new Date(latest.computed_at).getTime() > twelveHoursAgo) return;

  await supabase.from("health_scores").insert({
    business_id: businessId,
    score: health.score,
    factors: health.factors,
  });
}

export interface FinancialSnapshot {
  business: Business;
  aggregates: FinancialAggregates;
  health: HealthScoreResult;
}

/**
 * Load everything needed to describe a business's finances: all transactions,
 * derived aggregates, and the health score. Single source of truth for the
 * dashboard, AI context builder, and report generator.
 */
export async function getFinancialSnapshot(
  business: Business,
): Promise<FinancialSnapshot> {
  const transactions = await getTransactions(business.id);
  const aggregates = computeAggregates(transactions, Number(business.cash_balance));
  const health = computeHealthScore(aggregates);
  return { business, aggregates, health };
}
