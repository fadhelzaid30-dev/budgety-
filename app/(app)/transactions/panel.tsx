"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { FileUp, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { useToast } from "@/components/ui/toast";
import { Alert } from "@/components/ui/alert";
import { formatCurrency, formatDate } from "@/lib/utils";
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

  function openTo(t: Tab) {
    setTab(t);
    setOpen(true);
  }

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
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => openTo("csv")}>
          <Upload className="h-4 w-4" /> Import CSV
        </Button>
        <Button onClick={() => openTo("manual")}>
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
      </div>

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

            <Tabs
              value={tab}
              onValueChange={setTab}
              label="Add transaction method"
              items={[
                { value: "manual", label: "Manual entry" },
                { value: "csv", label: "Import CSV" },
              ]}
            />

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
        <Alert tone="danger">
          {error}
        </Alert>
      ) : null}

      <div>
        <Label>Type</Label>
        <ToggleGroup
          label="Transaction type"
          value={form.type}
          onChange={(t) => setForm({ ...form, type: t, category_id: "" })}
          options={[
            { value: "expense", label: "Expense" },
            { value: "revenue", label: "Income" },
          ]}
        />
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
        <ToggleGroup
          label="Category"
          value={form.category_id}
          onChange={(id) => setForm({ ...form, category_id: id })}
          options={[
            { value: "", label: "Auto-categorize" },
            ...cats.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
      </div>

      <div className="rounded-md border border-border p-3">
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
              <Select
                id="p-freq"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as "monthly" | "biweekly" })}
              >
                <option value="monthly">Monthly (Jan–Dec)</option>
                <option value="biweekly">Biweekly</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="p-year">Year</Label>
              <Select
                id="p-year"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              >
                {yearOptions().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
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
      if (data.imported === 0) {
        setError(data.message ?? "Nothing was imported.");
        return;
      }
      const dupes = data.duplicatesSkipped ?? 0;
      toast.show(
        `Imported ${data.imported} transaction${data.imported === 1 ? "" : "s"}` +
          (dupes > 0 ? ` — skipped ${dupes} already in your account.` : "."),
      );
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
        <Alert tone="danger">
          {error}
        </Alert>
      ) : null}

      {!mapping ? (
        <>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Expected format</p>
            <div className="overflow-x-auto rounded-md border border-border">
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
          <div className="overflow-x-auto rounded-md border border-border">
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
