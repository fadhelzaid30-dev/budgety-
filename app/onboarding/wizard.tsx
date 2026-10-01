"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MessageSquare,
  Plus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { LogoMark } from "@/components/wordmark";
import { saveBusinessProfile, finishOnboarding } from "@/lib/actions/business";
import { createTransaction } from "@/lib/actions/transactions";
import { todayIso } from "@/lib/utils";
import { BUSINESS_SIZES, INDUSTRIES, REVENUE_RANGES } from "@/lib/constants";
import type { Business, Category } from "@/types";

interface DraftTx {
  amount: string;
  occurred_on: string;
  description: string;
  type: "revenue" | "expense";
  category_id: string;
}

const STEPS = ["Welcome", "Your business", "Your numbers", "You're set"] as const;

export function OnboardingWizard({
  existingBusiness,
  categories,
  aiConfigured,
}: {
  existingBusiness: Business | null;
  categories: Category[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  // Returning mid-setup skips the welcome — it's only worth showing once.
  const [step, setStep] = useState(existingBusiness ? 2 : 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(existingBusiness?.name ?? "");
  const [industry, setIndustry] = useState(existingBusiness?.industry ?? "");
  const [size, setSize] = useState(existingBusiness?.size ?? "");
  const [revenueRange, setRevenueRange] = useState(existingBusiness?.revenue_range ?? "");
  const [cash, setCash] = useState(String(existingBusiness?.cash_balance ?? ""));

  const [added, setAdded] = useState(0);
  const [draft, setDraft] = useState<DraftTx>({
    amount: "",
    occurred_on: todayIso(),
    description: "",
    type: "expense",
    category_id: "",
  });

  function submitProfile() {
    setError(null);
    startTransition(async () => {
      const res = await saveBusinessProfile({
        name,
        industry,
        size,
        revenue_range: revenueRange,
        cash_balance: cash,
      });
      if (!res.ok) return setError(res.error);
      setStep(2);
    });
  }

  function addDraftTransaction() {
    setError(null);
    startTransition(async () => {
      const res = await createTransaction({
        amount: draft.amount,
        occurred_on: draft.occurred_on,
        description: draft.description,
        type: draft.type,
        category_id: draft.category_id || null,
      });
      if (!res.ok) return setError(res.error);
      setAdded((n) => n + 1);
      setDraft({ ...draft, amount: "", description: "" });
    });
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const res = await finishOnboarding();
      if (!res.ok) return setError(res.error);
      router.push("/dashboard");
    });
  }

  const relevantCategories = categories.filter((c) => c.kind === draft.type);

  return (
    <div>
      {/* Progress is hidden on the welcome screen — showing "step 1 of 4"
          before someone has agreed to start makes setup feel like a chore. */}
      {step > 0 ? (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-1.5" aria-hidden="true">
            {STEPS.slice(1).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step >= i + 1 ? "bg-primary" : "bg-surface-sunken"
                }`}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-primary">
            Step {step} of {STEPS.length - 1} · {STEPS[step]}
          </p>
        </div>
      ) : null}

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {step === 0 ? (
        <div className="animate-rise-in py-6 text-center">
          <div className="mb-6 flex justify-center">
            <LogoMark size={52} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Budgety</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            An affordable CFO for your business. Tell us a little about it, add
            your numbers, and you&apos;ll get a clear read on where you stand —
            cash, runway, and what to do next.
          </p>
          <p className="mt-2 text-sm text-muted">Takes about two minutes.</p>
          <Button size="lg" className="mt-7" onClick={() => setStep(1)}>
            Let&apos;s set up your business <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="animate-rise-in">
          <h1 className="text-2xl font-bold text-foreground">Tell us about your business</h1>
          <p className="mt-1 text-sm text-muted">
            Only the name is required — the rest helps tailor the advice, and you
            can change any of it later in Settings.
          </p>
          <Card className="mt-5">
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="biz-name">Business name</Label>
                <Input
                  id="biz-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Coffee Co."
                  autoFocus
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                    <option value="">Select…</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="size">Team size</Label>
                  <Select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
                    <option value="">Select…</option>
                    {BUSINESS_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="revenue">Annual revenue range</Label>
                  <Select id="revenue" value={revenueRange} onChange={(e) => setRevenueRange(e.target.value)}>
                    <option value="">Select…</option>
                    {REVENUE_RANGES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cash">Current cash balance (USD)</Label>
                  <Input
                    id="cash"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    placeholder="25000"
                  />
                  <p className="mt-1.5 text-xs text-muted">
                    What&apos;s in the bank today. This drives your runway and
                    health score, so a rough figure is better than none.
                  </p>
                </div>
              </div>
              <Button onClick={submitProfile} loading={pending} disabled={!name.trim()} className="w-full">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="animate-rise-in space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add your numbers</h1>
            <p className="mt-1 text-sm text-muted">
              The fastest way is a CSV straight from your bank — Budgety reads the
              columns and categorises everything for you.
            </p>
          </div>

          <Card className="border-primary/30">
            <CardContent className="flex flex-wrap items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Upload className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">Import a CSV</p>
                <p className="text-sm text-muted">Most bank exports work as-is.</p>
              </div>
              {/* Finishes setup first: /transactions/import sits inside the app
                  shell, which redirects back here while onboarding is open. */}
              <Button
                onClick={() =>
                  startTransition(async () => {
                    const res = await finishOnboarding();
                    if (!res.ok) return setError(res.error);
                    router.push("/transactions/import");
                  })
                }
                loading={pending}
              >
                Import CSV
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-border" />
            or add a few by hand
            <span className="h-px flex-1 bg-border" />
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tx-type">Type</Label>
                  <Select
                    id="tx-type"
                    value={draft.type}
                    onChange={(e) =>
                      setDraft({ ...draft, type: e.target.value as "revenue" | "expense", category_id: "" })
                    }
                  >
                    <option value="expense">Expense</option>
                    <option value="revenue">Revenue</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tx-amount">Amount (USD)</Label>
                  <Input
                    id="tx-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={draft.amount}
                    onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="tx-date">Date</Label>
                  <Input
                    id="tx-date"
                    type="date"
                    value={draft.occurred_on}
                    onChange={(e) => setDraft({ ...draft, occurred_on: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="tx-cat">Category (optional)</Label>
                  <Select
                    id="tx-cat"
                    value={draft.category_id}
                    onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                  >
                    <option value="">Auto-categorise</option>
                    {relevantCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="tx-desc">Description</Label>
                <Input
                  id="tx-desc"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Google Ads, payroll, client invoice…"
                />
              </div>
              <Button
                variant="outline"
                onClick={addDraftTransaction}
                loading={pending}
                disabled={!draft.amount}
                className="w-full"
              >
                <Plus className="h-4 w-4" /> Add transaction
              </Button>
              {added > 0 ? (
                <p className="text-center text-sm text-success" aria-live="polite">
                  <Check className="mr-1 inline h-4 w-4" />
                  {added} transaction{added > 1 ? "s" : ""} added
                </p>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)}>
              {added > 0 ? "Continue" : "Skip for now"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="animate-rise-in py-4 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
            <Check className="h-7 w-7 text-success" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">You&apos;re all set, {name}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {added > 0
              ? `${added} transaction${added > 1 ? "s" : ""} in. Your dashboard will show your cash position, health score, and where the money goes.`
              : "Your dashboard is ready. Add transactions or import a CSV whenever you like and it'll fill in."}
          </p>

          <Card className="mx-auto mt-6 max-w-md text-left">
            <CardContent className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-foreground">Meet your AI CFO</p>
                <p className="mt-0.5 text-sm text-muted">
                  {aiConfigured
                    ? "Ask it anything — “Can I afford a $5,000 truck?” — and it answers from your real numbers, never invented ones."
                    : "Not switched on yet: it needs an OpenAI API key. Everything else works without it, and your dashboard still highlights what stands out."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-7 flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button size="lg" onClick={finish} loading={pending}>
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
