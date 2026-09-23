// src/lib/ai/knowledge/pricing/enterprise.ts
import type { PricingModel } from "../knowledge/pricing"; // path check karo (relative ho sakta hai)

export const enterprisePricing: PricingModel = {
  id: "enterprise",

  type: "enterprise",

  description:
    "Custom, value-based pricing for agencies and teams with complex, high-volume client acquisition needs. Includes dedicated support, custom integrations, and SLA guarantees.",

  bestFor: [
    "Agencies with 5+ team members",
    "Businesses with recurring, high-volume client work",
    "Teams that need custom integrations, SSO, and dedicated support",
    "Organizations that require a signed MSA and SLA",
  ],

  pros: [
    "Unlimited seats and unlimited proposals",
    "Dedicated account manager and priority support",
    "Custom integrations and full API access",
    "SSO (Single Sign-On) and audit logs",
    "SLA-backed uptime and response times",
    "Invoice-based billing (no per-seat limits)",
  ],

  cons: [
    "Higher total cost than Pro/Agency plans",
    "Longer onboarding and setup time",
    "Annual contract commitment usually required",
    "Requires custom scoping call before purchase",
  ],

  negotiationTactics: [
    "Anchor the conversation on ROI and revenue generated per team member, not per-seat price",
    "Bundle training, onboarding, and quarterly business reviews to increase perceived value",
    "Offer volume discounts for annual upfront commitments",
    "Use customer case studies to justify premium pricing",
    "Define clear usage limits and overage pricing upfront to avoid scope creep",
  ],

  jargon: [
    "SLA (Service Level Agreement)",
    "SSO (Single Sign-On)",
    "MSA (Master Service Agreement)",
    "API rate limits",
    "Dedicated instance",
    "QBR (Quarterly Business Review)",
    "TCO (Total Cost of Ownership)",
  ],
};