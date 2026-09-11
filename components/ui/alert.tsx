import * as React from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "./misc";

const ICONS: Record<Exclude<Tone, "default" | "primary">, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};

const STYLES: Record<Tone, string> = {
  default: "border-border bg-accent text-foreground",
  primary: "border-primary/20 bg-primary/5 text-foreground",
  success: "border-success/25 bg-success/5 text-foreground",
  warning: "border-warning/25 bg-warning/5 text-foreground",
  danger: "border-danger/25 bg-danger/5 text-foreground",
};

const ICON_COLOR: Record<Tone, string> = {
  default: "text-muted",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/**
 * Inline message block. Replaces the error `<div role="alert">` that was
 * copy-pasted across eight files in two different paddings and two different
 * markup shapes.
 *
 * `danger` and `warning` announce themselves to screen readers; the quieter
 * tones don't, so a persistent info note doesn't interrupt.
 */
export function Alert({
  tone = "danger",
  title,
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: Tone; title?: string }) {
  const Icon = tone === "default" || tone === "primary" ? Info : ICONS[tone];
  const assertive = tone === "danger" || tone === "warning";

  return (
    <div
      role={assertive ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm",
        STYLES[tone],
        className,
      )}
      {...props}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", ICON_COLOR[tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5 text-muted")}>{children}</div> : null}
      </div>
    </div>
  );
}
