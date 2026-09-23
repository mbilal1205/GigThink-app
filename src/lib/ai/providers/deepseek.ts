import type { ChatMessage } from "../types";

interface DeepSeekCallOptions {
  temperature?: number;
  maxTokens?: number;
}

interface DeepSeekCallResult {
  content: string;
  reasoningContent: string;
}

export async function callDeepSeek(
  model: string,
  messages: ChatMessage[],
  options: DeepSeekCallOptions = {}
): Promise<DeepSeekCallResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const baseUrl =
    process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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
    throw new Error(`DeepSeek API error (${response.status}): ${errorMsg}`);
  }

  const message = data?.choices?.[0]?.message;

  return {
    content: message?.content || "",
    reasoningContent: message?.reasoning_content || "",
  };
}