import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { processFollowUpAssignment } from '@/lib/follow-ups/helpers';
import { sendMail } from '@/utils/sendEmail';
import { getSenderIdentity } from '@/lib/outreach/identity';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.replace('Bearer ', '').trim() !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date().toISOString();

  // 1. Process due real assignments
  const { data: dueAssignments, error: assignError } = await supabaseAdmin
    .from('follow_up_assignments')
    .select('id')
    .eq('status', 'active')
    .eq('is_test', false)
    .lte('next_scheduled_at', now)
    .limit(20);

  if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 });

  let processedReal = 0;
  for (const assign of dueAssignments || []) {
    try {
      await processFollowUpAssignment(assign.id);
      processedReal++;
    } catch (err) {
      console.error(`Failed real assignment ${assign.id}:`, err);
    }
  }

  // 2. Process due test runs
  const { data: dueTests, error: testError } = await supabaseAdmin
    .from('email_test_logs')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(10);

  if (testError) return NextResponse.json({ error: testError.message }, { status: 500 });

  let processedTests = 0;
  for (const test of dueTests || []) {
    try {
      // Mark as sending
      await supabaseAdmin
        .from('email_test_logs')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', test.id);

      // Fetch sequence
      const { data: sequence, error: seqError } = await supabaseAdmin
        .from('follow_up_sequences')
        .select('*')
        .eq('id', test.sequence_id)
        .single();
      if (seqError || !sequence) {
        await supabaseAdmin.from('email_test_logs')
          .update({ status: 'failed', error_message: 'Sequence not found' })
          .eq('id', test.id);
        continue;
      }

      const sender = await getSenderIdentity(test.user_id);
      const firstStep = sequence.steps[0];
      const subject = firstStep?.subject || 'Test Email';
      const body = (firstStep?.body_template || 'This is a test email.').replace(/\n/g, '<br/>');

    const emailSent = await sendMail(test.recipient_email, subject, body);


      if (emailSent) {
        await supabaseAdmin
          .from('email_test_logs')
          .update({ status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', test.id);
      } else {
        await supabaseAdmin
          .from('email_test_logs')
          .update({ status: 'failed', error_message: 'SMTP error', updated_at: new Date().toISOString() })
          .eq('id', test.id);
      }
      processedTests++;
    } catch (err) {
      console.error(`Failed test ${test.id}:`, err);
      await supabaseAdmin
        .from('email_test_logs')
        .update({ status: 'failed', error_message: 'Internal error' })
        .eq('id', test.id);
    }
  }

  return NextResponse.json({
    success: true,
    processedReal,
    processedTests,
  });
}