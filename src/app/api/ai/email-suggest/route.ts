import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { generateAIResponse } from '@/lib/ai/orchestrator/orchestrator';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { emailSubject, emailBody } = body;
  if (!emailSubject || !emailBody) return NextResponse.json({ error: 'Email content required' }, { status: 400 });

  const prompt = `Analyze the following email and provide 5-7 actionable suggestions to improve it. Focus on:
- Subject line improvement
- Making it more professional
- Shortening if needed
- Better call-to-action
- Personalization
- Grammar improvements
- Wording for higher response rate
- Follow-up idea

Return JSON array of suggestions with fields: "title", "description", "suggestedChange" (optional).

Email Subject: ${emailSubject}
Email Body: ${emailBody}`;

  try {
    const raw = await generateAIResponse({
      userId: user.id,
      prompt,
      isProposal: false,
      isSectionGeneration: false,
      systemInstruction: 'You are an expert email consultant. Provide concise, actionable suggestions.',
    });

    // Extract JSON array from response (handle markdown fences)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No suggestions found');
    const suggestions = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, suggestions });
  } catch (err: any) {
    console.error('Suggestion error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}