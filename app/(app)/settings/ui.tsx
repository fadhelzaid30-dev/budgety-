"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import { saveBusinessProfile } from "@/lib/actions/business";
import { BUSINESS_SIZES, INDUSTRIES, REVENUE_RANGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Business } from "@/types";

export function SettingsForm({ business }: { business: Business }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [form, setForm] = useState({
    name: business.name,
    industry: business.industry ?? "",
    size: business.size ?? "",
    revenue_range: business.revenue_range ?? "",
    cash_balance: String(business.cash_balance ?? 0),
  });

  // Only enable Save once something actually differs from what's stored.
  const dirty =
    form.name !== business.name ||
    form.industry !== (business.industry ?? "") ||
    form.size !== (business.size ?? "") ||
    form.revenue_range !== (business.revenue_range ?? "") ||
    Number(form.cash_balance) !== Number(business.cash_balance ?? 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await saveBusinessProfile(form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.show("Settings saved.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-4 w-4 text-muted" aria-hidden="true" />
            Business profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div>
            <Label htmlFor="s-name">Business name</Label>
            <Input
              id="s-name"
              value={form.name}
              required
              maxLength={120}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-industry">Industry</Label>
              <Select
                id="s-industry"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                <option value="">Not set</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="s-size">Team size</Label>
              <Select
                id="s-size"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              >
                <option value="">Not set</option>
                {BUSINESS_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="s-revenue">Annual revenue range</Label>
            <Select
              id="s-revenue"
              value={form.revenue_range}
              onChange={(e) => setForm({ ...form, revenue_range: e.target.value })}
            >
              <option value="">Not set</option>
              {REVENUE_RANGES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-muted">
              Used for context in recommendations — it isn&apos;t used to calculate
              any of your actual figures.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Wallet className="h-4 w-4 text-muted" aria-hidden="true" />
            Cash position
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Label htmlFor="s-cash">Current cash balance (USD)</Label>
          <Input
            id="s-cash"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.cash_balance}
            onChange={(e) => setForm({ ...form, cash_balance: e.target.value })}
          />
          <p className="mt-1.5 text-xs text-muted">
            Currently {formatCurrency(Number(business.cash_balance ?? 0))}. This
            is the single most important number in Budgety — your runway, your
            liquidity score, and every &ldquo;can I afford this?&rdquo; answer are
            calculated from it. Keep it current.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {dirty ? (
          <span className="text-xs text-muted">You have unsaved changes</span>
        ) : null}
        <Button type="submit" loading={pending} disabled={!dirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
