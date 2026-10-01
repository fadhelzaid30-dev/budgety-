"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Sparkles, Check, X, ChevronDown, KeyRound, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, EmptyState, RiskBadge } from "@/components/ui/misc";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import {
  generateWeeklyRecommendations,
  updateRecommendationStatus,
} from "@/lib/actions/ai";
import type { AiRecommendation } from "@/types";
import type { RiskLevel } from "@/lib/constants";

/** Most urgent first. The list was previously ordered only by creation time,
 *  so a low-risk note could sit above something flagged high. */
const RISK_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

const GROUP_LABEL: Record<RiskLevel, string> = {
  high: "Needs attention",
  medium: "Worth reviewing",
  low: "Suggestions",
};

export function RecommendationsView({
  recommendations,
  aiConfigured,
}: {
  recommendations: AiRecommendation[];
  aiConfigured: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    start(async () => {
      const res = await generateWeeklyRecommendations();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      toast.show(`Generated ${res.data} recommendation${res.data === 1 ? "" : "s"}.`);
      router.refresh();
    });
  }

  // Without a key the button can only ever produce an error, so the page says
  // so instead of inviting the click.
  if (!aiConfigured) {
    return (
      <EmptyState
        icon={KeyRound}
        title="Recommendations need the AI switched on"
        description="This feature writes weekly advice from your numbers, which requires an OpenAI API key in .env.local. Your dashboard already highlights the big movements without it."
        action={
          <Link href="/dashboard">
            <Button variant="outline">See what stands out</Button>
          </Link>
        }
      />
    );
  }

  const grouped = [...recommendations].sort(
    (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {recommendations.length} active recommendation{recommendations.length === 1 ? "" : "s"}
        </p>
        <Button onClick={generate} loading={pending}>
          <Sparkles className="h-4 w-4" />
          Generate this week&apos;s
        </Button>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Generate a set based on your current financials. They're grounded in your real numbers — nothing is invented."
          action={
            <Button onClick={generate} loading={pending}>
              <Sparkles className="h-4 w-4" /> Generate now
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {(["high", "medium", "low"] as RiskLevel[]).map((level) => {
            const items = grouped.filter((r) => r.risk_level === level);
            if (items.length === 0) return null;
            return (
              <section key={level} className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {GROUP_LABEL[level]}
                  <span className="ml-1.5 font-normal normal-case tracking-normal">
                    ({items.length})
                  </span>
                </h2>
                {items.map((rec, i) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    index={i}
                    onChanged={() => router.refresh()}
                  />
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  index,
  onChanged,
}: {
  rec: AiRecommendation;
  index: number;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function setStatus(status: "read" | "dismissed") {
    start(async () => {
      const res = await updateRecommendationStatus(rec.id, status);
      if (!res.ok) {
        toast.show(res.error, "error");
        return;
      }
      toast.show(status === "dismissed" ? "Recommendation dismissed." : "Marked as read.");
      onChanged();
    });
  }

  const dataEntries = Object.entries(rec.supporting_data ?? {});

  return (
    <Card
      className={`animate-rise-in ${rec.status === "new" ? "border-primary/30" : ""}`}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <CardContent className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lightbulb className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{rec.title}</h3>
            <RiskBadge level={rec.risk_level} />
            {rec.status === "new" ? <Badge tone="primary">New</Badge> : null}
          </div>
          <p className="text-sm text-foreground">{rec.body}</p>

          {open ? (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              {rec.rationale ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Why</p>
                  <p className="mt-0.5 text-sm text-foreground">{rec.rationale}</p>
                </div>
              ) : null}
              {dataEntries.length > 0 ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Figures this is based on
                  </p>
                  <dl className="mt-1.5 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {dataEntries.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2 border-b border-border py-1">
                        <dt className="truncate text-muted">{k}</dt>
                        <dd className="shrink-0 font-medium tabular-nums text-foreground">
                          {String(v)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              {open ? "Less" : "Why this?"}
            </Button>
            <div className="ml-auto flex gap-2">
              {rec.status === "new" ? (
                <Button size="sm" onClick={() => setStatus("read")} disabled={pending}>
                  <Check className="h-4 w-4" /> Mark read
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatus("dismissed")}
                disabled={pending}
              >
                <X className="h-4 w-4" /> Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
