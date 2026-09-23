import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSenderIdentity } from '@/lib/outreach/identity';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { sequence_id, recipient_email, delay_minutes } = body;
  if (!sequence_id || !recipient_email || delay_minutes === undefined) {
    return NextResponse.json({ error: 'sequence_id, recipient_email, delay_minutes required' }, { status: 400 });
  }

  // Fetch sequence to verify ownership
  const { data: sequence, error: seqError } = await supabaseAdmin
    .from('follow_up_sequences')
    .select('*')
    .eq('id', sequence_id)
    .eq('user_id', user.id)
    .single();
  if (seqError || !sequence) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });

  const sender = await getSenderIdentity(user.id);
  const scheduledAt = new Date(Date.now() + delay_minutes * 60000).toISOString();

  const { data: testLog, error: insertError } = await supabaseAdmin
    .from('email_test_logs')
    .insert({
      user_id: user.id,
      sequence_id,
      recipient_email,
      status: 'scheduled',
      scheduled_at: scheduledAt,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ success: true, test: testLog, sender });
}