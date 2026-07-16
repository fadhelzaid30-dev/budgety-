import { z } from "zod";
import { getOpenAI, AI_MODEL } from "@/lib/ai/openai";
import {
  recommendationsSystemPrompt,
  reportSystemPrompt,
} from "@/lib/ai/prompts";
import { EXPENSE_CATEGORIES, RISK_LEVELS, UNCATEGORIZED } from "@/lib/constants";
import type { ReportContent } from "@/types";

const recommendationSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1),
  rationale: z.string().default(""),
  supporting_data: z.record(z.string(), z.unknown()).default({}),
  risk_level: z.enum(RISK_LEVELS).default("low"),
});

const recommendationsSchema = z.object({
  recommendations: z.array(recommendationSchema).min(1).max(5),
});

export type GeneratedRecommendation = z.infer<typeof recommendationSchema>;

/** Generate weekly recommendations, grounded in the provided financial context. */
export async function generateRecommendations(
  financialContext: string,
): Promise<GeneratedRecommendation[]> {
  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: recommendationsSystemPrompt(financialContext) },
      { role: "user", content: "Generate this week's recommendations." },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = recommendationsSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error("AI returned recommendations in an unexpected format.");
  }
  return parsed.data.recommendations;
}

const reportSchema = z.object({
  summary: z.string().min(1),
  cashFlow: z.string().min(1),
  risks: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  actions: z.array(z.string()).default([]),
});

/** Generate the weekly report content, grounded in the provided context. */
export async function generateReport(
  financialContext: string,
): Promise<ReportContent> {
  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: reportSystemPrompt(financialContext) },
      { role: "user", content: "Write this week's report." },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = reportSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error("AI returned a report in an unexpected format.");
  }
  return parsed.data;
}

/**
 * AI fallback for categorizing an expense description when keyword rules miss.
 * Constrained to the known category set; returns Uncategorized on any doubt.
 */
export async function classifyExpenseCategory(
  description: string,
): Promise<string> {
  const allowed = [...EXPENSE_CATEGORIES, UNCATEGORIZED];
  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Classify a business expense into exactly one of these categories: ${allowed.join(
          ", ",
        )}. Return JSON: {"category": "<one of the categories>"}. If unsure, use "${UNCATEGORIZED}".`,
      },
      { role: "user", content: description },
    ],
  });

  try {
    const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    const category = String(raw.category ?? UNCATEGORIZED);
    return allowed.includes(category as (typeof allowed)[number])
      ? category
      : UNCATEGORIZED;
  } catch {
    return UNCATEGORIZED;
  }
}
