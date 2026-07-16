// Shared domain types. These mirror the Supabase schema (see supabase/migrations).

import type { PlanTier, RiskLevel } from "@/lib/constants";

export type TransactionType = "revenue" | "expense";
export type TransactionSource = "manual" | "csv" | "plaid";
export type CategoryKind = "revenue" | "expense";
export type RecommendationStatus = "new" | "read" | "dismissed";
export type ReportEmailStatus = "pending" | "sent" | "failed";

export interface Profile {
  user_id: string;
  email: string | null;
  plan: PlanTier;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  size: string | null;
  revenue_range: string | null;
  cash_balance: number;
  onboarding_complete: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string | null; // null = system default
  name: string;
  kind: CategoryKind;
  is_default: boolean;
}

export interface Transaction {
  id: string;
  business_id: string;
  amount: number;
  occurred_on: string; // yyyy-mm-dd
  description: string;
  category_id: string | null;
  type: TransactionType;
  source: TransactionSource;
  parent_transaction_id: string | null;
  raw_import: Record<string, unknown> | null;
  created_at: string;
  // Optional join
  category?: Pick<Category, "id" | "name" | "kind"> | null;
}

export interface HealthScoreFactors {
  cashFlow: number;
  profitability: number;
  revenueGrowth: number;
  liquidity: number;
  expenseTrend: number;
  debtRatio: number;
}

export interface HealthScore {
  id: string;
  business_id: string;
  score: number;
  factors: HealthScoreFactors;
  computed_at: string;
}

export interface AiRecommendation {
  id: string;
  business_id: string;
  title: string;
  body: string;
  rationale: string;
  supporting_data: Record<string, unknown>;
  risk_level: RiskLevel;
  status: RecommendationStatus;
  created_at: string;
}

export interface AiConversationMessage {
  id: string;
  business_id: string;
  role: "user" | "assistant";
  content: string;
  data_context: Record<string, unknown> | null;
  created_at: string;
}

export interface ReportContent {
  summary: string;
  cashFlow: string;
  risks: string[];
  opportunities: string[];
  actions: string[];
}

export interface Report {
  id: string;
  business_id: string;
  period_start: string;
  period_end: string;
  content: ReportContent;
  email_status: ReportEmailStatus;
  created_at: string;
}
