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

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
