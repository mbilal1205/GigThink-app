// import Groq from "groq-sdk";

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// // Standard Non-Streaming Call
// export async function callGroqAPI(
//   model: string,
//   systemPrompt: string,
//   userPrompt: string
// ): Promise<string> {
//   try {
//     const response = await groq.chat.completions.create({
//       model: model,
//       temperature: 0.7,
//       messages: [
//         { role: "system", content: systemPrompt.trim() },
//         { role: "user", content: userPrompt.trim() },
//       ],
//     });

//     const aiOutput = response.choices[0]?.message?.content || "";

//     // 🛡️ Bulletproof Cleaning Logic
//     const finalCleanText = aiOutput
//       .replace(/undefined/gi, "")
//       .replace(/\n\s*\n/g, "\n\n")
//       .trim();

//     // Fix: Logging moved BEFORE return!
//     console.log("========== GROQ OUTPUT ==========\n", finalCleanText);

//     return finalCleanText;
//   } catch (error) {
//     console.error("Groq API Error:", error);
//     throw new Error("Failed to generate AI response.");
//   }
// }

// // 🚀 Real-time Stream Engine for Conversation Dashboard
// export async function streamGroqAPI(
//   model: string,
//   systemPrompt: string,
//   messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
// ) {
//   try {
//     const stream = await groq.chat.completions.create({
//       model: model,
//       temperature: 0.6,
//       messages: [
//         { role: "system", content: systemPrompt.trim() },
//         ...messages
//       ],
//       stream: true,
//     });

//     return stream;
//   } catch (error) {
//     console.error("Groq Stream Error:", error);
//     throw new Error("Failed to stream AI response.");
//   }
// }



// src/lib/ai/providers/groq.ts
export async function callGroqAPI(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: userPrompt.trim() },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error?.message || response.statusText;
    throw new Error(`Groq API error (${response.status}): ${errorMsg}`);
  }

  const output = data?.choices?.[0]?.message?.content || "";
  return output
    .replace(/undefined/gi, "")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}