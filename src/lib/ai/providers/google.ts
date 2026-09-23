import type { ChatMessage } from "../types";

interface GoogleCallOptions {
  temperature?: number;
  maxTokens?: number;
}

export async function callGoogleGemini(
  model: string,
  messages: ChatMessage[],
  options: GoogleCallOptions = {}
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is not configured");
  }

  const baseUrl =
    process.env.GOOGLE_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta";

  // ✅ Native Gemini endpoint
  const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;

  // System message alag karo
  const systemText = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: systemText
        ? { parts: [{ text: systemText }] }
        : undefined,
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText;
    throw new Error(`Google Gemini API error (${response.status}): ${errorMsg}`);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("") || "";

  return text;
}