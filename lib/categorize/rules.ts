import { EXPENSE_CATEGORIES, REVENUE_CATEGORY, UNCATEGORIZED } from "@/lib/constants";

type CategoryName = (typeof EXPENSE_CATEGORIES)[number] | typeof REVENUE_CATEGORY;

// Keyword → category rules. Cheap, deterministic first pass; AI only handles misses.
// Ordered by specificity; the first matching rule wins.
const RULES: { keywords: string[]; category: CategoryName }[] = [
  { category: "Payroll", keywords: ["payroll", "salary", "wages", "gusto", "adp", "paychex", "employee"] },
  { category: "Rent", keywords: ["rent", "lease", "landlord", "wework", "office space"] },
  { category: "Utilities", keywords: ["electric", "water", "gas bill", "internet", "comcast", "at&t", "verizon", "utility", "power"] },
  { category: "Software", keywords: ["saas", "subscription", "aws", "google workspace", "microsoft 365", "slack", "notion", "figma", "github", "adobe", "zoom", "software"] },
  { category: "Marketing", keywords: ["ads", "google ads", "facebook ads", "meta ads", "marketing", "seo", "mailchimp", "hubspot", "advertis", "campaign"] },
  { category: "Equipment", keywords: ["equipment", "hardware", "laptop", "computer", "machinery", "tools", "printer", "furniture"] },
  { category: "Inventory", keywords: ["inventory", "stock", "wholesale", "supplier goods", "raw material", "merchandise"] },
  { category: "Travel", keywords: ["flight", "airline", "uber", "lyft", "hotel", "airbnb", "travel", "mileage", "rental car"] },
  { category: "Vendor Payments", keywords: ["vendor", "contractor", "invoice", "consultant", "freelance", "supplier", "1099"] },
];

const REVENUE_HINTS = ["invoice paid", "payment received", "deposit", "sale", "revenue", "stripe payout", "sales", "client payment"];

/**
 * Rule-based categorization. Returns a default category name, or null when no rule
 * matches (caller should fall back to the AI classifier).
 */
export function categorizeByRules(
  description: string,
  type: "revenue" | "expense",
): CategoryName | null {
  const text = description.toLowerCase();

  if (type === "revenue") {
    return REVENUE_CATEGORY;
  }

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category;
    }
  }
  return null;
}

/** Heuristic: does this description look like incoming revenue? Used for CSV rows. */
export function looksLikeRevenue(description: string): boolean {
  const text = description.toLowerCase();
  return REVENUE_HINTS.some((kw) => text.includes(kw));
}

export const FALLBACK_CATEGORY = UNCATEGORIZED;
