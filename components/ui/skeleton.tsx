import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "./card";

/**
 * Loading placeholder. The pulse is a background-color animation rather than
 * opacity so nested skeletons don't compound into a darker block.
 *
 * The global `prefers-reduced-motion` rule in globals.css flattens the pulse
 * for users who've asked for that; the shape still communicates the layout.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  );
}

/** A line of text. `w` lets rows vary so a list doesn't look like a barcode. */
export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-3.5 rounded-sm", className)} />;
}

/** Mirrors the dashboard/transactions stat card so the layout doesn't shift. */
export function SkeletonStat() {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <SkeletonText className="w-24" />
          <Skeleton className="h-4 w-4 rounded-sm" />
        </div>
        <Skeleton className="mt-3 h-7 w-32" />
        <SkeletonText className="mt-2 w-20" />
      </CardContent>
    </Card>
  );
}

/** Mirrors a titled card with a chart or block of content inside. */
export function SkeletonCard({ height = "h-60" }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <SkeletonText className="w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className={cn("w-full", height)} />
      </CardContent>
    </Card>
  );
}

/** Mirrors a table body. */
export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  const widths = ["w-40", "w-56", "w-32", "w-48", "w-36", "w-52"];
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
            <SkeletonText className={widths[i % widths.length]} />
          </div>
          <SkeletonText className="w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** Page title + subtitle block, used at the top of most route skeletons. */
export function SkeletonPageHeader() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-7 w-44" />
      <SkeletonText className="w-64" />
    </div>
  );
}
