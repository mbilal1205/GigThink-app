// src/lib/ai/provider-router.ts
import { callDeepSeek } from "./providers/deepseek";
import { callGoogleGemini } from "./providers/google";
import { callOpenRouter } from "./providers/openrouter";
import type { ChatMessage } from "./types";

export interface ProviderCallOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface ProviderResult {
  text: string;
  reasoning?: string;
  provider: "groq" | "deepseek" | "google" | "openrouter";
}

export function detectProvider(
  model: string
): ProviderResult["provider"] {
  if (model.startsWith("deepseek-")) return "deepseek";
  if (model.startsWith("gemini-")) return "google";
  if (model.includes("/")) return "openrouter";
  return "groq";
}

// ─── Groq Models Mapping ───
function getGroqEquivalent(model: string): string {
  // Chat models → fastest Groq model
  if (
    model.includes("chat") ||
    model.includes("gpt-oss-20b") ||
    model.includes("deepseek-chat") ||
    model.includes("gemini-2.0-flash")
  ) {
    return "openai/gpt-oss-20b";
  }
  
  // Proposal/Reasoner models → heavy Groq model
  if (
    model.includes("reasoner") ||
    model.includes("pro") ||
    model.includes("gpt-oss-120b") ||
    model.includes("qwen") ||
    model.includes("gemini-2.5-pro")
  ) {
    return "openai/gpt-oss-20b";
  }
  
  // Default fallback
  return "openai/gpt-oss-20b";
}

async function callGroqChat(
  model: string,
  messages: ChatMessage[],
  options: ProviderCallOptions
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const baseUrl =
    process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText;
    throw new Error(`Groq API error (${response.status}): ${errorMsg}`);
  }

  return data?.choices?.[0]?.message?.content ?? "";
}

export async function callProviderModel(
  model: string,
  messages: ChatMessage[],
  options: ProviderCallOptions = {}
): Promise<ProviderResult> {
  let provider = detectProvider(model);
  let actualModel = model;
  const mode = process.env.AI_PROVIDER_MODE || "production";

  // ─── TESTING MODE: Non-Groq → Auto-map to Groq ───
  if (mode === "testing" && provider !== "groq") {
    const groqModel = getGroqEquivalent(model);
    console.log(`[TESTING] 🔄 Auto-mapped "${model}" → "${groqModel}" (Groq)`);
    provider = "groq";
    actualModel = groqModel;
  }

  // ─── PRODUCTION MODE: Sab providers allow ───
  switch (provider) {
    case "deepseek": {
      const { content, reasoningContent } = await callDeepSeek(
        actualModel,
        messages,
        options
      );

      return {
        text: content,
        reasoning: reasoningContent || undefined,
        provider,
      };
    }

    case "google": {
      const text = await callGoogleGemini(actualModel, messages, options);
      return { text, provider };
    }

    case "openrouter": {
      const text = await callOpenRouter(actualModel, messages, options);
      return { text, provider };
    }

    case "groq": {
      const text = await callGroqChat(actualModel, messages, options);
      return { text, provider };
    }

    default:
      throw new Error(`Unsupported provider for model: ${model}`);
  }
}