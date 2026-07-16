import type { FinancialAggregates } from "@/lib/finance/aggregates";
import type { HealthScoreFactors } from "@/types";

// Weights for the six sub-scores (sum = 1.0). Tunable in one place.
const WEIGHTS: Record<keyof HealthScoreFactors, number> = {
  cashFlow: 0.25,
  profitability: 0.2,
  revenueGrowth: 0.2,
  liquidity: 0.2,
  expenseTrend: 0.1,
  debtRatio: 0.05,
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Map a value onto 0–100 with a linear band between `low` (→0) and `high` (→100). */
function band(value: number, low: number, high: number): number {
  if (high === low) return 50;
  return clamp(((value - low) / (high - low)) * 100);
}

export interface HealthScoreResult {
  score: number;
  factors: HealthScoreFactors;
  /** Human-readable notes explaining each sub-score, for the UI and AI context. */
  notes: Record<keyof HealthScoreFactors, string>;
}

/**
 * Compute the Business Health Score (0–100) from financial aggregates.
 * Deterministic and pure. The `debtRatio` factor is a documented neutral
 * placeholder until liabilities are captured (see plan risk flags).
 */
export function computeHealthScore(agg: FinancialAggregates): HealthScoreResult {
  // Cash flow: positive net 30-day flow scores well; scaled against monthly burn.
  const burn = Math.max(agg.monthlyBurn, 1);
  const cashFlow = band(agg.netCashFlow30d / burn, -1, 1); // -1 burn → 0, +1 burn → 100

  // Profitability: YTD margin. 0% → 40, 25%+ → 100, negative → low.
  const margin =
    agg.revenue.ytd > 0 ? (agg.profitLoss.ytd / agg.revenue.ytd) * 100 : -25;
  const profitability = band(margin, -25, 25);

  // Revenue growth: MoM %. Flat (0%) → 50, +20% → 100, -20% → 0.
  const revenueGrowth =
    agg.revenueGrowthMoM == null ? 50 : band(agg.revenueGrowthMoM, -20, 20);

  // Liquidity: runway in months. <1mo → 0, ≥6mo → 100.
  const liquidity =
    agg.runwayMonths == null ? 50 : band(agg.runwayMonths, 1, 6);

  // Expense trend: falling/flat expenses are healthy. -20% → 100, +20% → 0.
  const expenseTrend =
    agg.expenseTrendPct == null ? 50 : band(-agg.expenseTrendPct, -20, 20);

  // Debt ratio: no liabilities data in MVP — neutral placeholder.
  const debtRatio = 50;

  const factors: HealthScoreFactors = {
    cashFlow: Math.round(cashFlow),
    profitability: Math.round(profitability),
    revenueGrowth: Math.round(revenueGrowth),
    liquidity: Math.round(liquidity),
    expenseTrend: Math.round(expenseTrend),
    debtRatio: Math.round(debtRatio),
  };

  const score = Math.round(
    (Object.keys(WEIGHTS) as (keyof HealthScoreFactors)[]).reduce(
      (acc, key) => acc + factors[key] * WEIGHTS[key],
      0,
    ),
  );

  const notes: Record<keyof HealthScoreFactors, string> = {
    cashFlow: `Net 30-day cash flow is ${agg.netCashFlow30d >= 0 ? "positive" : "negative"} relative to a ${Math.round(burn)} monthly burn.`,
    profitability: `Year-to-date margin is about ${margin.toFixed(0)}%.`,
    revenueGrowth:
      agg.revenueGrowthMoM == null
        ? "Not enough history to measure month-over-month revenue growth."
        : `Revenue changed ${agg.revenueGrowthMoM.toFixed(0)}% month-over-month.`,
    liquidity:
      agg.runwayMonths == null
        ? "Runway can't be estimated yet (no burn established)."
        : `Cash covers about ${agg.runwayMonths.toFixed(1)} months of burn.`,
    expenseTrend:
      agg.expenseTrendPct == null
        ? "Not enough history to measure the expense trend."
        : `Expenses moved ${agg.expenseTrendPct.toFixed(0)}% month-over-month.`,
    debtRatio: "Debt ratio is a neutral placeholder (liabilities not tracked in MVP).",
  };

  return { score: clamp(score), factors, notes };
}

export function scoreLabel(score: number): { label: string; tone: "success" | "warning" | "danger" } {
  if (score >= 70) return { label: "Healthy", tone: "success" };
  if (score >= 45) return { label: "Fair", tone: "warning" };
  return { label: "At risk", tone: "danger" };
}
