"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { saveBusinessProfile, finishOnboarding } from "@/lib/actions/business";
import { createTransaction } from "@/lib/actions/transactions";
import {
  BUSINESS_SIZES,
  INDUSTRIES,
  REVENUE_RANGES,
} from "@/lib/constants";
import type { Business, Category } from "@/types";

interface DraftTx {
  amount: string;
  occurred_on: string;
  description: string;
  type: "revenue" | "expense";
  category_id: string;
}

export function OnboardingWizard({
  existingBusiness,
  categories,
}: {
  existingBusiness: Business | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(existingBusiness ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Step 1 — profile
  const [name, setName] = useState(existingBusiness?.name ?? "");
  const [industry, setIndustry] = useState(existingBusiness?.industry ?? "");
  const [size, setSize] = useState(existingBusiness?.size ?? "");
  const [revenueRange, setRevenueRange] = useState(existingBusiness?.revenue_range ?? "");
  const [cash, setCash] = useState(String(existingBusiness?.cash_balance ?? ""));

  // Step 2 — first transactions
  const today = new Date().toISOString().slice(0, 10);
  const [added, setAdded] = useState(0);
  const [draft, setDraft] = useState<DraftTx>({
    amount: "",
    occurred_on: today,
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
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2" aria-hidden="true">
          <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-surface-sunken"}`} />
          <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-surface-sunken"}`} />
        </div>
        <p className="text-sm font-medium text-primary">
          Step {step} of 2
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          {step === 1 ? "Tell us about your business" : "Add your first transactions"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {step === 1
            ? "This helps Budgety tailor its advice to your business."
            : "Add a few to see your dashboard come to life. You can skip and import a CSV later."}
        </p>
      </div>

      {error ? (
        <div role="alert" className="mb-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div>
              <Label htmlFor="biz-name">Business name</Label>
              <Input
                id="biz-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Coffee Co."
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
              </div>
            </div>
            <Button onClick={submitProfile} disabled={pending || !name.trim()} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-5">
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
                    <option value="">Auto-categorize</option>
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
                disabled={pending || !draft.amount}
                className="w-full"
              >
                <Plus className="h-4 w-4" /> Add transaction
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted" aria-live="polite">
            {added > 0
              ? `${added} transaction${added > 1 ? "s" : ""} added.`
              : "No transactions yet — that's okay."}
          </p>

          <Button onClick={finish} disabled={pending} className="w-full">
            <Check className="h-4 w-4" /> Finish setup
          </Button>
        </div>
      )}
    </div>
  );
}
