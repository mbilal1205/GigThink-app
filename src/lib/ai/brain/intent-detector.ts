// src/lib/ai/brain/intent-detector.ts
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";

export interface IntentResult {
  tool: string;           // Tool name (e.g., "proposal", "pricing", "risk", "negotiation", etc.)
  confidence: number;     // 0 to 1
  extractedProjectId?: string | null;
  reasoning: string;
}

// Ye list router.ts ke toolRegistry keys ke exactly match honi chahiye
const TOOL_NAMES = [
  "proposal", "pricing", "risk", "analyzer", "planning",
  "negotiation", "techarchitect", "timeestimator", "interviewcoach",
  "reviewer", "contract", "mentor", "upsell", "qa", "delivery",
  "skillgap", "scopegenerator", "crm", "businesscoach",
  "healthmonitor", "callprep", "revision", "portfolio",
  "learning", "deadline", "chat",
  // Naye action tools
  "search_leads", "create_client", "save_proposal", "draft_email", "create_task",
   "list_clients", // ye add karo
   "list_proposals",
  "delete_client",
  "search_opportunities",
  "schedule_followup",
  "set_preference",
  "get_preferences",
];

export async function detectIntent(
  message: string,
  userId: string
): Promise<IntentResult> {
  const systemInstruction = `
You are an expert AI Tool Classifier for the GigThink AI Agent.

Your job is to analyze the user's message and classify it into ONE of these exact tool categories:

${TOOL_NAMES.map(name => `- "${name}"`).join("\n")}

IMPORTANT RULES:
- Return ONLY valid JSON. No markdown, no extra text.
- Choose the tool that BEST matches the user's intent.
- If nothing fits well, choose "chat".
- If the message mentions a project ID or MongoDB ObjectId, extract it in "extractedProjectId".
- Provide a short 1-line "reasoning" for your choice.

OUTPUT FORMAT:
{
  "tool": "proposal",
  "confidence": 0.95,
  "extractedProjectId": null,
  "reasoning": "User asked to write a proposal."
}
`;

  const userPrompt = `User Message: "${message}"\n\nClassify this message.`;

  try {
    const rawResponse = await generateAIResponse({
      userId,
      prompt: userPrompt,
      isProposal: false, // chat mode chain use hogi
      isSectionGeneration: false,
      systemInstruction,
    });

    // JSON extract karo
    let clean = rawResponse.replace(/```json|```/g, "").trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in intent response");

    const result = JSON.parse(jsonMatch[0]);

    return {
      tool: result.tool as string,
      confidence: result.confidence || 0.8,
      extractedProjectId: result.extractedProjectId || null,
      reasoning: result.reasoning || "Classified by AI",
    };
  } catch (error) {
    console.error("[INTENT_DETECTOR] Error:", error);
    // Fallback to chat
    return {
      tool: "chat",
      confidence: 0.5,
      extractedProjectId: null,
      reasoning: "Fallback due to detection error",
    };
  }
}