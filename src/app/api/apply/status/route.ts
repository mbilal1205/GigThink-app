import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');
    if (!jobId) {
      return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
    }

    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .select('id, status, created_at, updated_at, resume_id, cover_letter_id')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) {
      console.error('[APPLY_STATUS_ERROR]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: application || null });
  } catch (err: any) {
    console.error('[APPLY_STATUS]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}