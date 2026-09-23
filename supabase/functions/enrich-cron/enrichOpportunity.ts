/// <reference lib="deno.ns" />
// FIXED: Using Deno's native npm specifier with a strict version
import Groq from 'npm:groq-sdk@0.15.0';

// FIXED: Using Deno.env.get() instead of Node's process.env
const groq = new Groq({
  apiKey: Deno.env.get('GROQ_API_KEY') || '',
});

interface EnrichmentResult {
  skills: string[];
  budget_min: number | null;
  budget_max: number | null;
  client_quality: 'low' | 'medium' | 'high';
  pain_points: string[];
  industry: string;
  competition_estimate: 'low' | 'medium' | 'high';
}

export async function enrichJobDescription(description: string): Promise<EnrichmentResult> {
  const prompt = `
Analyze the following job posting and return a JSON object with these fields:
- "skills": array of technical skills required (e.g., ["React", "Node.js", "TypeScript"]). At most 5 skills.
- "budget_min": estimated minimum budget in USD (number or null if impossible to guess).
- "budget_max": estimated maximum budget in USD (number or null).
- "client_quality": "low", "medium", or "high" based on the professionalism of the description, clarity, and detail.
- "pain_points": an array of strings describing urgent needs or problems (e.g., ["urgent deadline", "replacing previous developer"]). Max 3.
- "industry": a short string like "SaaS", "E-commerce", "FinTech", "Healthcare", etc. If unclear, use "Other".
- "competition_estimate": "low", "medium", or "high" based on whether the job seems specific and demanding (low competition) or generic and common (high competition).

IMPORTANT: Return only the JSON object without any markdown formatting or extra text.

Job posting:
${description}
  `.trim();

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant', // fast & cheap
    temperature: 0.1,
    max_tokens: 500,
  });

  const responseText = completion.choices[0]?.message?.content || '{}';
  
  // Safely parse JSON
  try {
    const parsed = JSON.parse(responseText.trim());
    return {
      skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 5) : [],
      budget_min: typeof parsed.budget_min === 'number' ? parsed.budget_min : null,
      budget_max: typeof parsed.budget_max === 'number' ? parsed.budget_max : null,
      client_quality: ['low', 'medium', 'high'].includes(parsed.client_quality) ? parsed.client_quality : 'medium',
      pain_points: Array.isArray(parsed.pain_points) ? parsed.pain_points.slice(0, 3) : [],
      industry: typeof parsed.industry === 'string' ? parsed.industry : 'Other',
      competition_estimate: ['low', 'medium', 'high'].includes(parsed.competition_estimate) ? parsed.competition_estimate : 'medium',
    };
  } catch (e) {
    console.error('Failed to parse Groq response:', responseText);
    throw e;
  }
}
