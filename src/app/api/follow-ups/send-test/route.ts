import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendUserEmail } from '@/utils/sendUserEmail';
import { generateAIResponse } from '@/lib/ai/orchestrator/orchestrator';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { sequence_id, to_email, step_index = 0 } = body;
  if (!sequence_id || !to_email) {
    return NextResponse.json({ error: 'sequence_id and to_email required' }, { status: 400 });
  }

  try {
    // Fetch sequence
    const { data: sequence, error: seqError } = await supabaseAdmin
      .from('follow_up_sequences')
      .select('*')
      .eq('id', sequence_id)
      .eq('user_id', user.id)
      .single();
    if (seqError || !sequence) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });

    const steps = sequence.steps || [];
    if (!Array.isArray(steps) || step_index >= steps.length) {
      return NextResponse.json({ error: 'Invalid step index' }, { status: 400 });
    }
    const step = steps[step_index];

    // Fetch agency profile for placeholders
    let agency = { name: 'Our Agency', brandTone: 'Professional and Direct', coreSkills: [] as string[] };
    const { data: agencyRow } = await supabaseAdmin
      .from('agency_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (agencyRow) {
      agency = {
        name: agencyRow.agency_name || agency.name,
        brandTone: agencyRow.brand_tone || agency.brandTone,
        coreSkills: agencyRow.core_skills || [],
      };
    }

    // --- Safe extraction ---
    const rawSubject = typeof step.subject === 'string' ? step.subject : '';
    const rawBody = typeof step.body_template === 'string' ? step.body_template : (typeof step.body === 'string' ? step.body : '');

    // Replace placeholders with fallback
    const replacePlaceholders = (text: string) => {
      return text
        .replace(/\{\{agency_name\}\}/g, agency.name)
        .replace(/\{\{client_name\}\}/g, 'Test Client')
        .replace(/\{\{industry\}\}/g, 'your industry');
    };

    let subject = replacePlaceholders(rawSubject) || 'Test Email Subject';
    let bodyText = replacePlaceholders(rawBody) || 'This is a test email body.';

    // AI generation if use_ai and body empty or flag true
    if (step.use_ai) {
      try {
        const systemInstruction = `You are the follow-up email writer for ${agency.name}. Write a test follow-up email. Tone: ${agency.brandTone}.`;
        const aiResponse = await generateAIResponse({
          userId: user.id,
          prompt: `Write a follow-up email for testing. Subject: ${subject}. Objective: ${step.objective || 'follow up'}.`,
          isProposal: false,
          isSectionGeneration: false,
          systemInstruction,
        });
        const cleaned = aiResponse.replace(/<[^>]+>/g, '').trim();
        if (cleaned) bodyText = cleaned;
      } catch (aiError) {
        // fallback to template (already set)
      }
    }

    // Send via user's connected Gmail
    const emailSent = await sendUserEmail({
      userId: user.id,
      to: to_email,
      subject,
      html: bodyText.replace(/\n/g, '<br/>'),
    });

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send email. Make sure your Gmail is connected.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Test email sent via your Gmail' });
  } catch (err: any) {
    console.error('Send test error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}