import { generateAIResponse as runAIOrchestrator } from "@/lib/ai/orchestrator/orchestrator";

export async function reviewAndPolish(
  rawProposal: string, 
  model: string,
  userId: string // 👈 Optional parameter add kiya
): Promise<string> {
  const criticInstruction = `
    You are a brutal, cynical Anti-AI Editor. 
    Your job is to take the generated proposal, polish it, and wrap the final pitch inside a special XML tag...
    (Baqi instruction text same hai)
  `;

  const structuredPrompt = `Analyze, polish, and format this raw proposal according to your system instructions:\n\n"""\n${rawProposal}\n"""`;

  return await runAIOrchestrator({
    userId, // 👈 Pass it here
    model,
    prompt: structuredPrompt,
    systemInstruction: criticInstruction,
    isProposal: true // 👈 Takay isme bhi Tavily mode hi trigger ho agar search lagti hai
  });
}