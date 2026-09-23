import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { z } from "zod";

// â”€â”€â”€ Types â”€â”€â”€
export interface LeadInput {
  id?: string;
  title: string;
  description: string;
  clientName?: string;
  clientCompany?: string;
  budget?: number;
  currency?: string;
  skillsRequired?: string[];
  source?: string; // e.g., "Adzuna", "Manual", "Feed"
  postedAt?: string;
}

export interface OpportunityScore {
  matchPercentage: number; // 0-100
  recommendation: "apply" | "dont_apply" | "maybe";
  reasoning: string; // Why this decision
  hiddenPain?: string; // Hidden problem AI detected
  clientQuality?: number; // 0-100
  urgency?: "high" | "medium" | "low";
  suggestedApproach?: string; // How to approach client
  missingSkills?: string[]; // Skills user lacks
  nextSteps?: string[];
}

// â”€â”€â”€ Zod schema for AI output validation â”€â”€â”€
const aiScoreSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
  recommendation: z.enum(["apply", "dont_apply", "maybe"]),
  reasoning: z.string(),
  hiddenPain: z.string().optional(),
  clientQuality: z.number().min(0).max(100).optional(),
  urgency: z.enum(["high", "medium", "low"]).optional(),
  suggestedApproach: z.string().optional(),
  missingSkills: z.array(z.string()).optional(),
  nextSteps: z.array(z.string()).optional(),
});

export async function scoreOpportunity(
  userId: string,
  lead: LeadInput
): Promise<OpportunityScore> {
  // 1. Fetch user profile from Supabase
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("agency_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[PROFILE_FETCH_ERROR]", error);
    // Continue with empty profile
  }

  const userSkills = profile?.core_skills || [];
  const userTechStack = profile?.preferred_tech_stack || [];
  const hourlyRate = profile?.base_hourly_rate || 50;
  const currency = profile?.currency || "USD";
  const agencyName = profile?.agency_name || "Your Agency";

  // 2. Build system prompt for Groq
  const systemInstruction = `
You are an AI Opportunity Analyst for GigThink. Your job is to evaluate a freelance opportunity and provide a professional score for the user.

**User Profile:**
- Agency: ${agencyName}
- Skills: ${userSkills.join(", ") || "Not specified"}
- Tech Stack: ${userTechStack.join(", ") || "Not specified"}
- Hourly Rate: ${currency} ${hourlyRate}

**Lead Data:**
- Title: ${lead.title}
- Client: ${lead.clientName || "Unknown"} ${lead.clientCompany ? "(" + lead.clientCompany + ")" : ""}
- Budget: ${lead.budget ? `${lead.currency || "USD"} ${lead.budget}` : "Not specified"}
- Required Skills: ${lead.skillsRequired?.join(", ") || "Not specified"}
- Description: ${lead.description}

Analyze the opportunity and output ONLY a valid JSON object with these fields:
{
  "matchPercentage": number (0-100), // How well does this lead match user's skills, budget, and experience
  "recommendation": "apply" | "dont_apply" | "maybe",
  "reasoning": string, // Explain the score and recommendation in 2-3 sentences
  "hiddenPain": string (optional), // What hidden problem the client likely has (e.g., "slow website", "poor conversion")
  "clientQuality": number (0-100 optional), // Client quality score based on budget, clarity, professionalism
  "urgency": "high" | "medium" | "low" (optional),
  "suggestedApproach": string (optional), // How to approach the client
  "missingSkills": string[] (optional), // Skills the user lacks for this project
  "nextSteps": string[] (optional) // Specific actions user should take next
}

Rules:
- Output ONLY the JSON object, no markdown, no extra text.
- If budget is missing, use client quality and project scope to estimate.
- If user lacks critical skills, recommendation should be "dont_apply" or "maybe" with reason.
- Be honest and data-driven. Don't inflate scores.
`;

  // 3. Call Groq
  const rawResponse = await generateAIResponse({
    userId,
    prompt: lead.description,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction,
  });

  // 4. Parse JSON robustly
  let parsed: any;
  try {
    const cleaned = rawResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("[OPP_SCORE_PARSE_ERROR]", err);
    // Fallback: basic heuristic
    return fallbackScore(lead, userSkills);
  }

  // 5. Validate with Zod
  const validation = aiScoreSchema.safeParse(parsed);
  if (!validation.success) {
    console.error("[OPP_SCORE_VALIDATION]", validation.error.format());
    return fallbackScore(lead, userSkills);
  }

  return validation.data;
}

// Fallback scorer when AI fails
function fallbackScore(lead: LeadInput, userSkills: string[]): OpportunityScore {
  const requiredSkills = lead.skillsRequired || [];
  const matchingSkills = requiredSkills.filter((skill) =>
    userSkills.some((userSkill) => userSkill.toLowerCase() === skill.toLowerCase())
  );
  const matchPercentage = requiredSkills.length > 0
    ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
    : 50;

  let recommendation: OpportunityScore["recommendation"] = "maybe";
  if (matchPercentage >= 70) recommendation = "apply";
  else if (matchPercentage < 30) recommendation = "dont_apply";

  return {
    matchPercentage,
    recommendation,
    reasoning: `Basic match based on skills: ${matchingSkills.length}/${requiredSkills.length} skills matched.`,
  };
}