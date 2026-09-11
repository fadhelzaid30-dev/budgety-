"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles, Check, X, ChevronDown, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, EmptyState, RiskBadge } from "@/components/ui/misc";
import {
  generateWeeklyRecommendations,
  updateRecommendationStatus,
} from "@/lib/actions/ai";
import type { AiRecommendation } from "@/types";

export function RecommendationsView({
  recommendations,
}: {
  recommendations: AiRecommendation[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    start(async () => {
      const res = await generateWeeklyRecommendations();
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {recommendations.length} active recommendation{recommendations.length === 1 ? "" : "s"}
        </p>
        <Button onClick={generate} disabled={pending}>
          <Sparkles className="h-4 w-4" />
          {pending ? "Analyzing…" : "Generate this week's"}
        </Button>
      </div>

      {error ? (
        <div role="alert" className="rounded-md bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Generate a set of AI recommendations based on your current financials."
        />
      ) : (
        recommendations.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} onChanged={() => router.refresh()} />
        ))
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  onChanged,
}: {
  rec: AiRecommendation;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function setStatus(status: "read" | "dismissed") {
    start(async () => {
      await updateRecommendationStatus(rec.id, status);
      onChanged();
    });
  }

  const dataEntries = Object.entries(rec.supporting_data ?? {});

  return (
    <Card className={rec.status === "new" ? "border-primary/30" : undefined}>
      <CardContent className="flex gap-4 pt-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
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
                  <p className="text-xs font-medium uppercase text-muted">Why</p>
                  <p className="text-sm text-foreground">{rec.rationale}</p>
                </div>
              ) : null}
              {dataEntries.length > 0 ? (
                <div>
                  <p className="text-xs font-medium uppercase text-muted">Supporting data</p>
                  <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {dataEntries.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <dt className="truncate text-muted">{k}</dt>
                        <dd className="text-foreground">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
              {open ? "Less" : "Details"}
            </Button>
            <div className="ml-auto flex gap-2">
              {rec.status === "new" ? (
                <Button size="sm" onClick={() => setStatus("read")} disabled={pending}>
                  <Check className="h-4 w-4" /> Mark read
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => setStatus("dismissed")} disabled={pending}>
                <X className="h-4 w-4" /> Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
