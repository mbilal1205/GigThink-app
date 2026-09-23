import { z } from 'zod';
import { executeObjectWithFallback, getProposalChain } from './switcher';
import { getAgencyProfile, AgencyProfileData } from '@/supabase/getAgencyProfile';
import { connectToDatabase } from '@/lib/db/mongodb';
import Proposal from '@/lib/models/Proposal';

// 1. Strict Zod Output Schema for Complete Proposal
export const proposalZodSchema = z.object({
  executiveSummary: z.string().describe("High-level pitch tailored to client goals and agency brand tone"),
  problemStatement: z.string().describe("Clear articulation of client's pain points extracted from conversation"),
  solutionOverview: z.string().describe("How the agency will solve the problem using their specific capabilities"),
  features: z.array(
    z.object({
      moduleName: z.string(),
      description: z.string(),
      deliverables: z.array(z.string())
    })
  ),
  techStack: z.array(z.string()).describe("Recommended technologies, prioritized according to agency's preferred stack"),
  competitorAnalysis: z.array(
    z.object({
      competitorName: z.string(),
      weakness: z.string(),
      ourAdvantage: z.string()
    })
  ),
  similarProjects: z.array(
    z.object({
      projectName: z.string(),
      relevance: z.string()
    })
  ),
  timeline: z.array(
    z.object({
      phase: z.string(),
      duration: z.string(),
      deliverables: z.array(z.string())
    })
  ),
  investment: z.object({
    totalCost: z.number(),
    currency: z.string(),
    breakdown: z.array(
      z.object({
        item: z.string(),
        estimatedHours: z.number(),
        cost: z.number()
      })
    ),
    terms: z.string().describe("Payment terms e.g., 50% advance, 50% on delivery")
  })
});

export type ProposalOutput = z.infer<typeof proposalZodSchema>;

interface GenerateProposalArgs {
  userId: string;
  projectId: string;
  rawText: string;
  extractedContext: {
    projectType?: string;
    detectedModules?: string[];
    missingInformation?: string[];
  };
  additionalAnswers?: Record<string, string>; // User answers to missing questions
}

export async function generateFullProposal({
  userId,
  projectId,
  rawText,
  extractedContext,
  additionalAnswers
}: GenerateProposalArgs) {
  try {
    // 1. Fetch Agency Profile Context from Supabase
    const agencyProfile: AgencyProfileData | null = await getAgencyProfile(userId);

    // Fallback values if agency profile is not yet fully configured
    const agencyName = agencyProfile?.agency_name || "Our Agency";
    const brandTone = agencyProfile?.brand_tone || "Professional, direct, and value-focused";
    const preferredTech = agencyProfile?.preferred_tech_stack?.join(", ") || "Modern Stack (Next.js, Node.js, Cloud DBs)";
    const skills = agencyProfile?.core_skills?.join(", ") || "Full-Stack Development, UI/UX, Cloud Architecture";
    const hourlyRate = agencyProfile?.base_hourly_rate || 50;
    const currency = agencyProfile?.currency || "USD";

    // 2. Build the System Prompt with Injected Supabase Context
    const systemPrompt = `
You are the AI Solution Architect for "${agencyName}".
Your brand tone is: "${brandTone}".
Core Skills: ${skills}
Preferred Tech Stack: ${preferredTech}
Default Base Hourly Rate: ${hourlyRate} ${currency}

CRITICAL INSTRUCTIONS:
1. Write the proposal AS IF you are the solution architect of "${agencyName}".
2. Adapt tech stack recommendations to prioritize "${preferredTech}" where applicable.
3. Calculate feature breakdown estimates using reasonable hours multiplied by the hourly rate (${hourlyRate} ${currency}).
4. Keep the writing tone strictly "${brandTone}".
5. Output ONLY valid structured data matching the exact schema.
    `.trim();

    // 3. Build User Context Prompt
    const userPrompt = `
PROJECT DATA:
- Raw Client Conversation: """${rawText}"""
- Extracted Project Type: ${extractedContext.projectType || 'Custom Project'}
- Detected Modules: ${extractedContext.detectedModules?.join(', ') || 'None specified'}
${additionalAnswers ? `- User Answers to Clarifications: ${JSON.stringify(additionalAnswers)}` : ''}

Generate a complete, high-converting, highly professional software proposal.
    `.trim();

    // 4. Call Groq via Switcher Chain
    const proposalModels = getProposalChain();
    
    const { data: generatedProposal, modelUsed } = await executeObjectWithFallback<ProposalOutput>({
      modelChain: proposalModels,
      schema: proposalZodSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    // 5. Save Proposal to MongoDB
    await connectToDatabase();

    const newProposal = await Proposal.create({
      userId,
      projectId,
      version: 1,
      isFinal: false,
      aiModelUsed: modelUsed,
      content: generatedProposal,
    });

    return {
      success: true,
      proposalId: newProposal._id.toString(),
      data: generatedProposal,
      modelUsed,
    };

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Proposal generation failed";
    console.error("[PROPOSAL_GENERATION_FATAL_ERROR]:", message);
    return { success: false, error: message };
  }
}