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
} from "@/lib/chart-colors";

export function RevenueExpenseChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke={CHART_AXIS} />
        <YAxis
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke={CHART_AXIS}
          width={48}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ borderRadius: 8, border: `1px solid ${CHART_GRID}`, fontSize: 13 }}
        />
        <Bar dataKey="revenue" name="Revenue" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill={CHART_WARNING} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpenseBreakdownChart({
  data,
}: {
  data: { name: string; amount: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">No expenses yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{ borderRadius: 8, border: `1px solid ${CHART_GRID}`, fontSize: 13 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
