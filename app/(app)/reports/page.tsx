import type { Metadata } from "next";
import { getCurrentBusiness } from "@/lib/data/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/openai";
import { isEmailConfigured } from "@/lib/email/resend";
import { ReportsView } from "./ui";
import type { Report } from "@/types";

export const metadata: Metadata = { title: "Reports — Budgety" };

export default async function ReportsPage() {
  const business = (await getCurrentBusiness())!;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Weekly reports</h1>
        <p className="text-sm text-muted">
          A written summary of each week&apos;s cash flow, risks, and suggested actions.
        </p>
      </div>
      <ReportsView
        reports={(data as Report[]) ?? []}
        aiConfigured={isAiConfigured()}
        emailConfigured={isEmailConfigured()}
      />
    </div>
  );
}
