import Link from "next/link";
import { ArrowRight, Sparkles, TrendingDown, TrendingUp, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Insight, InsightTone } from "@/lib/finance/insights";

const ICON: Record<InsightTone, React.ComponentType<{ className?: string }>> = {
  danger: TriangleAlert,
  warning: TrendingUp,
  success: TrendingDown,
  default: Sparkles,
};

const ACCENT: Record<InsightTone, string> = {
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  default: "bg-primary/10 text-primary",
};

/**
 * Proactive observations computed from the user's own figures.
 *
 * Headed "What stands out" rather than anything implying the AI wrote it —
 * these come from deterministic rules in lib/finance/insights.ts, and labelling
 * rule output as AI output would be a lie the moment anyone checked.
 */
export function InsightCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">What stands out</h2>
          <Link
            href="/assistant"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ask the AI CFO <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>

        <ul className="space-y-3">
          {insights.map((insight, i) => {
            const Icon = ICON[insight.tone];
            return (
              <li
                key={insight.id}
                className="flex items-start gap-3 animate-rise-in"
                style={{ "--stagger-index": i } as React.CSSProperties}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${ACCENT[insight.tone]}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{insight.detail}</p>
                  {insight.href ? (
                    <Link
                      href={insight.href}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {insight.linkLabel ?? "Take a look"}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
