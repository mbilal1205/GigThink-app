import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { generateAIResponse } from '@/lib/ai/orchestrator/orchestrator';
import { getSenderIdentity } from '@/lib/outreach/identity';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { prompt, purpose, tone, length, personalization, cta } = body;
  if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  const sender = await getSenderIdentity(user.id);

  const systemInstruction = `You are an expert email writer for ${sender.name}. 
Write a professional ${tone || 'professional'} email for a ${purpose || 'business'} context.
Length: ${length || 'medium'}.
Personalization: ${personalization || 'moderate'}.
Include a clear call-to-action: ${cta || 'reply'}.`;

  try {
    const emailContent = await generateAIResponse({
      userId: user.id,
      prompt,
      isProposal: false,
      isSectionGeneration: false,
      systemInstruction,
    });

    // Expect AI to return subject and body separated. We'll do simple split.
    const lines = emailContent.split('\n');
    let subject = lines[0]?.replace(/^Subject:\s*/i, '');
    const body = lines.slice(1).join('\n').trim();

    return NextResponse.json({
      success: true,
      subject: subject || 'Your Subject',
      body,
      sender,
    });
  } catch (err: any) {
    console.error('Email generation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}