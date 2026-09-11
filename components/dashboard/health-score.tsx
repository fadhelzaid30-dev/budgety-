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

/** Radial gauge + factor breakdown. Pure server component (no interactivity). */
export function HealthScoreCard({ health }: { health: HealthScoreResult }) {
  const { score, factors, notes } = health;
  const { label, tone } = scoreLabel(score);
  const color = tone === "success" ? CHART_SUCCESS : tone === "warning" ? CHART_WARNING : CHART_DANGER;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0" role="img" aria-label={`Business Health Score ${score} out of 100, ${label}`}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} fill="none" stroke={CHART_GRID} strokeWidth="12" />
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="66" textAnchor="middle" fontSize="30" fontWeight="700" fill={CHART_FOREGROUND}>
                {score}
              </text>
              <text x="70" y="88" textAnchor="middle" fontSize="12" fill={CHART_MUTED}>
                / 100
              </text>
            </svg>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-sm font-medium text-muted">Business Health Score</h2>
              <Badge tone={tone}>{label}</Badge>
            </div>
            <ul className="space-y-2">
              {(Object.keys(FACTOR_LABELS) as (keyof typeof factors)[]).map((key) => (
                <li key={key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground">
                      {FACTOR_LABELS[key]}
                      {key === "debtRatio" ? (
                        <span className="ml-1 text-muted" title={notes[key]}>*</span>
                      ) : null}
                    </span>
                    <span className="text-muted">{factors[key]}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-accent">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${factors[key]}%`, background: color }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              * Debt ratio is a neutral placeholder — liabilities aren&apos;t tracked in this version.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
