"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/data/queries";
import { autoCategoryId } from "@/lib/categorize/resolve";
import type { ActionResult } from "@/lib/actions/business";
import type { Transaction } from "@/types";

const txSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0").max(1_000_000_000),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
  description: z.string().trim().max(300).default(""),
  type: z.enum(["revenue", "expense"]),
  category_id: z.string().uuid().nullable().optional(),
});

function revalidateAll() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

/** Create a transaction, auto-categorizing (rules) when no category is chosen. */
export async function createTransaction(
  input: z.input<typeof txSchema>,
): Promise<ActionResult<Transaction>> {
  const parsed = txSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const v = parsed.data;

  const business = await getCurrentBusiness();
  if (!business) return { ok: false, error: "No business found." };

  const supabase = await createServerSupabase();
  const categoryId =
    v.category_id ??
    (await autoCategoryId(supabase, business.id, v.description, v.type));

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      business_id: business.id,
      amount: v.amount,
      occurred_on: v.occurred_on,
      description: v.description,
      type: v.type,
      category_id: categoryId,
      source: "manual",
    })
    .select("*, category:categories(id, name, kind)")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, data: data as Transaction };
}

/** Re-categorize a transaction (RLS ensures the caller owns it). */
export async function recategorizeTransaction(
  id: string,
  categoryId: string | null,
): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("transactions")
    .update({ category_id: categoryId })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, data: null };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateAll();
  return { ok: true, data: null };
}

const splitPartSchema = z.object({
  amount: z.coerce.number().positive(),
  category_id: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(300).optional(),
});

/**
 * Split a transaction into child parts. The parent is retained (and excluded from
 * aggregates because it now has children); each part becomes a child transaction.
 * Parts must sum to the parent amount.
 */
export async function splitTransaction(
  parentId: string,
  parts: z.input<typeof splitPartSchema>[],
): Promise<ActionResult> {
  const parsed = z.array(splitPartSchema).min(2).safeParse(parts);
  if (!parsed.success) {
    return { ok: false, error: "A split needs at least two parts." };
  }

  const supabase = await createServerSupabase();
  const { data: parent, error: pErr } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", parentId)
    .single();
  if (pErr || !parent) return { ok: false, error: "Transaction not found." };

  const total = parsed.data.reduce((a, p) => a + p.amount, 0);
  if (Math.abs(total - Number(parent.amount)) > 0.01) {
    return { ok: false, error: "Split parts must add up to the original amount." };
  }

  const children = parsed.data.map((p) => ({
    business_id: parent.business_id,
    amount: p.amount,
    occurred_on: parent.occurred_on,
    description: p.description || parent.description,
    type: parent.type,
    category_id: p.category_id ?? parent.category_id,
    source: parent.source,
    parent_transaction_id: parent.id,
  }));

  const { error } = await supabase.from("transactions").insert(children);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true, data: null };
}
