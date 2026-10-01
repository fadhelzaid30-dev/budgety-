import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureProfile, getCurrentBusiness } from "@/lib/data/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/openai";
import { WordMark } from "@/components/wordmark";
import { OnboardingWizard } from "./wizard";
import type { Category } from "@/types";

export const metadata: Metadata = { title: "Set up Budgety" };

export default async function OnboardingPage() {
  await ensureProfile();
  const business = await getCurrentBusiness();
  if (business?.onboarding_complete) {
    redirect("/dashboard");
  }

  // System default categories are enough for the first-transaction step.
  const supabase = await createServerSupabase();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .is("business_id", null)
    .order("kind", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 self-start">
        <WordMark variant="dark" size={20} />
      </Link>
      <OnboardingWizard
        existingBusiness={business}
        categories={(categories as Category[]) ?? []}
        aiConfigured={isAiConfigured()}
      />
    </div>
  );
}
