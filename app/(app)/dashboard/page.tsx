import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  MessageSquare,
  Plus,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { HealthScoreCard } from "@/components/dashboard/health-score";
import { InsightCard } from "@/components/dashboard/insight-card";
import { Sparkline } from "@/components/dashboard/sparkline";
import { RevenueExpenseChart, ExpenseBreakdownChart } from "@/components/dashboard/charts";
import {
  getCurrentBusiness,
  getFinancialSnapshot,
  getTransactions,
  maybeSnapshotHealthScore,
} from "@/lib/data/queries";
import { buildInsights } from "@/lib/finance/insights";
import { CHART_DANGER, CHART_PRIMARY, CHART_SUCCESS } from "@/lib/tokens";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — Budgety" };

export default async function DashboardPage() {
  const business = (await getCurrentBusiness())!;
  const { aggregates: a, health } = await getFinancialSnapshot(business);
  await maybeSnapshotHealthScore(business.id, health);

  if (a.transactionCount === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>
        <EmptyState
          icon={Receipt}
          title="No financial data yet"
          description="Add a few transactions or import a CSV from your bank, and your cash position, health score, and spending breakdown will appear here."
          action={
            <Link href="/transactions">
              <Button>
                <Plus className="h-4 w-4" /> Add your first transaction
              </Button>
            </Link>
          }
          secondaryAction={
            <Link href="/transactions/import">
              <Button variant="outline">
                <Upload className="h-4 w-4" /> Import from CSV
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const insights = buildInsights(a);
  const recent = await getTransactions(business.id, { limit: 6 });
  const series = a.monthlySeries;

  // Top 5 categories plus an "Other" bucket — a donut stops being readable past
  // about five slices, and this previously drew up to eight.
  const top = a.expensesByCategory.slice(0, 5);
  const rest = a.expensesByCategory.slice(5).reduce((s, c) => s + c.amount, 0);
  const breakdown = rest > 0 ? [...top, { name: "Other", amount: rest }] : top;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted">
            {a.transactionCount} transaction{a.transactionCount === 1 ? "" : "s"} tracked
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Add transaction
            </Button>
          </Link>
          <Link href="/transactions/import">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
          </Link>
          <Link href="/assistant">
            <Button size="sm">
              <MessageSquare className="h-4 w-4" /> Ask the AI CFO
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Cash position"
          value={formatCurrency(a.cashBalance)}
          sub={a.runwayMonths == null ? "Runway not established" : `${a.runwayMonths.toFixed(1)} months of runway`}
          subtone={a.runwayMonths != null && a.runwayMonths < 3 ? "danger" : undefined}
          spark={series.map((m) => m.net)}
          sparkColor={CHART_PRIMARY}
        />
        <Stat
          icon={TrendingUp}
          label="Revenue (this month)"
          value={formatCurrency(a.revenue.month)}
          sub={`${formatPercent(a.revenueGrowthMoM)} vs last month`}
          subtone={a.revenueGrowthMoM != null && a.revenueGrowthMoM >= 0 ? "success" : "danger"}
          spark={series.map((m) => m.revenue)}
          sparkColor={CHART_SUCCESS}
        />
        <Stat
          icon={TrendingDown}
          label="Expenses (this month)"
          value={formatCurrency(a.expenses.month)}
          sub={`${formatCurrency(a.monthlyBurn)}/mo average burn`}
          spark={series.map((m) => m.expense)}
          sparkColor={CHART_DANGER}
        />
        <Stat
          icon={Scale}
          label="Profit / loss (this month)"
          value={formatCurrency(a.profitLoss.month)}
          sub={a.profitLoss.month >= 0 ? "In the black" : "In the red"}
          subtone={a.profitLoss.month >= 0 ? "success" : "danger"}
          spark={series.map((m) => m.net)}
          sparkColor={a.profitLoss.month >= 0 ? CHART_SUCCESS : CHART_DANGER}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HealthScoreCard health={health} />
        </div>
        <div className="space-y-6">
          <InsightCard insights={insights} />
          <Card>
            <CardHeader>
              <CardTitle>Year to date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3 text-sm">
              <Row label="Revenue" value={formatCurrency(a.revenue.ytd)} />
              <Row label="Expenses" value={formatCurrency(a.expenses.ytd)} />
              <Row
                label="Profit / loss"
                value={formatCurrency(a.profitLoss.ytd)}
                tone={a.profitLoss.ytd >= 0 ? "success" : "danger"}
              />
              <Row label="Net cash flow (30d)" value={formatCurrency(a.netCashFlow30d)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs. expenses</CardTitle>
            <span className="text-xs text-muted">Last 6 months</span>
          </CardHeader>
          <CardContent className="pt-3">
            <RevenueExpenseChart data={series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Where the money goes</CardTitle>
            <span className="text-xs text-muted">Year to date</span>
          </CardHeader>
          <CardContent className="pt-3">
            <ExpenseBreakdownChart data={breakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            See all <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </CardHeader>
        <CardContent className="pt-3">
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t, i) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 py-3 animate-rise-in"
                  style={{ "--stagger-index": i } as React.CSSProperties}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        t.type === "revenue" ? "bg-success/10 text-success" : "bg-surface-sunken text-muted"
                      }`}
                    >
                      {t.type === "revenue" ? (
                        <TrendingUp className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {t.description || "No description"}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDate(t.occurred_on)}
                        {t.category?.name ? ` · ${t.category.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium tabular-nums ${
                      t.type === "revenue" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {t.type === "revenue" ? "+" : "−"}
                    {formatCurrency(Number(t.amount))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  subtone,
  spark,
  sparkColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  subtone?: "success" | "danger";
  spark?: number[];
  sparkColor?: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{label}</span>
          <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {spark ? <Sparkline values={spark} color={sparkColor} /> : null}
        </div>
        {sub ? (
          <p
            className={`mt-1 text-xs ${
              subtone === "success" ? "text-success" : subtone === "danger" ? "text-danger" : "text-muted"
            }`}
          >
            {sub}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span
        className={`font-medium tabular-nums ${
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
