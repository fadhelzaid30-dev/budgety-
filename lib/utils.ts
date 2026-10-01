import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as USD currency. */
export function formatCurrency(amount: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(amount);
}

/** Format an ISO date string (yyyy-mm-dd) for display. */
export function formatDate(iso: string) {
  // Parse as a local date to avoid TZ shifting a plain yyyy-mm-dd.
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Today as a local yyyy-mm-dd, for date inputs.
 *
 * Deliberately not `toISOString().slice(0,10)`, which is UTC: west of UTC after
 * ~16:00 local that returns tomorrow, so date fields pre-filled the wrong day.
 * The same bug existed independently in three places before this was shared.
 */
export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Signed percentage, e.g. +12.4% / -3.1%. Returns "—" for undefined. */
export function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
