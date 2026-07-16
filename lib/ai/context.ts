import type { FinancialSnapshot } from "@/lib/data/queries";
import { formatCurrency } from "@/lib/utils";

/**
 * Build the grounded "financial context" that every AI call reasons over. Returns
 * a human-readable text block (injected into prompts) and a JSON snapshot (stored
 * alongside the response for auditability). The model is told to use ONLY these
 * numbers — this is the core guardrail against hallucinated figures.
 */
export function buildFinancialContext(snapshot: FinancialSnapshot): {
  text: string;
  snapshot: Record<string, unknown>;
} {
  const { business, aggregates: a, health } = snapshot;
  const c = (n: number) => formatCurrency(n);

  const topCategories = a.expensesByCategory
    .slice(0, 6)
    .map((x) => `  - ${x.name}: ${c(x.amount)}`)
    .join("\n");

  const series = a.monthlySeries
    .map((m) => `  - ${m.label}: revenue ${c(m.revenue)}, expenses ${c(m.expense)}, net ${c(m.net)}`)
    .join("\n");

  const text = `BUSINESS FINANCIAL CONTEXT (authoritative — use only these figures)
Business: ${business.name}${business.industry ? ` (${business.industry})` : ""}${business.size ? `, ${business.size}` : ""}
Current cash balance: ${c(a.cashBalance)}
Estimated monthly burn: ${c(a.monthlyBurn)}
Runway: ${a.runwayMonths == null ? "not established" : `${a.runwayMonths.toFixed(1)} months`}
Net cash flow (last 30 days): ${c(a.netCashFlow30d)}

Revenue — this month: ${c(a.revenue.month)}, YTD: ${c(a.revenue.ytd)}
Expenses — this month: ${c(a.expenses.month)}, YTD: ${c(a.expenses.ytd)}
Profit/Loss — this month: ${c(a.profitLoss.month)}, YTD: ${c(a.profitLoss.ytd)}
Revenue growth (MoM): ${a.revenueGrowthMoM == null ? "n/a" : `${a.revenueGrowthMoM.toFixed(1)}%`}
Expense trend (MoM): ${a.expenseTrendPct == null ? "n/a" : `${a.expenseTrendPct.toFixed(1)}%`}

Business Health Score: ${health.score}/100
Top expense categories (YTD):
${topCategories || "  - none yet"}

Last 6 months:
${series}`;

  const snapshotJson: Record<string, unknown> = {
    cashBalance: a.cashBalance,
    monthlyBurn: a.monthlyBurn,
    runwayMonths: a.runwayMonths,
    netCashFlow30d: a.netCashFlow30d,
    revenue: a.revenue,
    expenses: a.expenses,
    profitLoss: a.profitLoss,
    revenueGrowthMoM: a.revenueGrowthMoM,
    expenseTrendPct: a.expenseTrendPct,
    healthScore: health.score,
    expensesByCategory: a.expensesByCategory,
  };

  return { text, snapshot: snapshotJson };
}
