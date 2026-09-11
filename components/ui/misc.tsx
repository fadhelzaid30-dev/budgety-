import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/constants";

export type Tone = "default" | "primary" | "success" | "warning" | "danger";

/**
 * The one tone→class mapping in the app. Exported because the transactions
 * stat row needs the same mapping and previously kept its own copy, which had
 * already drifted (`bg-primary-soft` vs `bg-primary/10` for the same color).
 */
export const TONE_CLASSES: Record<Tone, string> = {
  default: "bg-accent text-muted",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

/** Solid foreground color per tone — for icons and text outside a tinted chip. */
export const TONE_TEXT: Record<Tone, string> = {
  default: "text-muted",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const tone = level === "high" ? "danger" : level === "medium" ? "warning" : "success";
  return (
    <Badge tone={tone} aria-label={`Risk level: ${level}`}>
      {level} risk
    </Badge>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin text-muted", className)} aria-hidden="true" />;
}

/**
 * Empty states are a first impression, not an error. The icon sits in a soft
 * branded tile rather than floating grey on the page, and the container uses a
 * real surface so it reads as "nothing here yet" instead of "something broke".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      ) : null}
      <p className="text-base font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
