import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch logs for assignments belonging to the current user
    const { data: logs, error } = await supabaseAdmin
      .from('follow_up_logs')
      .select('*, follow_up_assignments!inner(user_id)')
      .eq('follow_up_assignments.user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Logs fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error('Logs route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}