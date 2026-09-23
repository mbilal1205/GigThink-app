import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callProviderModel } from '@/lib/ai/provider-router';
import { CandidateProfile } from '@/lib/types/candidate';
import { NormalizedJob } from '@/lib/sources/types';

export async function generateCoverLetter(
  userId: string,
  profile: CandidateProfile,
  job: NormalizedJob
): Promise<string> {
  const systemPrompt = `You are an expert cover letter writer. Write a compelling, personalized cover letter for the candidate applying to this job.

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location || 'Unknown'}
- Description: ${job.description || 'Not provided'}
- Requirements: ${job.requirements?.join(', ') || 'Not provided'}
- Skills: ${job.skills?.join(', ') || 'Not provided'}

Instructions:
- Address the hiring manager respectfully.
- Explain why the candidate is a great fit.
- Highlight relevant experience and achievements.
- Express enthusiasm for the company and role.
- Keep it concise (250-350 words).
- Do not use generic phrases; be specific.
- Output only the cover letter body text.
`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: 'Write my cover letter.' },
  ];

  const result = await callProviderModel('openai/gpt-oss-20b', messages, {
    temperature: 0.4,
    maxTokens: 1200,
  });

  return result.text.trim();
}