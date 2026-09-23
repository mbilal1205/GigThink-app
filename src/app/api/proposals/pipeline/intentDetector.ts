import { createClient } from "@supabase/supabase-js"; // Agar db logging chahiye

interface IntentResult {
  intent: "PROPOSAL" | "CONVERSATION";
  confidence: number;
  detectedLanguage: string;
}

export async function detectUserIntent(userInput: string): Promise<IntentResult> {
  const apiKey = process.env.GROQ_API_KEY;
  
  const systemPrompt = `
    You are the ultra-precise Intent Detection Gatekeeper for GigThink AI.
    Your sole job is to analyze the user's input and determine if they want to write a professional job proposal/cover letter, or if they are just having a regular conversation/debugging.

    CATEGORIES:
    1. PROPOSAL: Trigger this if the user provides a job description, asks to write a pitch, cover letter, proposal, or asks how to apply for a specific role.
    2. CONVERSATION: Trigger this if the user says hello, asks generic coding/lifestyle questions, or chats casually.

    CRITICAL RULE: You must return ONLY a JSON object. No markdown, no prose.
    Format:
    {
      "intent": "PROPOSAL" | "CONVERSATION",
      "confidence": 0.0 to 1.0,
      "detectedLanguage": "english" | "urdu" | "roman-urdu"
    }
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Speed & cost efficiency
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput }
        ],
        response_format: { type: "json_object" }, // Forces Groq to output clean JSON
        temperature: 0.1, // Lowest temperature for strict classification
      }),
    });

    const data = await response.json();
    const result: IntentResult = JSON.parse(data.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Error in Intent Detector:", error);
    // Safety fallback
    return { intent: "CONVERSATION", confidence: 0.5, detectedLanguage: "english" };
  }
}