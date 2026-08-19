import Link from "next/link";
import { ArrowUpRight, Wallet, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { HealthScoreCard } from "@/components/dashboard/health-score";
import { RevenueExpenseChart, ExpenseBreakdownChart } from "@/components/dashboard/charts";
import {
  getCurrentBusiness,
  getFinancialSnapshot,
  maybeSnapshotHealthScore,
} from "@/lib/data/queries";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const business = (await getCurrentBusiness())!;
  const { aggregates: a, health } = await getFinancialSnapshot(business);
  await maybeSnapshotHealthScore(business.id, health);

  if (a.transactionCount === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h1>
        <EmptyState
          title="No financial data yet"
          description="Add transactions or import a CSV to see your revenue, expenses, cash position, and health score."
          action={
            <Link href="/transactions">
              <Button>Add transactions</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted">Financial overview</p>
        </div>
        <Link href="/assistant">
          <Button variant="outline">
            Ask the AI CFO <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Cash position"
          value={formatCurrency(a.cashBalance)}
          sub={a.runwayMonths == null ? "Runway n/a" : `${a.runwayMonths.toFixed(1)} mo runway`}
        />
        <Stat
          icon={TrendingUp}
          label="Revenue (MTD)"
          value={formatCurrency(a.revenue.month)}
          sub={`MoM ${formatPercent(a.revenueGrowthMoM)}`}
          subtone={a.revenueGrowthMoM != null && a.revenueGrowthMoM >= 0 ? "success" : "danger"}
        />
        <Stat
          icon={TrendingDown}
          label="Expenses (MTD)"
          value={formatCurrency(a.expenses.month)}
          sub={`Burn ${formatCurrency(a.monthlyBurn)}/mo`}
        />
        <Stat
          icon={Scale}
          label="Profit / Loss (MTD)"
          value={formatCurrency(a.profitLoss.month)}
          subtone={a.profitLoss.month >= 0 ? "success" : "danger"}
          sub={a.profitLoss.month >= 0 ? "In the black" : "In the red"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HealthScoreCard health={health} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>YTD summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Revenue YTD" value={formatCurrency(a.revenue.ytd)} />
            <Row label="Expenses YTD" value={formatCurrency(a.expenses.ytd)} />
            <Row
              label="Profit/Loss YTD"
              value={formatCurrency(a.profitLoss.ytd)}
              tone={a.profitLoss.ytd >= 0 ? "success" : "danger"}
            />
            <Row label="Net cash flow (30d)" value={formatCurrency(a.netCashFlow30d)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs. expenses (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueExpenseChart data={a.monthlySeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses by category (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdownChart data={a.expensesByCategory.slice(0, 8)} />
            <ul className="mt-3 space-y-1 text-sm">
              {a.expensesByCategory.slice(0, 5).map((c) => (
                <li key={c.name} className="flex justify-between">
                  <span className="text-muted">{c.name}</span>
                  <span className="text-foreground">{formatCurrency(c.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  subtone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  subtone?: "success" | "danger";
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">{label}</span>
          <Icon className="h-4 w-4 text-muted" />
        </div>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
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
        className={`font-medium ${
          tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
