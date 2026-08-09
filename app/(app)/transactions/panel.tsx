"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { FileUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  createRecurringTransactions,
  createTransaction,
} from "@/lib/actions/transactions";
import {
  guessColumn,
  normalizeRows,
  type ColumnMapping,
  type RawRow,
} from "@/lib/csv/mapping";
import { today, yearOptions } from "./ui";
import type { Category } from "@/types";

type Tab = "manual" | "csv";

/** Navigate to the month/year of a newly added transaction, clearing other filters
 * so it's guaranteed to be visible in the list the user lands on. */
function navigateToMonth(router: ReturnType<typeof useRouter>, isoDate: string) {
  const [y, m] = isoDate.split("-");
  router.push(`/transactions?year=${y}&month=${Number(m)}`);
}

export function AddTransactionPanel({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("manual");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function close() {
    setOpen(false);
    setTab("manual");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add transaction
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            aria-label="Close panel"
            tabIndex={-1}
            className="absolute inset-0 bg-foreground/30"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-tx-heading"
            className="relative flex h-full w-full max-w-md flex-col bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="add-tx-heading" className="font-semibold text-foreground">
                Add transaction
              </h2>
              <Button ref={closeButtonRef} variant="ghost" size="icon" onClick={close} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div role="tablist" aria-label="Add transaction method" className="flex border-b border-border px-5">
              {(["manual", "csv"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                    tab === t
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {t === "manual" ? "Manual entry" : "Import CSV"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "manual" ? (
                <ManualForm categories={categories} onDone={close} />
              ) : (
                <CsvTab onDone={close} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ordinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function ManualForm({ categories, onDone }: { categories: Category[]; onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [repeats, setRepeats] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    occurred_on: today(),
    description: "",
    type: "expense" as "revenue" | "expense",
    category_id: "",
    frequency: "monthly" as "monthly" | "biweekly",
    year: new Date().getFullYear(),
  });

  const cats = categories.filter((c) => c.kind === form.type);

  function submit() {
    setError(null);
    start(async () => {
      if (repeats) {
        const res = await createRecurringTransactions({
          amount: form.amount,
          description: form.description,
          type: form.type,
          category_id: form.category_id || null,
          frequency: form.frequency,
          year: form.year,
          anchor_date: form.occurred_on,
        });
        if (!res.ok) return setError(res.error);
        toast.show(
          `Created ${res.data.count} ${form.frequency} transaction${res.data.count === 1 ? "" : "s"} for ${form.year}.`,
        );
        onDone();
        navigateToMonth(router, form.occurred_on);
        return;
      }
      const res = await createTransaction({
        amount: form.amount,
        occurred_on: form.occurred_on,
        description: form.description,
        type: form.type,
        category_id: form.category_id || null,
      });
      if (!res.ok) return setError(res.error);
      toast.show("Transaction added.");
      onDone();
      navigateToMonth(router, form.occurred_on);
    });
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div>
        <Label>Type</Label>
        <div role="group" aria-label="Transaction type" className="flex gap-2">
          {(["expense", "revenue"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={form.type === t}
              onClick={() => setForm({ ...form, type: t, category_id: "" })}
              className={cn(
                "flex-1 rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors",
                form.type === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted hover:text-foreground",
              )}
            >
              {t === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="p-amount">Amount (USD)</Label>
        <Input
          id="p-amount"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          autoFocus
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="p-date">{repeats ? "Anchor date" : "Date"}</Label>
        <Input
          id="p-date"
          type="date"
          value={form.occurred_on}
          onChange={(e) => setForm({ ...form, occurred_on: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="p-desc">Description</Label>
        <Input
          id="p-desc"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Google Ads, payroll, client invoice…"
        />
      </div>

      <div>
        <Label>Category</Label>
        <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={form.category_id === ""}
            onClick={() => setForm({ ...form, category_id: "" })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              form.category_id === ""
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted hover:text-foreground",
            )}
          >
            Auto-categorize
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={form.category_id === c.id}
              onClick={() => setForm({ ...form, category_id: c.id })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                form.category_id === c.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted hover:text-foreground",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Repeat this transaction
        </label>
        {repeats ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="p-freq">Frequency</Label>
              <select
                id="p-freq"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as "monthly" | "biweekly" })}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
              >
                <option value="monthly">Monthly (Jan–Dec)</option>
                <option value="biweekly">Biweekly</option>
              </select>
            </div>
            <div>
              <Label htmlFor="p-year">Year</Label>
              <select
                id="p-year"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
              >
                {yearOptions().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="col-span-2 text-xs text-muted">
              {form.frequency === "monthly"
                ? `Creates one transaction per month (Jan–Dec ${form.year}), on the ${new Date(form.occurred_on).getDate()}${ordinalSuffix(new Date(form.occurred_on).getDate())} of each month.`
                : `Creates a transaction every 2 weeks across all of ${form.year}.`}
            </p>
          </div>
        ) : null}
      </div>

      <Button onClick={submit} disabled={pending || !form.amount} className="w-full">
        {pending ? "Saving…" : repeats ? "Create series" : "Add transaction"}
      </Button>
    </div>
  );
}

const EXAMPLE_ROWS = [
  { date: "2026-07-15", description: "Staff payroll", amount: "19000", type: "Expense" },
  { date: "2026-07-17", description: "Patient payment - crowns", amount: "14500", type: "Revenue" },
];

function CsvTab({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);

  function onFile(file: File) {
    setError(null);
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hdrs = (res.meta.fields ?? []).filter(Boolean);
        if (hdrs.length === 0 || res.data.length === 0) {
          setError("Couldn't read any rows. Is this a CSV with a header row?");
          return;
        }
        const date = guessColumn(hdrs, ["date", "posted", "time"]);
        const amount = guessColumn(hdrs, ["amount", "debit", "value", "total"]);
        const description = guessColumn(hdrs, ["description", "memo", "name", "detail", "payee"]);
        const typeColumn = guessColumn(hdrs, ["type", "direction", "dr/cr", "debit/credit", "flow"]);
        if (!date || !amount) {
          setError(
            "Couldn't detect Date and Amount columns automatically. Match your file to the example format above, or use advanced import for custom column mapping.",
          );
          return;
        }
        setRows(res.data);
        setMapping({
          date,
          amount,
          description,
          typeStrategy: typeColumn ? "column" : "sign",
          typeColumn,
          expenseIsNegative: true,
        });
      },
      error: (err) => setError(err.message),
    });
  }

  const preview = mapping ? normalizeRows(rows.slice(0, 500), mapping) : null;

  async function confirmImport() {
    if (!mapping) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, mapping }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      toast.show(`Imported ${data.imported} transaction${data.imported === 1 ? "" : "s"}.`);
      onDone();
      const firstDate = preview?.valid[0]?.occurred_on;
      if (firstDate) navigateToMonth(router, firstDate);
      else router.refresh();
    } catch {
      setError("Network error during import.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {!mapping ? (
        <>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Expected format</p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-accent/40 text-left uppercase text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLE_ROWS.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-muted">{r.date}</td>
                      <td className="px-3 py-2">{r.description}</td>
                      <td className="px-3 py-2">{r.amount}</td>
                      <td className="px-3 py-2">{r.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">
              Budgety assigns categories automatically. Column names can vary slightly (e.g. &quot;Posted
              Date&quot;) — we&apos;ll try to match them.
            </p>
          </div>

          <label
            htmlFor="p-csv-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center hover:bg-accent"
          >
            <FileUp className="h-7 w-7 text-muted" />
            <span className="text-sm font-medium text-foreground">Choose a CSV file</span>
            <input
              id="p-csv-file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>

          <p className="text-xs text-muted">
            Need to map custom columns?{" "}
            <Link href="/transactions/import" className="text-primary underline">
              Use advanced import
            </Link>
            .
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Confirm import</p>
            <span className="text-xs text-muted">
              {preview?.valid.length ?? 0} valid · {preview?.errors.length ?? 0} skipped (of {rows.length})
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-accent/40 text-left uppercase text-muted">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {preview?.valid.slice(0, 8).map((t, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-muted">{formatDate(t.occurred_on)}</td>
                    <td className="px-3 py-2">{t.description || "—"}</td>
                    <td className="px-3 py-2 capitalize">{t.type}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setMapping(null);
                setRows([]);
              }}
            >
              Choose another file
            </Button>
            <Button onClick={confirmImport} disabled={busy || (preview?.valid.length ?? 0) === 0}>
              {busy ? "Importing…" : `Import ${rows.length} rows`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
