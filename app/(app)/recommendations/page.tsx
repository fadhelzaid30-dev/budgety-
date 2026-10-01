import type { Metadata } from "next";
import { getCurrentBusiness } from "@/lib/data/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/openai";
import { RecommendationsView } from "./ui";
import type { AiRecommendation } from "@/types";

export const metadata: Metadata = { title: "Recommendations — Budgety" };

export default async function RecommendationsPage() {
  const business = (await getCurrentBusiness())!;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("business_id", business.id)
    .neq("status", "dismissed")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recommendations</h1>
        <p className="text-sm text-muted">
          Weekly, actionable advice grounded in your real numbers.
        </p>
      </div>
      <RecommendationsView
        recommendations={(data as AiRecommendation[]) ?? []}
        aiConfigured={isAiConfigured()}
      />
    </div>
  );
}
