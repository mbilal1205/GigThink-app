export const saasIndustry = {
  id: "saas",
  name: "Software as a Service (SaaS)",
  description: "Cloud-based software products offered on a subscription model.",
  targetAudience: ["B2B Businesses", "Enterprise Clients", "Freelancers", "Agencies"],
  painPoints: [
    "High customer churn rate (users canceling subscriptions)",
    "Complex onboarding process causing drop-offs",
    "Scalability issues during traffic spikes",
    "Difficulty justifying pricing tiers"
  ],
  commonGoals: [
    "Maximize MRR (Monthly Recurring Revenue) and ARR",
    "Reduce Customer Acquisition Cost (CAC)",
    "Provide a frictionless onboarding experience",
    "Ensure 99.99% uptime and data security"
  ],
  recommendedFeatures: [
    "Tiered Subscription & Billing Management",
    "Self-serve User Onboarding & Interactive Tutorials",
    "Comprehensive Admin Dashboard & Analytics",
    "Multi-tenant Architecture",
    "API Access for external integrations"
  ],
  integrations: ["Stripe Billing", "Auth0/Clerk", "Intercom/Zendesk", "Mixpanel/Amplitude", "AWS/Vercel"],
  jargon: ["MRR/ARR", "Churn", "CAC", "LTV", "Multi-tenancy", "Freemium"],
  complianceRequirements: ["SOC 2 Type II", "GDPR", "CCPA", "ISO 27001"]
};