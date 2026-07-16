import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOpenAI, AI_MODEL, isAiConfigured } from "@/lib/ai/openai";
import { chatSystemPrompt } from "@/lib/ai/prompts";
import { buildFinancialContext } from "@/lib/ai/context";
import { getCurrentBusiness, getFinancialSnapshot } from "@/lib/data/queries";
import { createServerSupabase } from "@/lib/supabase/server";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "AI is not configured (OPENAI_API_KEY missing)." }, { status: 503 });
  }

  const business = await getCurrentBusiness();
  if (!business) return NextResponse.json({ error: "No business found" }, { status: 400 });

  const body = (await req.json()) as { message?: string; history?: ChatTurn[] };
  const message = (body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const snapshot = await getFinancialSnapshot(business);
  const { text: financialContext, snapshot: dataSnapshot } = buildFinancialContext(snapshot);

  const history = (body.history ?? []).slice(-10); // keep prompt bounded
  const messages = [
    { role: "system" as const, content: chatSystemPrompt(financialContext) },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user" as const, content: message },
  ];

  const completion = await getOpenAI().chat.completions.create({
    model: AI_MODEL,
    temperature: 0.4,
    stream: true,
    messages,
  });

  const encoder = new TextEncoder();
  let assistantText = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            assistantText += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n[The response was interrupted.]"));
      } finally {
        controller.close();
        // Persist the turn with the exact data snapshot used (auditability).
        try {
          const supabase = await createServerSupabase();
          await supabase.from("ai_conversations").insert([
            { business_id: business.id, role: "user", content: message, data_context: null },
            {
              business_id: business.id,
              role: "assistant",
              content: assistantText,
              data_context: dataSnapshot,
            },
          ]);
        } catch {
          // Persistence failure shouldn't break the user's chat experience.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
