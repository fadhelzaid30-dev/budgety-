"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentBusiness, getTransactions } from "@/lib/data/queries";
import { generateAndStoreReport } from "@/lib/reports/generate";
import { isAiConfigured } from "@/lib/ai/openai";
import type { ActionResult } from "@/lib/actions/business";

/**
 * Generate a weekly report on demand for the current user's business and email it
 * to them. Mirrors the Monday cron path but scoped to the signed-in user (RLS).
 */
export async function generateReportNow(): Promise<ActionResult> {
  if (!isAiConfigured()) {
    return { ok: false, error: "AI is not configured. Add OPENAI_API_KEY." };
  }
  const business = await getCurrentBusiness();
  if (!business) return { ok: false, error: "No business found." };

  const transactions = await getTransactions(business.id, { limit: 1 });
  if (transactions.length === 0) {
    return { ok: false, error: "Add some transactions before generating a report." };
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const supabase = await createServerSupabase();
  const { report, error } = await generateAndStoreReport(supabase, business, { emailTo: email });
  if (error || !report) return { ok: false, error: error ?? "Failed to generate report." };

  revalidatePath("/reports");
  return { ok: true, data: null };
}
