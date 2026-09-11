import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Surface container.
 *
 * Default is border-only: a border *and* a drop shadow on the same resting
 * surface reads muddy, so elevation is reserved for things that genuinely
 * float. Pass `elevated` for surfaces that sit above the page (drawers,
 * popovers, the toast stack) — those drop the border and take a shadow.
 */
export function Card({
  className,
  elevated = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { elevated?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card",
        elevated ? "shadow-lg" : "border border-border",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Card padding is `p-5` throughout. Header and content previously shipped
 * `pb-2`/`pt-2` and every caller overrode them, which is how four different
 * card paddings ended up in the app. Use `CardHeader` + `CardContent` together
 * and the vertical rhythm is handled; use `CardContent` alone and it's a
 * correctly padded box on its own.
 */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-medium text-muted", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
