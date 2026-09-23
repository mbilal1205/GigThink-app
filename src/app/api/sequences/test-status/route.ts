import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const testId = url.searchParams.get('testId');
  if (!testId) return NextResponse.json({ error: 'testId required' }, { status: 400 });

  const { data: testLog, error } = await supabaseAdmin
    .from('email_test_logs')
    .select('*')
    .eq('id', testId)
    .eq('user_id', user.id)
    .single();

  if (error || !testLog) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

  return NextResponse.json({ test: testLog });
}