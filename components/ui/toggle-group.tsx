"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

/**
 * Single-select pill toggle. "outline" is the bordered-pill pattern used in
 * forms (transaction type, category picker); "segmented" is the pill-track
 * pattern used in filter bars (e.g. All / Revenue / Expense chips).
 */
export function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  label,
  variant = "outline",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  label: string;
  variant?: "outline" | "segmented";
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex gap-2",
        variant === "segmented" && "gap-1 rounded-full bg-surface-sunken p-1",
        variant === "outline" && "flex-wrap",
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "text-sm font-medium transition-colors",
            variant === "outline" &&
              cn(
                "rounded-full border px-3 py-1.5",
                value === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted hover:text-foreground",
              ),
            variant === "segmented" &&
              cn(
                "rounded-full px-3.5 py-1.5",
                value === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted hover:text-foreground",
              ),
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
