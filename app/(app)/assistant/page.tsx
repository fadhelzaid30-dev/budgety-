import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { getCurrentBusiness, getFinancialSnapshot } from "@/lib/data/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/openai";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Chat } from "./chat";
import type { AiConversationMessage } from "@/types";

export const metadata: Metadata = { title: "AI CFO — Budgety" };

export default async function AssistantPage() {
  const business = (await getCurrentBusiness())!;
  const supabase = await createServerSupabase();

  const [{ data }, snapshot] = await Promise.all([
    supabase
      .from("ai_conversations")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true })
      .limit(50),
    getFinancialSnapshot(business),
  ]);

  const a = snapshot.aggregates;
  const configured = isAiConfigured();

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col md:h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI CFO</h1>
        <p className="text-sm text-muted">
          Ask about any decision. Answers use {business.name}&apos;s real numbers.
        </p>
      </div>

      {!configured ? (
        /* Say this up front rather than letting someone type a question into a
           box that will fail mid-stream. The chat route returns 503 without a
           key, which previously surfaced as an assistant message reading "[The
           response was interrupted.]" — indistinguishable from a real failure. */
        <EmptyState
          icon={KeyRound}
          title="The AI CFO isn't switched on yet"
          description="This feature needs an OpenAI API key in .env.local. Everything else in Budgety — transactions, the dashboard, health score and reports — works without it."
          action={
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          }
          className="flex-1"
        />
      ) : (
        <>
          {a.transactionCount === 0 ? (
            <Alert tone="warning" className="mb-3" title="No transactions yet">
              The AI answers from your data, so it has nothing to work with.
              Add some transactions first.
            </Alert>
          ) : null}
          <Chat
            initialMessages={(data as AiConversationMessage[]) ?? []}
            contextLabel={buildContextLabel(a.transactionCount, snapshot)}
          />
        </>
      )}
    </div>
  );
}

/**
 * What the AI can actually see, stated plainly above the thread — so a user can
 * tell the difference between "it doesn't know" and "it won't say".
 */
function buildContextLabel(
  count: number,
  snapshot: Awaited<ReturnType<typeof getFinancialSnapshot>>,
): string {
  const months = snapshot.aggregates.monthlySeries;
  const first = months[0];
  const last = months[months.length - 1];
  const span =
    first && last ? ` · ${formatDate(`${first.month}-01`)} to ${formatDate(`${last.month}-01`)}` : "";
  return `${count} transaction${count === 1 ? "" : "s"}${span}`;
}
