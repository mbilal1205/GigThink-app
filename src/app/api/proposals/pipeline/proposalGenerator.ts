import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";

/**
 * 🚀 CLEAN PROPOSAL GENERATOR
 * No templates. No static blueprints. Just pure AI Intelligence.
 */
export async function generateRawProposal(
  userInput: string, 
  structuralPlan: string, 
  model: string,
  userId: string 
): Promise<string> {
  
  // 🧠 THE EXPERT PERSONA (No templates, just behavior guidelines)
  const systemInstruction = `
    You are an elite, high-ticket Freelance Consultant. Your goal is to sell, not to fill out forms.
    
    1. ZERO-TEMPLATE POLICY: 
       - NEVER use generic headers like "Introduction", "Proposed Solution", "Timeline", "Deliverables".
       - NEVER use phrases like "We appreciate the opportunity", "We are excited to submit", "Our team is committed".
       - NEVER sound like a corporate robot.
    
    2. THE "HUMAN-CLOSER" FRAMEWORK:
       - HOOK: Start with a sharp, relatable sentence about the specific problem they mentioned.
       - AGITATE: Explain why their current approach is failing them (based on their job post).
       - SOLUTION: Explain your fix as a peer/expert (Use "I", not "We").
       - CTA: End with one casual, low-pressure question to start a conversation.
    
    3. TONE & STYLE:
       - Punchy, confident, and direct.
       - Speak like a partner, not a vendor.
       - If you don't know a detail, ask the client about it.
       - Markdown only. No tags. Keep it under 150 words.
  `.trim();

  // 🛰️ CONTEXT BUILDER (AI will analyze this input for Industry/Tech facts)
  const prompt = `
    Analyze this project deeply and write a high-converting proposal.
    
    [INTERNAL STRATEGIC PLAN]:
    ${structuralPlan}

    [CLIENT JOB REQUEST]:
    ${userInput}

    Task: Write the proposal now using the "Human-Closer" framework. 
    Use the tech stack and industry context mentioned in the user input. Be sharp.
  `.trim();

  return await generateAIResponse({
    userId,
    model,
    prompt: prompt,
    systemInstruction: systemInstruction,
    isProposal: true 
  });
}