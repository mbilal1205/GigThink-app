import { hourlyPricing } from '../pricing/hourly';
import { fixedPricing } from '../pricing/fixed';
import { enterprisePricing } from '../pricing/enterprise';

// Type safety ke liye interface
export interface PricingModel {
  id: string;
  type: string;
  description: string;
  bestFor: string[];
  pros: string[];
  cons: string[];
  negotiationTactics: string[];
  jargon: string[];
}

// Pricing object jisme teeno files combine ho rahi hain
export const PricingBase: Record<string, PricingModel> = {
  hourly: hourlyPricing,
  fixed: fixedPricing,
  enterprise: enterprisePricing
};