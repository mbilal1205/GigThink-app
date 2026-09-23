import { IndustriesBase } from './industries';
import { CommunicationBase } from './communication';
import { PricingBase } from './pricing';
import { TechBase } from './tech';
import { ProposalBase } from './proposal';
import { SalesBase } from './sales';

// 1. Defining the Master Interface
export interface GigThinkKnowledgeBase {
  industries: typeof IndustriesBase;
  communication: typeof CommunicationBase;
  pricing: typeof PricingBase;
  tech: typeof TechBase;
  proposal: typeof ProposalBase;
  sales: typeof SalesBase;
}

/**
 * 🧠 GigThink AI Master Knowledge Base
 * This object contains ALL domain knowledge.
 * The Intent Engine will extract specific slices from this based on user prompts.
 */
export const MasterKnowledge: GigThinkKnowledgeBase = {
  industries: IndustriesBase,
  communication: CommunicationBase,
  pricing: PricingBase,
  tech: TechBase,
  proposal: ProposalBase,
  sales: SalesBase,
};

// --- HELPER FUNCTIONS --- //

// Helper function to get specific industry knowledge dynamically
export const getIndustryKnowledge = (industryId: string) => {
  // @ts-ignore - Dynamic key access safely
  return MasterKnowledge.industries[industryId] || null;
};

// Helper function to get specific pricing knowledge dynamically
export const getPricingKnowledge = (pricingId: string) => {
  // @ts-ignore
  return MasterKnowledge.pricing[pricingId] || null;
};