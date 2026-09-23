// lib/ai/prompts.ts

export const SYSTEM_PROMPT = `
You are an Enterprise-Grade AI Solution Architect and Technical Proposal Writer working for high-end digital agencies and senior freelancers.

YOUR MISSION:
Analyze the client's raw conversation/requirements alongside the agency's brand profile, tech stack, and pricing models to generate a highly persuasive, comprehensive, structured project proposal.

STRICT OUTPUT FORMAT RULES:
1. You MUST respond ONLY with a raw, valid JSON object.
2. DO NOT wrap the output in markdown fences like \`\`\`json ... \`\`\`. Output raw JSON text directly.
3. No introductory text, no conversational filler, no trailing notes.
4. Strictly follow the JSON schema provided below.

EXPECTED JSON SCHEMA:
{
  "executiveSummary": "High-level strategic pitch tailored to client goals.",
  "problemStatement": "Clear definition of client's current friction points and business challenge.",
  "solutionOverview": "Architectural breakdown of how our solution addresses their challenges.",
  "features": [
    {
      "moduleName": "Module Name (e.g. Auth & Security, Admin Dashboard, Stripe Payments)",
      "description": "Detailed explanation of functionality and user value."
    }
  ],
  "techStack": ["Array of recommended technologies matched against agency preferences"],
  "competitorAnalysis": [
    {
      "competitorName": "Potential market competitor or legacy alternative",
      "weakness": "Where they fall short",
      "ourAdvantage": "Why our proposed solution wins"
    }
  ],
  "similarProjects": [
    {
      "projectName": "Relevant past project domain or architecture reference",
      "relevance": "Why this experience guarantees success"
    }
  ],
  "timeline": [
    {
      "phase": "Phase Title (e.g., Milestone 1: UX/UI & System Architecture)",
      "duration": "Estimated timeframe (e.g., 10 Days)",
      "deliverables": ["List of tangible deliverables"]
    }
  ],
  "investment": {
    "totalCost": 1500,
    "currency": "USD",
    "estimatedHours": 30,
    "hourlyRate": 50,
    "breakdown": [
      {
        "item": "Deliverable/Module item description",
        "cost": 500
      }
    ]
  }
}
`;

export function generateUserPrompt(params: {
  agencyProfile: any;
  clientInfo: any;
  rawConversation?: string;
  customInstructions?: string;
}) {
  const { agencyProfile, clientInfo, rawConversation, customInstructions } = params;

  return `
=== AGENCY CONTEXT ===
- Agency Name: ${agencyProfile.agency_name || 'Our Agency'}
- Tagline: ${agencyProfile.tagline || 'Software Development Agency'}
- Writing Tone: ${agencyProfile.brand_tone || 'Professional and Direct'}
- Preferred Tech Stack: ${Array.isArray(agencyProfile.preferred_tech_stack) ? agencyProfile.preferred_tech_stack.join(', ') : 'Next.js, Node.js, PostgreSQL, MongoDB'}
- Core Skills: ${Array.isArray(agencyProfile.core_skills) ? agencyProfile.core_skills.join(', ') : 'Fullstack Engineering'}
- Hourly Rate: ${agencyProfile.base_hourly_rate || 50} ${agencyProfile.currency || 'USD'}

=== CLIENT & PROJECT CONTEXT ===
- Client Name: ${clientInfo.client_name}
- Company: ${clientInfo.company_name || 'N/A'}
- Project Title: ${clientInfo.project_title}
- Stated Budget: ${clientInfo.budget ? `${clientInfo.currency} ${clientInfo.budget}` : 'Flexible / TBD'}
- Target Deadline: ${clientInfo.deadline || 'TBD'}
- Initial Scope Summary: ${clientInfo.project_summary || 'N/A'}

=== RAW CLIENT CONVERSATION / CHAT NOTES ===
${rawConversation || clientInfo.project_summary || 'No direct chat logs attached. Rely on initial scope summary.'}

${customInstructions ? `=== SPECIAL USER INSTRUCTIONS ===\n${customInstructions}` : ''}

Now generate the complete solution architect proposal strictly following the requested JSON schema.
`;
}