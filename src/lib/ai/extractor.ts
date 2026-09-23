import { z } from 'zod';
import Conversation from '@/lib/models/Conversation';
import { connectToDatabase } from '@/lib/db/mongodb';
import { executeObjectWithFallback, getProposalChain } from './switcher';

// 1. Enhanced Zod Schema with AI Descriptions for better accuracy
const extractionSchema = z.object({
  projectType: z.string().describe("Main category, e.g., SaaS, E-commerce, API Development"),
  detectedModules: z.array(z.string()).describe("List of core technical features requested"),
  missingInformation: z.array(z.string()).describe("Crucial details missing to write a complete proposal"),
  isContextComplete: z.boolean().describe("True if enough info is present to generate a solid proposal"),
  timelineHint: z.string().optional().describe("Any mention of deadlines or timeframes"),
  budgetHint: z.string().optional().describe("Any mention of pricing or budget constraints")
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

export async function extractProjectRequirements(conversationId: string, rawText: string) {
  try {
    const proposalModels = getProposalChain(); 

    // 2. Strict Type-Safe Execution
    const { data: extractedData, modelUsed } = await executeObjectWithFallback<ExtractionResult>({
      modelChain: proposalModels,
      schema: extractionSchema,
      system: "You are GigThink's Lead AI Solution Architect. Extract technical requirements strictly from the client conversation. Do not invent information.",
      prompt: `Raw Conversation:\n"""\n${rawText}\n"""`
    });

    // 3. Database Update with connection check
    await connectToDatabase();
    
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: { 
          extractedContext: extractedData,
          aiModelUsed: modelUsed,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true } 
    );

    if (!updatedConversation) {
      throw new Error(`Conversation ID [${conversationId}] not found in database.`);
    }

    return { success: true, data: extractedData, modelUsed };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown AI extraction error';
    console.error("[AI_EXTRACTION_FATAL_ERROR]:", errorMessage);
    return { success: false, error: errorMessage };
  }
}