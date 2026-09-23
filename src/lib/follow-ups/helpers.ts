import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendUserEmail } from '@/utils/sendUserEmail'
import { generateAIResponse } from '@/lib/ai/orchestrator/orchestrator';

interface FollowUpStep {
  interval_days: number;
  subject: string;
  body_template: string;
  tone?: string;
  use_ai?: boolean; // NEW: if true, AI will generate content
  objective?: string; // optional: what the step should achieve
}

export async function getSequenceById(sequenceId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('follow_up_sequences')
    .select('*')
    .eq('id', sequenceId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function createDefaultSequences(userId: string) {
  const defaultSequences = [
    {
      user_id: userId,
      name: 'Proposal Follow-up',
      trigger_type: 'proposal_sent',
      steps: [
        {
          interval_days: 0,
          subject: 'Thank you for your time',
          body_template: 'Hi {{client_name}},\n\nThank you for giving us the opportunity to present our proposal. We are confident we can deliver great results.\n\nBest regards,\n{{agency_name}}',
          use_ai: true,
          objective: 'Express gratitude and reinforce confidence in our solution.',
        },
        {
          interval_days: 3,
          subject: 'Quick follow-up',
          body_template: 'Hi {{client_name}},\n\nI wanted to follow up on the proposal we sent. Do you have any questions or feedback?\n\nBest,\n{{agency_name}}',
          use_ai: true,
          objective: 'Politely ask for feedback and open the door for questions.',
        },
        {
          interval_days: 7,
          subject: 'Next steps?',
          body_template: 'Hi {{client_name}},\n\nJust checking if you had a chance to review our proposal. I would be happy to schedule a quick call to discuss further.\n\nThanks,\n{{agency_name}}',
          use_ai: true,
          objective: 'Encourage scheduling a call or meeting to move forward.',
        },
      ],
      is_default: true,
    },
    {
      user_id: userId,
      name: 'Lead Nurturing',
      trigger_type: 'lead_saved',
      steps: [
        {
          interval_days: 1,
          subject: 'Nice to connect!',
          body_template: 'Hi {{client_name}},\n\nI came across your profile and thought we might be a good fit to help with your project. Let me know if you are open to a quick chat.\n\nBest,\n{{agency_name}}',
          use_ai: true,
          objective: 'Introduce ourselves and gauge interest.',
        },
        {
          interval_days: 4,
          subject: 'Following up',
          body_template: 'Hi {{client_name}},\n\nI wanted to touch base again regarding your project. We have experience in {{industry}} and would love to help.\n\nCheers,\n{{agency_name}}',
          use_ai: true,
          objective: 'Reiterate value proposition and ask for a meeting.',
        },
      ],
      is_default: true,
    },
  ];

  for (const seq of defaultSequences) {
    await supabaseAdmin.from('follow_up_sequences').insert(seq);
  }
}

export async function processFollowUpAssignment(assignmentId: string) {
  // Fetch assignment with joined sequence
  const { data: assignment, error: assignError } = await supabaseAdmin
    .from('follow_up_assignments')
    .select('*, follow_up_sequences(*)')
    .eq('id', assignmentId)
    .single();
  if (assignError || !assignment) throw new Error('Assignment not found');

  const sequence = assignment.follow_up_sequences;
  if (!sequence || !sequence.steps || sequence.steps.length === 0) {
    await supabaseAdmin.from('follow_up_assignments').update({ status: 'completed' }).eq('id', assignmentId);
    return;
  }

  const currentStep = sequence.steps[assignment.current_step_index];
  if (!currentStep) {
    await supabaseAdmin.from('follow_up_assignments').update({ status: 'completed' }).eq('id', assignmentId);
    return;
  }

  // Fetch client info
  let clientName = 'Client';
  let clientEmail: string | null = null;
  let clientCompany = '';
  let clientIndustry = '';
  if (assignment.client_id) {
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('client_name, email, company_name, industry')
      .eq('id', assignment.client_id)
      .single();
    if (client) {
      clientName = client.client_name || 'Client';
      clientEmail = client.email;
      clientCompany = client.company_name || '';
      clientIndustry = client.industry || '';
    }
  }

  // Fetch agency profile for branding
  let agency = {
    name: 'Our Agency',
    tagline: '',
    email: '',
    website: '',
    brandTone: 'Professional and Direct',
    coreSkills: [] as string[],
  };
  const { data: agencyRow } = await supabaseAdmin
    .from('agency_profiles')
    .select('*')
    .eq('user_id', assignment.user_id)
    .maybeSingle();
  if (agencyRow) {
    agency = {
      name: agencyRow.agency_name || agency.name,
      tagline: agencyRow.tagline || '',
      email: agencyRow.contact_email || '',
      website: agencyRow.website_url || '',
      brandTone: agencyRow.brand_tone || agency.brandTone,
      coreSkills: agencyRow.core_skills || [],
    };
  }

  // Determine subject and body
  let subject = currentStep.subject
    .replace('{{client_name}}', clientName)
    .replace('{{agency_name}}', agency.name)
    .replace('{{industry}}', clientIndustry || 'your industry');

  let body = currentStep.body_template
    .replace('{{client_name}}', clientName)
    .replace('{{agency_name}}', agency.name)
    .replace('{{industry}}', clientIndustry || 'your industry');

  // AI generation if enabled
  if (currentStep.use_ai) {
    try {
      const systemInstruction = `You are the follow-up email writer for **${agency.name}**.
**Agency Details:**
- Name: ${agency.name}
- Tagline: "${agency.tagline}"
- Website: ${agency.website}
- Email: ${agency.email}
- Brand Tone: ${agency.brandTone}
- Core Skills: ${agency.coreSkills?.join(', ') || 'Custom Software Development'}

**Client Details:**
- Name: ${clientName}
- Company: ${clientCompany || 'N/A'}
- Industry: ${clientIndustry || 'Technology'}

**Your Task:**
Write a professional, personalized follow-up email for this client. The subject line is already: "${subject}".
The objective of this follow-up is: "${currentStep.objective || 'move the conversation forward'}".
Use the agency's tone and style. Make it sound human, not generic. Include a clear call-to-action.

**Output ONLY the email body, no subject, no markdown, no extra text. Write in a friendly, professional tone.**
`;

      const userPrompt = `Write a follow-up email to ${clientName} from ${agency.name}. The goal is to ${currentStep.objective || 'follow up on our previous communication'}.`;

      const aiResponse = await generateAIResponse({
        userId: assignment.user_id,
        prompt: userPrompt,
        isProposal: false,
        isSectionGeneration: false,
        systemInstruction,
      });

      // Clean AI response (remove any extra formatting)
      const cleanedBody = aiResponse.replace(/<[^>]+>/g, '').trim();
      if (cleanedBody) {
        body = cleanedBody;
      }
    } catch (aiError) {
      console.error('AI generation failed, using template fallback:', aiError);
      // Fallback to template body (already set)
    }
  }

  if (!clientEmail) {
    // No email, mark as failed
    await supabaseAdmin.from('follow_up_logs').insert({
      assignment_id: assignmentId,
      step_index: assignment.current_step_index,
      subject,
      body,
      to_email: null,
      status: 'failed',
      error_message: 'Client email not available',
    });
    await supabaseAdmin.from('follow_up_assignments').update({ status: 'cancelled' }).eq('id', assignmentId);
    return;
  }

  // Send email
 const emailSent = await sendUserEmail({
  userId: assignment.user_id,
  to: clientEmail,
  subject,
  html: body.replace(/\n/g, '<br/>'),
});

  if (emailSent) {
    await supabaseAdmin.from('follow_up_logs').insert({
      assignment_id: assignmentId,
      step_index: assignment.current_step_index,
      subject,
      body,
      to_email: clientEmail,
      status: 'sent',
    });

    // Advance to next step
    const nextIndex = assignment.current_step_index + 1;
    if (nextIndex >= sequence.steps.length) {
      // Sequence completed
      await supabaseAdmin.from('follow_up_assignments').update({
        status: 'completed',
        current_step_index: nextIndex,
        next_scheduled_at: null,
      }).eq('id', assignmentId);
    } else {
      // Schedule next step
      const nextStep = sequence.steps[nextIndex];
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextStep.interval_days);
      await supabaseAdmin.from('follow_up_assignments').update({
        current_step_index: nextIndex,
        next_scheduled_at: nextDate.toISOString(),
      }).eq('id', assignmentId);
    }
  } else {
    await supabaseAdmin.from('follow_up_logs').insert({
      assignment_id: assignmentId,
      step_index: assignment.current_step_index,
      subject,
      body,
      to_email: clientEmail,
      status: 'failed',
      error_message: 'SMTP error',
    });
  }
}