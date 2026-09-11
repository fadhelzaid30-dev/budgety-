import type { FinancialAggregates } from "./aggregates";
import { formatCurrency } from "@/lib/utils";
import { UNCATEGORIZED } from "@/lib/constants";

export type InsightTone = "danger" | "warning" | "success" | "default";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  /** One sentence. Always names a real figure from the user's own data. */
  detail: string;
  /** Optional deep link to wherever the user would act on this. */
  href?: string;
  linkLabel?: string;
}

/**
 * Deterministic insights derived from the user's own numbers.
 *
 * This is not the AI CFO and doesn't pretend to be — no model is called, no key
 * is needed, and the same inputs always produce the same output. It covers the
 * "notice the obvious thing" half of proactive advice: a category that jumped,
 * runway getting short, margin going negative. The AI's job is the half this
 * can't do — open-ended questions and judgement.
 *
 * Rules are evaluated in severity order and the caller takes the first N, so
 * the most urgent thing is always what surfaces.
 */
export function buildInsights(a: FinancialAggregates, limit = 3): Insight[] {
  const out: Insight[] = [];
  const money = (n: number) => formatCurrency(Math.abs(n));

  // --- Cash runway: the thing that actually kills a business ---------------
  if (a.runwayMonths != null && a.runwayMonths < 3 && a.monthlyBurn > 0) {
    out.push({
      id: "runway-critical",
      tone: a.runwayMonths < 1.5 ? "danger" : "warning",
      title: `${a.runwayMonths.toFixed(1)} months of runway left`,
      detail: `At ${money(a.monthlyBurn)}/mo of spending, your ${money(
        a.cashBalance,
      )} cash covers about ${a.runwayMonths.toFixed(1)} more months.`,
      href: "/transactions?type=expense",
      linkLabel: "Review expenses",
    });
  }

  // --- Losing money this month --------------------------------------------
  if (a.profitLoss.month < 0 && a.expenses.month > 0) {
    out.push({
      id: "monthly-loss",
      tone: "warning",
      title: `Spending exceeds income this month by ${money(a.profitLoss.month)}`,
      detail: `${money(a.expenses.month)} out against ${money(
        a.revenue.month,
      )} in so far this month.`,
      href: "/transactions",
      linkLabel: "See transactions",
    });
  }

  // --- Biggest category movement ------------------------------------------
  // Only worth surfacing if it's both a large proportional jump and a
  // meaningful absolute amount — a 200% rise on $6 is noise.
  const jump = a.categoryTrends.find(
    (c) => c.deltaPct != null && c.deltaPct >= 25 && c.delta >= 100 && c.name !== UNCATEGORIZED,
  );
  if (jump && jump.deltaPct != null) {
    out.push({
      id: `category-up-${jump.name}`,
      tone: "warning",
      title: `${jump.name} spending rose ${Math.round(jump.deltaPct)}% last month`,
      detail: `Up from ${money(jump.previous)} to ${money(jump.current)} — ${money(
        jump.delta,
      )} more than the month before.`,
      href: `/transactions?type=expense`,
      linkLabel: "Review category",
    });
  }

  // --- Uncategorized backlog ----------------------------------------------
  const uncat = a.expensesByCategory.find((c) => c.name === UNCATEGORIZED);
  const totalExpenses = a.expensesByCategory.reduce((s, c) => s + c.amount, 0);
  if (uncat && totalExpenses > 0 && uncat.amount / totalExpenses > 0.2) {
    out.push({
      id: "uncategorized",
      tone: "default",
      title: `${Math.round((uncat.amount / totalExpenses) * 100)}% of spending is uncategorised`,
      detail: `${money(
        uncat.amount,
      )} isn't assigned to a category, so your breakdown and advice are incomplete.`,
      href: "/transactions?category=uncategorized",
      linkLabel: "Categorise them",
    });
  }

  // --- Good news is worth saying too --------------------------------------
  if (a.revenueGrowthMoM != null && a.revenueGrowthMoM >= 15) {
    out.push({
      id: "revenue-up",
      tone: "success",
      title: `Revenue grew ${Math.round(a.revenueGrowthMoM)}% last month`,
      detail: `Your strongest signal right now — ${money(
        a.revenue.month,
      )} booked so far this month.`,
    });
  }

  const drop = a.categoryTrends.find(
    (c) => c.deltaPct != null && c.deltaPct <= -25 && c.delta <= -100 && c.name !== UNCATEGORIZED,
  );
  if (drop) {
    out.push({
      id: `category-down-${drop.name}`,
      tone: "success",
      title: `${drop.name} spending fell ${money(drop.delta)} last month`,
      detail: `Down from ${money(drop.previous)} to ${money(drop.current)}.`,
    });
  }

  if (a.profitLoss.month > 0 && out.length === 0) {
    out.push({
      id: "profitable",
      tone: "success",
      title: `You're up ${money(a.profitLoss.month)} this month`,
      detail: `${money(a.revenue.month)} in against ${money(a.expenses.month)} out.`,
    });
  }

  return out.slice(0, limit);
}
