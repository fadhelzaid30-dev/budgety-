// Shared domain constants for Budgety.

export const EXPENSE_CATEGORIES = [
  "Marketing",
  "Payroll",
  "Rent",
  "Utilities",
  "Equipment",
  "Software",
  "Inventory",
  "Travel",
  "Vendor Payments",
] as const;

export const REVENUE_CATEGORY = "Revenue" as const;
export const UNCATEGORIZED = "Uncategorized" as const;

export type PlanTier = "starter" | "growth" | "professional" | "enterprise";

export const PLANS: Record<
  PlanTier,
  { name: string; price: string; aiQuestions: number | "unlimited"; txLimit: number | "unlimited" }
> = {
  starter: { name: "Starter", price: "$19/mo", aiQuestions: 10, txLimit: 200 },
  growth: { name: "Growth", price: "$49/mo", aiQuestions: 50, txLimit: "unlimited" },
  professional: { name: "Professional", price: "$99/mo", aiQuestions: "unlimited", txLimit: "unlimited" },
  enterprise: { name: "Enterprise", price: "Custom", aiQuestions: "unlimited", txLimit: "unlimited" },
};

export const INDUSTRIES = [
  "Retail",
  "Restaurant / Food Service",
  "Professional Services",
  "Construction / Trades",
  "Healthcare",
  "Technology / SaaS",
  "Manufacturing",
  "E-commerce",
  "Real Estate",
  "Other",
] as const;

export const BUSINESS_SIZES = [
  "Solo (just me)",
  "2–10 employees",
  "11–50 employees",
  "51–200 employees",
] as const;

export const REVENUE_RANGES = [
  "Under $100k",
  "$100k–$500k",
  "$500k–$1M",
  "$1M–$5M",
  "Over $5M",
] as const;

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];
