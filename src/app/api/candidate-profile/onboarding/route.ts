import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { callProviderModel } from '@/lib/ai/provider-router';
import { z } from 'zod';

const chatSchema = z.object({
  message: z.string().min(1),
  session_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Simple state management: store conversation in candidate_onboarding_sessions
    // For MVP, we'll just ask a set of predefined questions and extract answers.
    // We'll use AI to parse user message and update candidate_profiles fields.

    const userMessage = parsed.data.message;

    // Fetch existing profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Determine which question we're on based on onboarding_completed and profile fields.
    // We'll use a simple rule: ask about missing fields.
    // For brevity, we'll use AI to generate the next question and also extract data.

    const systemPrompt = `You are a career onboarding assistant for GigThink. You need to collect the following information from the user:
- full_name
- headline (professional headline)
- summary (short professional summary)
- skills (array)
- experience_level (junior, mid, senior, lead, executive)
- preferred_roles (array)
- preferred_industries (array)
- desired_salary_min and desired_salary_max (numbers)
- preferred_locations (array)
- remote_preference (remote, hybrid, onsite, any)
- career_goals

Current profile: ${JSON.stringify(profile || {})}

User message: "${userMessage}"

Analyze the message and extract any new information. Then respond in JSON format:
{
  "extracted": { ... fields you extracted ... },
  "next_question": "Your next question to fill remaining gaps",
  "is_complete": boolean (true if all important fields collected)
}
`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    const result = await callProviderModel('openai/gpt-oss-20b', messages, {
      temperature: 0.3,
      maxTokens: 800,
    });

    let aiOutput;
    try {
      const cleaned = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiOutput = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON');
      }
    } catch (err) {
      console.error('[ONBOARD_AI_PARSE]', err);
      aiOutput = { extracted: {}, next_question: 'Could you please tell me more about your skills and experience?', is_complete: false };
    }

    // Update profile with extracted fields
    if (aiOutput.extracted && Object.keys(aiOutput.extracted).length > 0) {
      const updatePayload = { ...aiOutput.extracted, updated_at: new Date().toISOString() };
      // Merge arrays if they exist
      const { error: updateError } = await supabaseAdmin
        .from('candidate_profiles')
        .upsert({ user_id: user.id, ...updatePayload }, { onConflict: 'user_id' })
        .select();
      if (updateError) {
        console.error('[ONBOARD_UPDATE]', updateError);
      }
    }

    // If complete, set onboarding_completed = true
    if (aiOutput.is_complete) {
      await supabaseAdmin
        .from('candidate_profiles')
        .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      next_question: aiOutput.next_question,
      is_complete: aiOutput.is_complete,
      extracted: aiOutput.extracted,
    });
  } catch (err: any) {
    console.error('[CANDIDATE_ONBOARDING]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}