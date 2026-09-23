interface DeepSeekParsedResponse {
  content: string;
  reasoningContent: string;
}

export function parseDeepSeekResponse(payload: unknown): DeepSeekParsedResponse {
  const data = payload as any;

  const message = data?.choices?.[0]?.message;

  return {
    content: message?.content || "",
    reasoningContent: message?.reasoning_content || "",
  };
}