import { scoreLabel, type HealthScoreResult } from "@/lib/finance/healthScore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import {
  CHART_SUCCESS,
  CHART_WARNING,
  CHART_DANGER,
  CHART_GRID,
  CHART_FOREGROUND,
  CHART_MUTED,
} from "@/lib/tokens";

const FACTOR_LABELS: Record<string, string> = {
  cashFlow: "Cash flow",
  profitability: "Profitability",
  revenueGrowth: "Revenue growth",
  liquidity: "Liquidity",
  expenseTrend: "Expense trend",
  debtRatio: "Debt ratio",
};

/** Plain-language reading of the score, so the number means something. */
function summaryFor(score: number): string {
  if (score >= 70)
    return "Your finances are in good shape. Cash, margin, and growth are all holding up.";
  if (score >= 45)
    return "Workable, but with soft spots. The lowest factors below are where to look first.";
  return "Under strain. The lowest factors below are the ones pulling hardest — start there.";
}

/** Radial gauge + factor breakdown. Server component; the sweep is pure CSS. */
export function HealthScoreCard({ health }: { health: HealthScoreResult }) {
  const { score, factors, notes } = health;
  const { label, tone } = scoreLabel(score);
  const color = tone === "success" ? CHART_SUCCESS : tone === "warning" ? CHART_WARNING : CHART_DANGER;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  // Worst factors first so attention lands where it matters. debtRatio is a
  // fixed placeholder, so it's never presented as an actionable weak point.
  const ordered = (Object.keys(FACTOR_LABELS) as (keyof typeof factors)[]).sort((a, b) => {
    if (a === "debtRatio") return 1;
    if (b === "debtRatio") return -1;
    return factors[a] - factors[b];
  });

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0 text-center">
            <div
              className="relative"
              role="img"
              aria-label={`Business health score ${score} out of 100 — ${label}`}
            >
              <svg width="148" height="148" viewBox="0 0 148 148">
                <circle cx="74" cy="74" r={radius} fill="none" stroke={CHART_GRID} strokeWidth="11" />
                <circle
                  cx="74"
                  cy="74"
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 74 74)"
                  style={{
                    // Sweeps from empty to the real value on load. Declared as an
                    // animation (not a transition) so it runs on first paint;
                    // the global reduced-motion rule flattens it to ~0ms.
                    animation: "gauge-sweep 900ms cubic-bezier(0.22, 1, 0.36, 1) both",
                    ["--gauge-to" as string]: String(offset),
                    ["--gauge-from" as string]: String(circumference),
                  }}
                />
                <text x="74" y="70" textAnchor="middle" fontSize="32" fontWeight="700" fill={CHART_FOREGROUND}>
                  {score}
                </text>
                <text x="74" y="92" textAnchor="middle" fontSize="12" fill={CHART_MUTED}>
                  out of 100
                </text>
              </svg>
            </div>
            <Badge tone={tone} className="mt-1">{label}</Badge>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-muted">Business health score</h2>
            <p className="mt-1 text-sm text-foreground">{summaryFor(score)}</p>

            <ul className="mt-4 space-y-2.5">
              {ordered.map((key, i) => (
                <li key={key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">
                      {FACTOR_LABELS[key]}
                      {key === "debtRatio" ? (
                        <span className="ml-1 text-muted" title={notes[key]}>*</span>
                      ) : null}
                    </span>
                    <span className="tabular-nums text-muted">{factors[key]}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full animate-bar-grow"
                      style={
                        {
                          width: `${factors[key]}%`,
                          background: color,
                          "--stagger-index": i,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-xs text-muted">
              * Debt ratio is a fixed neutral placeholder — liabilities aren&apos;t
              tracked in this version, so it contributes the same 2.5 points to
              every score.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
