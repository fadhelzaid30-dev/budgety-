"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CircleAlert,
  Layers,
  Plus,
  Receipt,
  Scale,
  Search,
  SlidersHorizontal,
  Split,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge, EmptyState, TONE_CLASSES, type Tone } from "@/components/ui/misc";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  deleteRecurrenceGroup,
  deleteTransaction,
  recategorizeTransaction,
  splitTransaction,
} from "@/lib/actions/transactions";
import type { Category, Transaction } from "@/types";

/**
 * Today as local yyyy-mm-dd. `toISOString()` is UTC, so west of UTC after
 * ~16:00 local it returned tomorrow's date and pre-filled the wrong day on the
 * add-transaction form. Same class of bug as the one fixed in aggregates.ts.
 */
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};
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
  tone: Tone;
  label: string;
  value: string;
  sub?: string;
  valueTone?: "success" | "danger";
  subTone?: "primary";
}) {
  // Uses the shared TONE_CLASSES rather than a private copy — the copy that
  // used to live here had already drifted (bg-primary-soft vs bg-primary/10).
  return (
    <Card className="flex gap-4 p-5">
      <span className={`w-1 shrink-0 self-stretch rounded-full ${TONE_CLASSES[tone].split(" ")[0]}`} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm text-muted">{label}</span>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${TONE_CLASSES[tone]}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <span
          className={`text-2xl font-bold tabular-nums ${valueTone === "success" ? "text-success" : valueTone === "danger" ? "text-danger" : "text-foreground"}`}
        >
          {value}
        </span>
        {sub ? (
          <span className={`text-xs ${subTone === "primary" ? "font-medium text-primary" : "text-muted"}`}>
            {sub}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

/**
 * Filter bar.
 *
 * Search and type sit on the always-visible row because they're used most; the
 * four narrower selects collapse behind a "More filters" disclosure so the
 * default state is two controls rather than six competing for attention. The
 * disclosure opens automatically when one of the hidden filters is active, so a
 * filter is never silently applied out of sight.
 */
export function TransactionFilters({
  categories,
  current,
  hasFilters,
}: {
  categories: Category[];
  current: { q?: string; category?: string; type?: string; frequency?: string; year?: string; month?: string };
  hasFilters: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const advancedActive = Boolean(current.category || current.frequency || current.year || current.month);
  const [showAdvanced, setShowAdvanced] = useState(advancedActive);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/transactions?${next.toString()}`);
  }

  const advancedCount = [current.category, current.frequency, current.year, current.month].filter(
    Boolean,
  ).length;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <Label htmlFor="f-search">Search</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
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
              { value: "revenue", label: "Money in" },
              { value: "expense", label: "Money out" },
            ]}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
        >
          <SlidersHorizontal className="h-4 w-4" />
          More filters
          {advancedCount > 0 ? (
            <Badge tone="primary" className="ml-0.5">{advancedCount}</Badge>
          ) : null}
        </Button>
        {hasFilters ? (
          <Link href="/transactions">
            <Button variant="ghost">Clear</Button>
          </Link>
        ) : null}
      </div>

      {showAdvanced ? (
        <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
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
      ) : null}
    </Card>
  );
}

export function TransactionList({
  transactions,
  categories,
  hasFilters = false,
}: {
  transactions: Transaction[];
  categories: Category[];
  /** True when any search/filter is active, so the empty state can say so. */
  hasFilters?: boolean;
}) {
  if (transactions.length === 0) {
    // Distinguishes "you have nothing" from "your filters matched nothing" —
    // the same bare message for both made an over-narrow filter look like data
    // loss.
    const filtered = hasFilters;
    return filtered ? (
      <EmptyState
        icon={Search}
        title="No transactions match these filters"
        description="Nothing here fits the search and filters you've set. Try widening them."
        action={
          <Link href="/transactions">
            <Button variant="outline">Clear all filters</Button>
          </Link>
        }
      />
    ) : (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Add them one at a time, or import a CSV straight from your bank — Budgety will categorise them for you."
        action={
          <Link href="/transactions/import">
            <Button>
              <Upload className="h-4 w-4" /> Import from CSV
            </Button>
          </Link>
        }
        secondaryAction={
          <span className="text-sm text-muted">
            or use <strong className="font-medium text-foreground">Add transaction</strong> above
          </span>
        }
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
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">Description</th>
              <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Category</th>
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
  const toast = useToast();
  const [pending, start] = useTransition();
  const [splitOpen, setSplitOpen] = useState(false);
  const [confirming, setConfirming] = useState<null | "one" | "series">(null);
  const [working, setWorking] = useState(false);
  const cats = categories.filter((c) => c.kind === tx.type);
  const isChild = Boolean(tx.parent_transaction_id);
  const isRecurring = Boolean(tx.recurrence_group_id);

  function recategorize(categoryId: string) {
    start(async () => {
      const res = await recategorizeTransaction(tx.id, categoryId || null);
      if (!res.ok) {
        toast.show(res.error, "error");
        return;
      }
      toast.show("Category updated.");
      router.refresh();
    });
  }

  // Native confirm() gave no context about what was being destroyed — and for
  // the recurring case, "this" was up to 26 transactions.
  async function doDelete() {
    setWorking(true);
    try {
      const res =
        confirming === "series" && tx.recurrence_group_id
          ? await deleteRecurrenceGroup(tx.recurrence_group_id)
          : await deleteTransaction(tx.id);
      if (!res.ok) {
        toast.show(res.error, "error");
        return;
      }
      toast.show(
        confirming === "series"
          ? `Deleted the whole ${tx.recurrence_frequency} series.`
          : "Transaction deleted.",
      );
      router.refresh();
    } finally {
      setWorking(false);
      setConfirming(null);
    }
  }

  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-accent/40">
        {/* Date and category collapse below `lg`: five columns can't fit a
            375px screen, and horizontal scrolling on a data table is the worst
            of the options. The date moves under the description instead. */}
        <td className="hidden whitespace-nowrap px-4 py-3 text-xs tabular-nums text-muted lg:table-cell">
          {formatDate(tx.occurred_on)}
        </td>
        <td className="px-4 py-3">
          <span className="text-foreground">
            {tx.description || <span className="text-muted">No description</span>}
          </span>
          {isChild ? <span className="ml-2 text-xs text-muted">(split)</span> : null}
          {isRecurring ? (
            <span className="ml-2 text-xs text-muted">({tx.recurrence_frequency})</span>
          ) : null}
          <span className="mt-0.5 block text-xs text-muted lg:hidden">
            {formatDate(tx.occurred_on)}
            {tx.category?.name ? ` · ${tx.category.name}` : " · Uncategorized"}
          </span>
        </td>
        <td className="hidden px-4 py-3 lg:table-cell">
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
        <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
          <span className={tx.type === "revenue" ? "text-success" : "text-foreground"}>
            {tx.type === "revenue" ? "+" : "−"}
            {formatCurrency(Number(tx.amount))}
          </span>
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
                onClick={() => setConfirming("series")}
                disabled={pending}
                aria-label={`Delete entire ${tx.recurrence_frequency} series`}
                title={`Delete entire ${tx.recurrence_frequency} series`}
              >
                <Layers className="h-4 w-4 text-danger" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirming("one")}
              disabled={pending}
              aria-label="Delete transaction"
            >
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
      {confirming ? (
        <tr>
          <td>
            <ConfirmDialog
              open
              loading={working}
              onConfirm={doDelete}
              onCancel={() => setConfirming(null)}
              title={
                confirming === "series"
                  ? `Delete the entire ${tx.recurrence_frequency} series?`
                  : "Delete this transaction?"
              }
              confirmLabel={confirming === "series" ? "Delete series" : "Delete"}
              description={
                confirming === "series" ? (
                  <>
                    This removes <strong>every</strong> transaction generated by this{" "}
                    {tx.recurrence_frequency} series — not just this one. It can&apos;t be
                    undone.
                  </>
                ) : (
                  <>
                    {tx.description || "This transaction"} ·{" "}
                    {formatCurrency(Number(tx.amount))} on {formatDate(tx.occurred_on)}.
                    This can&apos;t be undone.
                  </>
                )
              }
            />
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
      {error ? <Alert tone="danger">{error}</Alert> : null}
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
