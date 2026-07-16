"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentBusiness, getFinancialSnapshot } from "@/lib/data/queries";
import { buildFinancialContext } from "@/lib/ai/context";
import { generateRecommendations } from "@/lib/ai/generate";
import { isAiConfigured } from "@/lib/ai/openai";
import type { ActionResult } from "@/lib/actions/business";
import type { RecommendationStatus } from "@/types";

/**
 * Generate this week's recommendations for the current business, grounded in real
 * data, and persist them. Prior "new" recommendations are archived (marked read).
 */
export async function generateWeeklyRecommendations(): Promise<ActionResult<number>> {
  if (!isAiConfigured()) {
    return { ok: false, error: "AI is not configured. Add OPENAI_API_KEY." };
  }
  const business = await getCurrentBusiness();
  if (!business) return { ok: false, error: "No business found." };

  const snapshot = await getFinancialSnapshot(business);
  if (snapshot.aggregates.transactionCount === 0) {
    return { ok: false, error: "Add some transactions first so the AI has data to analyze." };
  }

  const { text } = buildFinancialContext(snapshot);

  let recs;
  try {
    recs = await generateRecommendations(text);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "AI generation failed." };
  }

  const supabase = await createServerSupabase();
  // Archive existing unread recommendations so the list stays focused on the latest set.
  await supabase
    .from("ai_recommendations")
    .update({ status: "read" })
    .eq("business_id", business.id)
    .eq("status", "new");

  const { error } = await supabase.from("ai_recommendations").insert(
    recs.map((r) => ({
      business_id: business.id,
      title: r.title,
      body: r.body,
      rationale: r.rationale,
      supporting_data: r.supporting_data,
      risk_level: r.risk_level,
      status: "new" as const,
    })),
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/recommendations");
  return { ok: true, data: recs.length };
}

export async function updateRecommendationStatus(
  id: string,
  status: RecommendationStatus,
): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("ai_recommendations")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/recommendations");
  return { ok: true, data: null };
}
