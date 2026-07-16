"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/queries";
import type { Business } from "@/types";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(120),
  industry: z.string().trim().max(80).optional().or(z.literal("")),
  size: z.string().trim().max(80).optional().or(z.literal("")),
  revenue_range: z.string().trim().max(80).optional().or(z.literal("")),
  cash_balance: z.coerce.number().min(0).max(1_000_000_000).default(0),
});

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Create or update the current user's business profile (single business per user
 * in MVP). Returns the saved business.
 */
export async function saveBusinessProfile(
  input: z.input<typeof profileSchema>,
): Promise<ActionResult<Business>> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not authenticated." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const values = parsed.data;

  const supabase = await createServerSupabase();
  const existing = await getCurrentBusiness();

  if (existing) {
    const { data, error } = await supabase
      .from("businesses")
      .update({
        name: values.name,
        industry: values.industry || null,
        size: values.size || null,
        revenue_range: values.revenue_range || null,
        cash_balance: values.cash_balance,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true, data: data as Business };
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      user_id: userId,
      name: values.name,
      industry: values.industry || null,
      size: values.size || null,
      revenue_range: values.revenue_range || null,
      cash_balance: values.cash_balance,
      onboarding_complete: false,
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as Business };
}

/** Mark onboarding complete so the user can enter the app. */
export async function finishOnboarding(): Promise<ActionResult> {
  const business = await getCurrentBusiness();
  if (!business) return { ok: false, error: "Set up your business first." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("businesses")
    .update({ onboarding_complete: true })
    .eq("id", business.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true, data: null };
}
