import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * Lazily construct the OpenAI client. Constructing at module load would throw
 * during the build when OPENAI_API_KEY isn't set; callers guard with
 * `isAiConfigured()` and only reach this at request time.
 */
export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/** Default model. gpt-4o-mini keeps cost/latency low for MVP; override via env. */
export const AI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/**
 * True only when OPENAI_API_KEY looks like a real key. A non-empty check isn't
 * enough: a placeholder value passes it, so every guard succeeds and the app
 * reports itself configured right up until the request fails at the network
 * call. Real keys are `sk-` (optionally `sk-proj-`/`sk-svcacct-`) followed by a
 * long opaque string — the shortest form is 51 characters.
 */
export function isAiConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key && key.startsWith("sk-") && key.length >= 40);
}
