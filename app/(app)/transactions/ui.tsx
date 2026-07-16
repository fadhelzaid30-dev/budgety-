"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Search, Split, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge, EmptyState } from "@/components/ui/misc";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  createTransaction,
  deleteTransaction,
  recategorizeTransaction,
  splitTransaction,
} from "@/lib/actions/transactions";
import type { Category, Transaction } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);

export function AddTransaction({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    amount: "",
    occurred_on: today(),
    description: "",
    type: "expense" as "revenue" | "expense",
    category_id: "",
  });

  const cats = categories.filter((c) => c.kind === form.type);

  function submit() {
    setError(null);
    start(async () => {
      const res = await createTransaction({
        amount: form.amount,
        occurred_on: form.occurred_on,
        description: form.description,
        type: form.type,
        category_id: form.category_id || null,
      });
      if (!res.ok) return setError(res.error);
      setForm({ ...form, amount: "", description: "" });
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add transaction
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">New transaction</h2>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error ? (
          <div role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="a-type">Type</Label>
            <Select
              id="a-type"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as "revenue" | "expense", category_id: "" })
              }
            >
              <option value="expense">Expense</option>
              <option value="revenue">Revenue</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="a-amount">Amount (USD)</Label>
            <Input
              id="a-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="a-date">Date</Label>
            <Input
              id="a-date"
              type="date"
              value={form.occurred_on}
              onChange={(e) => setForm({ ...form, occurred_on: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="a-desc">Description</Label>
            <Input
              id="a-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Google Ads, payroll, client invoice…"
            />
          </div>
          <div>
            <Label htmlFor="a-cat">Category</Label>
            <Select
              id="a-cat"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Auto-categorize</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={submit} disabled={pending || !form.amount}>
          {pending ? "Saving…" : "Save transaction"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function TransactionFilters({
  categories,
  current,
}: {
  categories: Category[];
  current: { q?: string; category?: string; type?: string };
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
        <Label htmlFor="f-type">Type</Label>
        <Select
          id="f-type"
          defaultValue={current.type ?? ""}
          onChange={(e) => setParam("type", e.target.value)}
        >
          <option value="">All types</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expense</option>
        </Select>
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
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Your transactions</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
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
            {transactions.map((t) => (
              <TransactionRow key={t.id} tx={t} categories={categories} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TransactionRow({ tx, categories }: { tx: Transaction; categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [splitOpen, setSplitOpen] = useState(false);
  const cats = categories.filter((c) => c.kind === tx.type);
  const isChild = Boolean(tx.parent_transaction_id);

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

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(tx.occurred_on)}</td>
        <td className="px-4 py-3">
          {tx.description || <span className="text-muted">—</span>}
          {isChild ? <span className="ml-2 text-xs text-muted">(split)</span> : null}
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
        <td className="px-4 py-3 text-right font-medium">
          <span className={tx.type === "revenue" ? "text-success" : "text-foreground"}>
            {tx.type === "revenue" ? "+" : "−"}
            {formatCurrency(Number(tx.amount))}
          </span>
          <div>
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
