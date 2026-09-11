"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyPoint } from "@/lib/finance/aggregates";
import { formatCurrency } from "@/lib/utils";
import {
  CHART_CATEGORICAL,
  CHART_GRID,
  CHART_AXIS,
  CHART_PRIMARY,
  CHART_WARNING,
  CHART_OTHER,
} from "@/lib/tokens";

/** Shared tooltip chrome so both charts read as the same system. */
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: `1px solid ${CHART_GRID}`,
  boxShadow: "0 12px 28px rgba(27, 27, 58, 0.12)",
  fontSize: 13,
  padding: "8px 12px",
} as const;

export function RevenueExpenseChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted">
        <Legend color={CHART_PRIMARY} label="Revenue" />
        <Legend color={CHART_WARNING} label="Expenses" />
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke={CHART_AXIS}
            dy={4}
          />
          <YAxis
            tickFormatter={(v) => (v === 0 ? "0" : `$${Math.round(v / 1000)}k`)}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke={CHART_AXIS}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "rgba(77, 68, 181, 0.06)" }}
            formatter={(value, name) => [formatCurrency(Number(value)), name]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey="revenue" name="Revenue" fill={CHART_PRIMARY} radius={[5, 5, 0, 0]} maxBarSize={38} />
          <Bar dataKey="expense" name="Expenses" fill={CHART_WARNING} radius={[5, 5, 0, 0]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseBreakdownChart({
  data,
}: {
  data: { name: string; amount: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">No expenses recorded yet.</p>;
  }

  const total = data.reduce((s, d) => s + d.amount, 0);
  const colorFor = (i: number, name: string) =>
    name === "Other" ? CHART_OTHER : CHART_CATEGORICAL[i % CHART_CATEGORICAL.length];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colorFor(i, d.name)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              contentStyle={TOOLTIP_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre total — a donut with a hole and nothing in it wastes the
            most readable spot in the chart. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted">Total</span>
          <span className="text-base font-bold tabular-nums text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: colorFor(i, d.name) }}
                aria-hidden="true"
              />
              <span className="truncate text-muted">{d.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-foreground">
              {formatCurrency(d.amount)}
              <span className="ml-1.5 text-xs text-muted">
                {Math.round((d.amount / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}
