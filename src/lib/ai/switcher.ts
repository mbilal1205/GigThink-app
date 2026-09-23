import { z } from "zod";
import { callProviderModel } from "./provider-router";
import type { ChatMessage } from "./types";

// ─── Model Chains ───
export const getCasualChain = (): string[] =>
  (process.env.GROQ_CHAT_CHAIN || "llama-3.1-8b-instant")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

export const getProposalChain = (): string[] =>
  (process.env.GROQ_PROPOSAL_CHAIN || "openai/gpt-oss-20b")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

// ─── Types ───
interface FallbackObjectParams<T> {
  modelChain: string[];
  schema: z.ZodType<T>;
  prompt: string;
  system?: string;
}

interface FallbackResult<T> {
  data: T;
  modelUsed: string;
}

function extractJson(text: string): any {
  let clean = text.trim();

  // Remove markdown code fences
  clean = clean.replace(/```json/gi, "").replace(/```/g, "").trim();

  // JSON object find karo
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  // Trailing commas remove karo
  clean = clean.replace(/,(\s*[}\]])/g, "$1");

  return JSON.parse(clean);
}

export async function executeObjectWithFallback<T>({
  modelChain,
  schema,
  prompt,
  system,
}: FallbackObjectParams<T>): Promise<FallbackResult<T>> {
  const messages: ChatMessage[] = [];

  if (system && system.trim()) {
    messages.push({ role: "system", content: system.trim() });
  }

  messages.push({ role: "user", content: prompt });

  for (let i = 0; i < modelChain.length; i++) {
    const modelName = modelChain[i].trim();

    try {
      console.log(
        `[AI_SWITCHER] Trying Model: ${modelName} (${i + 1}/${modelChain.length})`
      );

      const result = await callProviderModel(modelName, messages, {
        temperature: 0.2,
        maxTokens: 4096,
      });

      const parsedJson = extractJson(result.text);
      const data = schema.parse(parsedJson);

      console.log(`[AI_SWITCHER] Success with: ${modelName} ✅`);

      return {
        data,
        modelUsed: modelName,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown AI Error";

      console.error(
        `[AI_SWITCHER] Model ${modelName} failed ❌ | Reason:`,
        errorMessage
      );

      if (i === modelChain.length - 1) {
        throw new Error(`All fallback models failed. Last error: ${errorMessage}`);
      }
    }
  }

  throw new Error("AI Execution failed unexpectedly.");
}