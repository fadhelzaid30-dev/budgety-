import { getCurrentBusiness } from "@/lib/data/queries";
import { createServerSupabase } from "@/lib/supabase/server";
import { Chat } from "./chat";
import type { AiConversationMessage } from "@/types";

export default async function AssistantPage() {
  const business = (await getCurrentBusiness())!;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col md:h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI CFO</h1>
        <p className="text-sm text-muted">
          Ask about any decision. Answers use {business.name}&apos;s real numbers.
        </p>
      </div>
      <Chat initialMessages={(data as AiConversationMessage[]) ?? []} />
    </div>
  );
}
