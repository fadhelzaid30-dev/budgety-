"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CircleAlert,
  Layers,
  Plus,
  Scale,
  Search,
  Split,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge, EmptyState } from "@/components/ui/misc";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  deleteRecurrenceGroup,
  deleteTransaction,
  recategorizeTransaction,
  splitTransaction,
} from "@/lib/actions/transactions";
import type { Category, Transaction } from "@/types";

export const today = () => new Date().toISOString().slice(0, 10);
export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
/** Years offered in the recurrence/filter year selects: a window around today. */
export function yearOptions() {
  const y = new Date().getFullYear();
  const years: number[] = [];
  for (let i = y - 2; i <= y + 2; i++) years.push(i);
  return years;
}

export function TransactionStats({ transactions }: { transactions: Transaction[] }) {
  const moneyIn = transactions.filter((t) => t.type === "revenue");
  const moneyOut = transactions.filter((t) => t.type === "expense");
  const inTotal = moneyIn.reduce((sum, t) => sum + Number(t.amount), 0);
  const outTotal = moneyOut.reduce((sum, t) => sum + Number(t.amount), 0);
  const net = inTotal - outTotal;
  const uncategorized = transactions.filter((t) => !t.category_id).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={TrendingUp}
        tone="primary"
        label="Money in"
        value={formatCurrency(inTotal)}
        sub={`${moneyIn.length} transaction${moneyIn.length === 1 ? "" : "s"}`}
      />
      <StatCard
        icon={TrendingDown}
        tone="warning"
        label="Money out"
        value={formatCurrency(outTotal)}
        sub={`${moneyOut.length} transaction${moneyOut.length === 1 ? "" : "s"}`}
      />
      <StatCard
        icon={Scale}
        tone={net >= 0 ? "success" : "danger"}
        label="Net"
        value={`${net >= 0 ? "+" : "−"}${formatCurrency(Math.abs(net))}`}
        valueTone={net >= 0 ? "success" : "danger"}
      />
      <StatCard
        icon={CircleAlert}
        tone="warning"
        label="Uncategorized"
        value={String(uncategorized)}
        sub={uncategorized > 0 ? "Categorize now" : "All caught up"}
        subTone="primary"
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  valueTone,
  subTone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "warning" | "success" | "danger";
  label: string;
  value: string;
  sub?: string;
  valueTone?: "success" | "danger";
  subTone?: "primary";
}) {
  const toneClasses: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
  };
  return (
    <Card className="flex gap-4 p-6">
      <span className={`w-1 shrink-0 self-stretch rounded-full ${toneClasses[tone].split(" ")[0]}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm text-muted">{label}</span>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <span
          className={`text-2xl font-bold ${valueTone === "success" ? "text-success" : valueTone === "danger" ? "text-danger" : "text-foreground"}`}
        >
          {value}
        </span>
        {sub ? (
          <span className={`text-xs ${subTone === "primary" ? "font-medium text-primary" : "text-muted-soft"}`}>
            {sub}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function TransactionFilters({
  categories,
  current,
}: {
  categories: Category[];
  current: { q?: string; category?: string; type?: string; frequency?: string; year?: string; month?: string };
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/transactions?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-52 flex-1">
        <Label htmlFor="f-search">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            id="f-search"
            defaultValue={current.q ?? ""}
            placeholder="Search descriptions…"
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("q", (e.target as HTMLInputElement).value);
            }}
            onBlur={(e) => setParam("q", e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label>Type</Label>
        <ToggleGroup
          variant="segmented"
          label="Filter by type"
          value={(current.type as "" | "revenue" | "expense") ?? ""}
          onChange={(v) => setParam("type", v)}
          options={[
            { value: "", label: "All" },
            { value: "revenue", label: "Revenue" },
            { value: "expense", label: "Expense" },
          ]}
        />
      </div>
      <div>
        <Label htmlFor="f-cat">Category</Label>
        <Select
          id="f-cat"
          defaultValue={current.category ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="f-freq">Frequency</Label>
        <Select
          id="f-freq"
          defaultValue={current.frequency ?? ""}
          onChange={(e) => setParam("frequency", e.target.value)}
        >
          <option value="">All</option>
          <option value="one-time">One-time</option>
          <option value="monthly">Monthly series</option>
          <option value="biweekly">Biweekly series</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="f-year">Year</Label>
        <Select
          id="f-year"
          defaultValue={current.year ?? ""}
          onChange={(e) => setParam("year", e.target.value)}
        >
          <option value="">All years</option>
          {yearOptions().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="f-month">Month</Label>
        <Select
          id="f-month"
          defaultValue={current.month ?? ""}
          onChange={(e) => setParam("month", e.target.value)}
        >
          <option value="">All months</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export function TransactionList({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Add one above or import a CSV to build your financial picture."
      />
    );
  }

  // Group consecutive rows by month (list is already sorted newest-first) so
  // businesses can see their transactions organized Jan–Dec at a glance.
  const monthKeys = transactions.map((t) => t.occurred_on.slice(0, 7));
  const monthNet: Record<string, number> = {};
  transactions.forEach((t, i) => {
    const key = monthKeys[i];
    monthNet[key] = (monthNet[key] ?? 0) + (t.type === "revenue" ? Number(t.amount) : -Number(t.amount));
  });

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Your transactions</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-soft">
              <th scope="col" className="px-4 py-3 font-medium">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">Description</th>
              <th scope="col" className="px-4 py-3 font-medium">Category</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => {
              const [y, m] = t.occurred_on.split("-");
              const showHeader = i === 0 || monthKeys[i] !== monthKeys[i - 1];
              return (
                <MonthGroupedRow
                  key={t.id}
                  tx={t}
                  categories={categories}
                  monthLabel={showHeader ? `${MONTH_NAMES[Number(m) - 1]} ${y}` : null}
                  monthNet={showHeader ? monthNet[monthKeys[i]] : null}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MonthGroupedRow({
  tx,
  categories,
  monthLabel,
  monthNet,
}: {
  tx: Transaction;
  categories: Category[];
  monthLabel: string | null;
  monthNet: number | null;
}) {
  return (
    <>
      {monthLabel ? (
        <tr>
          <th
            scope="colgroup"
            colSpan={5}
            className="bg-surface-sunken-2 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
          >
            <div className="flex items-center justify-between">
              <span>{monthLabel}</span>
              <span className="font-mono font-medium normal-case tracking-normal">
                Net {monthNet != null && monthNet >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(monthNet ?? 0))}
              </span>
            </div>
          </th>
        </tr>
      ) : null}
      <TransactionRow tx={tx} categories={categories} />
    </>
  );
}

function TransactionRow({ tx, categories }: { tx: Transaction; categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [splitOpen, setSplitOpen] = useState(false);
  const cats = categories.filter((c) => c.kind === tx.type);
  const isChild = Boolean(tx.parent_transaction_id);
  const isRecurring = Boolean(tx.recurrence_group_id);

  function recategorize(categoryId: string) {
    start(async () => {
      await recategorizeTransaction(tx.id, categoryId || null);
      router.refresh();
    });
  }
  function remove() {
    if (!confirm("Delete this transaction?")) return;
    start(async () => {
      await deleteTransaction(tx.id);
      router.refresh();
    });
  }
  function removeSeries() {
    if (!tx.recurrence_group_id) return;
    if (!confirm(`Delete this entire ${tx.recurrence_frequency} series? This removes every transaction it generated.`))
      return;
    start(async () => {
      await deleteRecurrenceGroup(tx.recurrence_group_id!);
      router.refresh();
    });
  }

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-soft">
          {formatDate(tx.occurred_on)}
        </td>
        <td className="px-4 py-3">
          {tx.description || <span className="text-muted">—</span>}
          {isChild ? <span className="ml-2 text-xs text-muted">(split)</span> : null}
          {isRecurring ? (
            <span className="ml-2 text-xs text-muted">({tx.recurrence_frequency})</span>
          ) : null}
        </td>
        <td className="px-4 py-3">
          <Select
            aria-label="Category"
            value={tx.category_id ?? ""}
            onChange={(e) => recategorize(e.target.value)}
            disabled={pending}
            className="h-8 text-xs"
          >
            <option value="">Uncategorized</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </td>
        <td className="px-4 py-3 text-right font-mono font-medium">
          <span className={tx.type === "revenue" ? "text-success" : "text-foreground"}>
            {tx.type === "revenue" ? "+" : "−"}
            {formatCurrency(Number(tx.amount))}
          </span>
          <div className="font-sans">
            <Badge tone={tx.type === "revenue" ? "success" : "default"}>{tx.type}</Badge>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-1">
            {!isChild ? (
              <Button variant="ghost" size="icon" onClick={() => setSplitOpen(true)} aria-label="Split transaction">
                <Split className="h-4 w-4" />
              </Button>
            ) : null}
            {isRecurring ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={removeSeries}
                disabled={pending}
                aria-label={`Delete entire ${tx.recurrence_frequency} series`}
                title={`Delete entire ${tx.recurrence_frequency} series`}
              >
                <Layers className="h-4 w-4 text-danger" />
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" onClick={remove} disabled={pending} aria-label="Delete transaction">
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        </td>
      </tr>
      {splitOpen ? (
        <tr>
          <td colSpan={5} className="bg-accent/50 px-4 py-4">
            <SplitForm tx={tx} categories={cats} onClose={() => setSplitOpen(false)} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function SplitForm({
  tx,
  categories,
  onClose,
}: {
  tx: Transaction;
  categories: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [parts, setParts] = useState([
    { amount: "", category_id: tx.category_id ?? "" },
    { amount: "", category_id: tx.category_id ?? "" },
  ]);

  const total = parts.reduce((a, p) => a + (Number(p.amount) || 0), 0);
  const target = Number(tx.amount);

  function submit() {
    setError(null);
    start(async () => {
      const res = await splitTransaction(
        tx.id,
        parts.map((p) => ({ amount: p.amount, category_id: p.category_id || null })),
      );
      if (!res.ok) return setError(res.error);
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        Split {formatCurrency(target)} into parts (must add up to the total)
      </p>
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      {parts.map((p, i) => (
        <div key={i} className="flex gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={p.amount}
            onChange={(e) => {
              const next = [...parts];
              next[i] = { ...next[i], amount: e.target.value };
              setParts(next);
            }}
            aria-label={`Part ${i + 1} amount`}
          />
          <Select
            value={p.category_id}
            onChange={(e) => {
              const next = [...parts];
              next[i] = { ...next[i], category_id: e.target.value };
              setParts(next);
            }}
            aria-label={`Part ${i + 1} category`}
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setParts([...parts, { amount: "", category_id: "" }])}
        >
          <Plus className="h-4 w-4" /> Add part
        </Button>
        <span className={`text-sm ${Math.abs(total - target) < 0.01 ? "text-success" : "text-muted"}`}>
          {formatCurrency(total)} / {formatCurrency(target)}
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={pending || Math.abs(total - target) >= 0.01}>
            Split
          </Button>
        </div>
      </div>
    </div>
  );
}
