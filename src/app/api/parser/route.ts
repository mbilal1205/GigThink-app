import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// â”€â”€â”€ Types â”€â”€â”€
interface EnhancedParserResult {
  summary: string;
  company: string;
  skills: string[];
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  location: string;
  is_remote: boolean;
  job_type: string;
  client_quality: 'low' | 'medium' | 'high';
  pain_points: string[];
  industry: string;
  competition_estimate: 'low' | 'medium' | 'high';
  intent: 'ready_to_hire' | 'exploring' | 'uncertain';
  urgency: 'low' | 'medium' | 'high';
  timeline: string | null;
  requirements_summary: string[];
  // New intelligence fields
  client_score: number | null;         // 0-100 reputation estimate
  sentiment: 'professional' | 'casual' | 'urgent' | 'friendly' | 'formal';
  hidden_requirements: string[];
  competitive_landscape: string;
  recommended_approach: string;
  proposal_outline: string[];
  win_probability: number | null;     // 0-100 estimate
  fit_score: number | null;           // user-specific match 0-100
}

interface UserProfile {
  skills: string[];
  experience_level: string;
  min_budget: number;
  preferred_markets: string[];
  opportunity_types: string[];
}

const MAX_TEXT_LENGTH = 8000;

export async function POST(req: Request) {
  // 1. Auth
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text, url, saveToHistory = true } = body;

    // 2. Extract raw text
    let rawText = text?.trim();
    if (!rawText && url) {
      rawText = await fetchTextFromUrl(url);
    }
    if (!rawText) {
      return NextResponse.json({ error: "Please provide text or URL" }, { status: 400 });
    }
    rawText = rawText.slice(0, MAX_TEXT_LENGTH);

    // 3. Fetch user profile for fit score
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('skills, experience_level, min_budget, preferred_markets, opportunity_types')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const userProfile: UserProfile = {
      skills: profileData.skills || [],
      experience_level: profileData.experience_level || 'mid',
      min_budget: profileData.min_budget || 0,
      preferred_markets: profileData.preferred_markets || [],
      opportunity_types: profileData.opportunity_types || [],
    };

    // 4. Build AI prompt
    const prompt = buildEnhancedPrompt(rawText);

    // 5. Call Groq
    const modelName = process.env.GROQ_CHAT_CHAIN || "openai/gpt-oss-20b";
    const responseText = await callGroq(prompt, modelName);
    let parsed: EnhancedParserResult = JSON.parse(responseText.replace(/```json|```/g, '').trim());

    // 6. Compute fit score
    const fitScore = calculateFitScore(parsed, userProfile);
    parsed.fit_score = fitScore;

    // 7. Save to history if requested
    let leadId: string | null = null;
    if (saveToHistory) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('parsed_leads')
        .insert({
          user_id: user.id,
          source_text: rawText,
          source_url: url || null,
          result: parsed,
        })
        .select('id')
        .single();

      if (!insertError && inserted) {
        leadId = inserted.id;
      }
    }

    return NextResponse.json({
      success: true,
      result: parsed,
      leadId,
    }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[PARSER_ERROR]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// â”€â”€â”€ Helper: Build Prompt â”€â”€â”€
function buildEnhancedPrompt(rawText: string): string {
  return `
You are an expert lead analyst for a freelance agency. Analyze the following job post and extract comprehensive insights.

Return a JSON object with exactly these fields:
{
  "summary": "2-3 sentence summary of the project",
  "company": "Client company or individual name (if mentioned, else 'Unknown')",
  "skills": ["array of technical skills required, max 8"],
  "budget_min": number or null,
  "budget_max": number or null,
  "budget_currency": "USD" or other,
  "location": "location string or 'Remote'",
  "is_remote": boolean,
  "job_type": "freelance" | "contract" | "full-time" | "part-time" | "unknown",
  "client_quality": "low" | "medium" | "high" (based on professionalism, detail, and clarity),
  "pain_points": ["array of client pain points, max 3"],
  "industry": "SaaS", "E-commerce", "FinTech", etc.,
  "competition_estimate": "low" | "medium" | "high" (how many freelancers likely to apply),
  "intent": "ready_to_hire" | "exploring" | "uncertain",
  "urgency": "low" | "medium" | "high",
  "timeline": "any deadline or duration mentioned, else null",
  "requirements_summary": ["bullet points of key requirements, max 5"],
  "client_score": 0-100 number indicating client's likely reputation/payment history (if inferable, else null),
  "sentiment": "professional" | "casual" | "urgent" | "friendly" | "formal",
  "hidden_requirements": ["array of implied needs not explicitly stated, max 3"],
  "competitive_landscape": "brief analysis of competition for this job",
  "recommended_approach": "suggested strategy for winning this client (1-2 sentences)",
  "proposal_outline": ["array of section titles for a proposal, max 5"],
  "win_probability": 0-100 number estimating chance of winning if you apply
}

IMPORTANT RULES:
- Return ONLY the JSON object, no markdown fences, no extra text.
- If information is not available, use null for numbers and empty arrays for lists.
- Use professional language.

Job Post:
${rawText}
`.trim();
}

// â”€â”€â”€ Helper: Call Groq API â”€â”€â”€
async function callGroq(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error:", errorText);
    throw new Error("AI service error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '{}';
}

// â”€â”€â”€ Helper: Fetch text from URL â”€â”€â”€
async function fetchTextFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, MAX_TEXT_LENGTH);
  } catch (err) {
    console.error("URL fetch error:", err);
    return null;
  }
}

// â”€â”€â”€ Helper: Calculate Fit Score â”€â”€â”€
function calculateFitScore(parsed: EnhancedParserResult, profile: UserProfile): number {
  // Skill match (35%)
  const reqSkills = parsed.skills || [];
  const userSkills = profile.skills || [];
  const skillMatch = reqSkills.length > 0
    ? reqSkills.filter(s => userSkills.some(us => us.toLowerCase() === s.toLowerCase())).length / reqSkills.length
    : 0.5;

  // Budget fit (25%)
  const budgetMax = parsed.budget_max;
  const budgetFit = budgetMax && profile.min_budget <= budgetMax ? 1 : 0.5;

  // Location fit (15%)
  const locationFit = parsed.is_remote || profile.preferred_markets.some(m => m.toUpperCase() === (parsed.location || '').toUpperCase()) ? 1 : 0.5;

  // Client quality (10%)
  const qualityScore = { high: 0.9, medium: 0.6, low: 0.3 }[parsed.client_quality] || 0.5;

  // Experience fit (15%) - based on experience level (simple heuristic)
  const expLevel = profile.experience_level || 'mid';
  const jobType = parsed.job_type || 'unknown';
  const expFit = (expLevel === 'senior' && ['full-time', 'contract'].includes(jobType)) ? 1 : 0.7;

  const raw = skillMatch * 0.35 + budgetFit * 0.25 + locationFit * 0.15 + qualityScore * 0.10 + expFit * 0.15;
  return Math.round(raw * 100);
}