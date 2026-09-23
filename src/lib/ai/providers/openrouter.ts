import type { ChatMessage } from "../types";

interface OpenRouterCallOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function callOpenRouter(
  model: string,
  messages: ChatMessage[],
  options: OpenRouterCallOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const baseUrl =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "GigThink",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText;
    throw new Error(`OpenRouter API error (${response.status}): ${errorMsg}`);
  }

  return data?.choices?.[0]?.message?.content ?? "";
}