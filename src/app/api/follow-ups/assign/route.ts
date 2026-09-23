import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { client_id, proposal_id, sequence_id } = body;

  if (!sequence_id) {
    return NextResponse.json({ error: 'sequence_id required' }, { status: 400 });
  }

  // Validate client_id if provided (must be UUID)
  if (client_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(client_id)) {
    return NextResponse.json({ error: 'Invalid client_id format' }, { status: 400 });
  }

  try {
    // Fetch sequence to get first step interval
    const { data: sequence, error: seqError } = await supabaseAdmin
      .from('follow_up_sequences')
      .select('steps')
      .eq('id', sequence_id)
      .eq('user_id', user.id)
      .single();
    if (seqError || !sequence) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });

    const firstStep = sequence.steps[0];
    const intervalDays = firstStep ? firstStep.interval_days : 0;
    const nextScheduled = new Date();
    nextScheduled.setDate(nextScheduled.getDate() + intervalDays);

    const { data, error } = await supabaseAdmin
      .from('follow_up_assignments')
      .insert({
        user_id: user.id,
        client_id: client_id || null,
        proposal_id: proposal_id || null,
        sequence_id,
        current_step_index: 0,
        status: 'active',
        next_scheduled_at: nextScheduled.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Assign error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ assignment: data }, { status: 201 });
  } catch (err: any) {
    console.error('Assign route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}