"use client";

import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  value,
  onValueChange,
  items,
  label,
}: {
  value: T;
  onValueChange: (value: T) => void;
  items: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex border-b border-border px-5">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onValueChange(item.value)}
          className={cn(
            "-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
            value === item.value
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
