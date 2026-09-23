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

    const { data: applications, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        jobs:job_id (title, company, location, remote_type)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications });
  } catch (err: any) {
    console.error('[APPLICATIONS_GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}