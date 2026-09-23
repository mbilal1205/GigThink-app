// lib/ai/knowledge/industries.ts

// 1. Interface for Type Safety
export interface IndustryKnowledge {
  id: string;
  name: string;
  description: string;
  targetAudience: string[];
  painPoints: string[];
  commonGoals: string[];
  recommendedFeatures: string[];
  integrations: string[];
  jargon: string[];
  complianceRequirements: string[];
}

// 2. Importing all leaf files (Make sure paths are correct based on your setup)
import { restaurantIndustry } from '../industries/restaurant';
import { saasIndustry } from '../industries/saas';
import { ecommerceIndustry } from '../industries/ecommerce';
import { healthcareIndustry } from '../industries/healthcare';
import { fintechIndustry } from '../industries/fintech';
import { realestateIndustry } from '../industries/realestate';
import { educationIndustry } from '../industries/education';
import { travelIndustry } from '../industries/travel';
import { automotiveIndustry } from '../industries/automotive';
import { legalIndustry } from '../industries/legal';

// 3. Exporting as a structured Map for O(1) fast lookup by Intent Engine
export const IndustriesBase: Record<string, IndustryKnowledge> = {
  restaurant: restaurantIndustry,
  saas: saasIndustry,
  ecommerce: ecommerceIndustry,
  healthcare: healthcareIndustry,
  fintech: fintechIndustry,
  realestate: realestateIndustry,
  education: educationIndustry,
  travel: travelIndustry,
  automotive: automotiveIndustry,
  legal: legalIndustry,
};