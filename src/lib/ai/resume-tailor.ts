import { callGroqAPI } from '@/lib/ai/providers/groq';
import { CandidateProfile } from '@/lib/types/candidate';
import { NormalizedJob } from '@/lib/sources/types';

export interface StructuredResume {
  fullName: string;
  headline: string;
  summary: string;
  skills: string[];
  workExperience: {
    company: string;
    title: string;
    startDate: string;
    endDate?: string | null;
    achievements: string[];
  }[];
  projects: {
    name: string;
    description: string;
    technologies: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate?: string;
    endDate?: string;
  }[];
  certifications?: string[];
}

const FALLBACK_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
];

async function callGroqWithFallback(systemPrompt: string, userPrompt: string): Promise<string> {
  let lastError: any;
  for (const model of FALLBACK_MODELS) {
    try {
      return await callGroqAPI(model, systemPrompt, userPrompt);
    } catch (err: any) { // <-- Yahan ': any' add kar diya hai
      lastError = err;
      console.warn(`[GROQ_FALLBACK] ${model} failed: ${err?.message || err}`);
    }
  }
  throw new Error('All Groq models failed: ' + (lastError?.message || lastError));
}

export async function generateTailoredResume(
  userId: string,
  profile: CandidateProfile,
  job: NormalizedJob
): Promise<StructuredResume> {
  const systemPrompt = `You are an expert resume writer with 15+ years of experience crafting ATS-optimized resumes for top technology companies. Your task is to create a DETAILED, PROFESSIONAL, and COMPREHENSIVE tailored resume for the candidate based on their profile and the target job description.

CRITICAL INSTRUCTIONS:
- DO NOT simply copy the candidate's profile text. Expand upon it with industry-standard professional language, quantified achievements, and powerful action verbs.
- For each work experience, generate 3-5 specific bullet-point achievements that demonstrate impact, using metrics (e.g., "Improved API performance by 40%", "Reduced deployment time by 50%"). These should be plausible given the candidate's background and the job requirements.
- Tailor the summary to highlight the candidate's most relevant strengths for THIS specific job.
- Extract relevant keywords from the job description and naturally incorporate them into the resume.
- Ensure all content is ATS-friendly: use standard section headings, avoid tables/images/columns, and use bullet points.
- If the candidate's profile lacks specific details, infer reasonable, generic but professional content that aligns with their role and the job (e.g., if they say "built APIs", you can write "Designed and implemented RESTful APIs that served 100K+ daily requests"). Do NOT fabricate specific company names or false statistics; use safe, generic but impressive phrasing.
- Make the resume long enough to be comprehensive but concise; aim for 400-600 words total.
- Output ONLY a valid JSON object matching this exact structure:
{
  "fullName": "string",
  "headline": "string (target job title)",
  "summary": "string (3-4 sentences, quantified)",
  "skills": ["string"],
  "workExperience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null",
      "achievements": ["string (action verb + task + result/impact)"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string (detailed, 2-3 sentences, includes tech stack and outcome)",
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "YYYY",
      "endDate": "YYYY or null"
    }
  ],
  "certifications": ["string"]
}
- Do not include any markdown formatting, code fences, or extra text. Only the raw JSON.
`;

  const userPrompt = `Create a comprehensive professional resume for the candidate applying to the position of ${job.title} at ${job.company}. Here is the candidate profile (may be sparse, so elaborate professionally):\n\n${JSON.stringify(profile, null, 2)}\n\nJob Description:\n${job.description || 'Not provided'}\n\nRequirements:\n${job.requirements?.join(', ') || 'Not provided'}\n\nSkills Required:\n${job.skills?.join(', ') || 'Not provided'}`;

  const rawOutput = await callGroqWithFallback(systemPrompt, userPrompt);

  // Parse JSON robustly
  try {
    const cleaned = rawOutput.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[RESUME_PARSE_ERROR]', err);
    // Fallback: minimal structured resume from profile (still better than nothing)
    return {
      fullName: profile.full_name || 'Your Name',
      headline: job.title,
      summary: profile.summary || `Results-driven professional seeking ${job.title} role at ${job.company}.`,
      skills: profile.skills || [],
      workExperience: (profile.work_experience || []).map((exp: any) => ({
        company: exp.company,
        title: exp.title,
        startDate: exp.start_date,
        endDate: exp.end_date,
        achievements: exp.description ? [exp.description] : [`Successfully contributed to ${exp.company} as ${exp.title}.`],
      })),
      projects: (profile.projects || []).map((p: any) => ({
        name: p.name,
        description: p.description,
        technologies: typeof p.technologies === 'string' ? p.technologies.split(',').map((t: string) => t.trim()) : (p.technologies || []),
      })),
      education: (profile.education || []).map((e: any) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        startDate: e.start_date,
        endDate: e.end_date,
      })),
      certifications: (profile.certifications || []).map((c: any) => c.name),
    };
  }
}



