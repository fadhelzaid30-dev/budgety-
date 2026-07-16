import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeAggregates } from "@/lib/finance/aggregates";
import { computeHealthScore } from "@/lib/finance/healthScore";
import { buildFinancialContext } from "@/lib/ai/context";
import { generateReport } from "@/lib/ai/generate";
import { sendReportEmail, isEmailConfigured } from "@/lib/email/resend";
import type { Business, Report, Transaction } from "@/types";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Generate, store, and (optionally) email a weekly report for one business.
 * Works with either an RLS-scoped client (manual, current user) or the admin
 * client (cron, across users) — the caller supplies the Supabase client.
 */
export async function generateAndStoreReport(
  supabase: SupabaseClient,
  business: Business,
  opts: { emailTo?: string | null } = {},
): Promise<{ report: Report | null; error?: string }> {
  const { data: txData } = await supabase
    .from("transactions")
    .select("*, category:categories(id, name, kind)")
    .eq("business_id", business.id);
  const transactions = (txData as Transaction[]) ?? [];

  const aggregates = computeAggregates(transactions, Number(business.cash_balance));
  const health = computeHealthScore(aggregates);
  const { text } = buildFinancialContext({ business, aggregates, health });

  let content;
  try {
    content = await generateReport(text);
  } catch (e) {
    return { report: null, error: e instanceof Error ? e.message : "Report generation failed." };
  }

  const emailWanted = Boolean(opts.emailTo && isEmailConfigured());
  const sent = emailWanted ? await sendReportEmail(opts.emailTo!, business, content) : false;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      business_id: business.id,
      period_start: isoDaysAgo(7),
      period_end: isoDaysAgo(0),
      content,
      email_status: !emailWanted ? "pending" : sent ? "sent" : "failed",
    })
    .select("*")
    .single();

  if (error) return { report: null, error: error.message };
  return { report: data as Report };
}
