import type { Transaction } from "@/types";
import { UNCATEGORIZED } from "@/lib/constants";

export interface MonthlyPoint {
  month: string; // yyyy-mm
  label: string; // e.g. "Jul"
  revenue: number;
  expense: number;
  net: number;
}

export interface FinancialAggregates {
  cashBalance: number;
  revenue: { day: number; week: number; month: number; ytd: number };
  expenses: { day: number; week: number; month: number; ytd: number };
  profitLoss: { month: number; ytd: number };
  expensesByCategory: { name: string; amount: number }[];
  monthlyBurn: number; // avg monthly expense over trailing 3 full months
  runwayMonths: number | null; // cash / monthlyBurn
  netCashFlow30d: number;
  revenueGrowthMoM: number | null; // % change, last full month vs prior
  expenseTrendPct: number | null; // % change in expenses, last full month vs prior
  monthlySeries: MonthlyPoint[]; // trailing 6 months
  transactionCount: number;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Exclude parent transactions that have been split into children (children carry
 * the real amounts) so nothing is double counted.
 */
function leafTransactions(transactions: Transaction[]): Transaction[] {
  const splitParentIds = new Set(
    transactions.map((t) => t.parent_transaction_id).filter(Boolean) as string[],
  );
  return transactions.filter((t) => !splitParentIds.has(t.id));
}

/**
 * Compute the full financial picture from a business's transactions. Pure and
 * deterministic given `now`, so it can be reused by the dashboard, AI context
 * builder, and weekly report generator.
 */
export function computeAggregates(
  transactions: Transaction[],
  cashBalance: number,
  now: Date = new Date(),
): FinancialAggregates {
  const txns = leafTransactions(transactions);

  const startOfDay = ymd(now);
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const startOfMonth = `${monthKey(now)}-01`;
  const startOfYear = `${now.getFullYear()}-01-01`;
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const sum = (pred: (t: Transaction) => boolean) =>
    txns.filter(pred).reduce((acc, t) => acc + Number(t.amount), 0);

  const isRevenue = (t: Transaction) => t.type === "revenue";
  const isExpense = (t: Transaction) => t.type === "expense";
  const on = (t: Transaction, fromIso: string) => t.occurred_on >= fromIso;

  const revenue = {
    day: sum((t) => isRevenue(t) && t.occurred_on === startOfDay),
    week: sum((t) => isRevenue(t) && on(t, ymd(weekAgo))),
    month: sum((t) => isRevenue(t) && on(t, startOfMonth)),
    ytd: sum((t) => isRevenue(t) && on(t, startOfYear)),
  };
  const expenses = {
    day: sum((t) => isExpense(t) && t.occurred_on === startOfDay),
    week: sum((t) => isExpense(t) && on(t, ymd(weekAgo))),
    month: sum((t) => isExpense(t) && on(t, startOfMonth)),
    ytd: sum((t) => isExpense(t) && on(t, startOfYear)),
  };

  // Expenses by category (this year).
  const catMap = new Map<string, number>();
  for (const t of txns) {
    if (!isExpense(t) || !on(t, startOfYear)) continue;
    const name = t.category?.name ?? UNCATEGORIZED;
    catMap.set(name, (catMap.get(name) ?? 0) + Number(t.amount));
  }
  const expensesByCategory = [...catMap.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Trailing 6-month series (oldest → newest).
  const monthlySeries: MonthlyPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const rev = sum((t) => isRevenue(t) && t.occurred_on.startsWith(key));
    const exp = sum((t) => isExpense(t) && t.occurred_on.startsWith(key));
    monthlySeries.push({
      month: key,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      revenue: rev,
      expense: exp,
      net: rev - exp,
    });
  }

  // Burn rate = average monthly expense over the last 3 *full* months.
  const lastThreeFull = monthlySeries.slice(-4, -1); // exclude current partial month
  const monthlyBurn =
    lastThreeFull.length > 0
      ? lastThreeFull.reduce((a, m) => a + m.expense, 0) / lastThreeFull.length
      : expenses.month;

  const runwayMonths = monthlyBurn > 0 ? cashBalance / monthlyBurn : null;

  const netCashFlow30d =
    sum((t) => isRevenue(t) && on(t, ymd(thirtyDaysAgo))) -
    sum((t) => isExpense(t) && on(t, ymd(thirtyDaysAgo)));

  // MoM growth using the two most recent full months.
  const full = monthlySeries.slice(-3, -1); // [prior, last]
  const [prior, last] = full.length === 2 ? full : [undefined, undefined];
  const pct = (from: number, to: number) =>
    from > 0 ? ((to - from) / from) * 100 : null;
  const revenueGrowthMoM = prior && last ? pct(prior.revenue, last.revenue) : null;
  const expenseTrendPct = prior && last ? pct(prior.expense, last.expense) : null;

  return {
    cashBalance,
    revenue,
    expenses,
    profitLoss: { month: revenue.month - expenses.month, ytd: revenue.ytd - expenses.ytd },
    expensesByCategory,
    monthlyBurn,
    runwayMonths,
    netCashFlow30d,
    revenueGrowthMoM,
    expenseTrendPct,
    monthlySeries,
    transactionCount: txns.length,
  };
}
