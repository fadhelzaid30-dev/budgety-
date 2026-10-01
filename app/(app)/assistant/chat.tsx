"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw, Send } from "lucide-react";
import { LogoMark } from "@/components/wordmark";
import { Markdown } from "@/components/ui/markdown";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { AiConversationMessage } from "@/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How healthy is my business?",
  "Where am I overspending?",
  "Can I afford a $5,000 truck?",
  "Break down my expenses by category",
];

export function Chat({
  initialMessages,
  contextLabel,
}: {
  initialMessages: AiConversationMessage[];
  /** e.g. "41 transactions from Jan–Sep 2026" — what the AI can actually see. */
  contextLabel: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content })),
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;

    const history = messages.slice(-10);
    setLastQuestion(question);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Something went wrong." }));
        // Drop the empty assistant bubble and surface the failure as a real
        // error with a retry, rather than as a message the AI appears to have
        // said. An error rendered as assistant text is indistinguishable from
        // advice, which in a finance app is not an acceptable ambiguity.
        setMessages((m) => m.slice(0, -1));
        setError(err.error ?? "Something went wrong.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          next[next.length - 1] = { role: "assistant", content: last.content + chunk };
          return next;
        });
      }
    } catch {
      setMessages((m) => m.slice(0, -1));
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setStreaming(false);
    }
  }

  const showSuggestions = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        <p className="text-xs text-muted">Answering from {contextLabel}</p>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {showSuggestions ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <LogoMark size={40} />
            <div>
              <p className="text-base font-semibold text-foreground">Ask your AI CFO</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Every answer is grounded in your own numbers — it won&apos;t invent figures.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div aria-live="polite" className="space-y-4">
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const thinking = streaming && isLast && m.role === "assistant" && m.content === "";
              return (
                <div
                  key={i}
                  className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" ? (
                    <span className="mt-0.5 shrink-0" aria-hidden="true">
                      <LogoMark size={26} />
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-foreground",
                    )}
                  >
                    {thinking ? (
                      <span className="flex items-center gap-2 text-muted">
                        <Dots />
                        Reading your numbers…
                      </span>
                    ) : m.role === "assistant" ? (
                      <Markdown>{m.content}</Markdown>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {error ? (
              <Alert tone="danger" title="That didn't go through">
                <p>{error}</p>
                {lastQuestion ? (
                  <button
                    onClick={() => send(lastQuestion)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <RotateCw className="h-3 w-3" aria-hidden="true" /> Try again
                  </button>
                ) : null}
              </Alert>
            ) : null}
          </div>
        )}
      </div>

      <form
        className="border-t border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="flex h-11 items-center gap-2 rounded-full border border-border bg-card pl-4 pr-1.5 transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your numbers…"
            aria-label="Message the AI CFO"
            disabled={streaming}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

/** Three-dot typing indicator. Replaces a single static "…" character. */
function Dots() {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-[dot-pulse_1.2s_ease-in-out_infinite] rounded-full bg-muted"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}
