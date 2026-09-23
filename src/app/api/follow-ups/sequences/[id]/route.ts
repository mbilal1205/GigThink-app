import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ðŸ”¥ Fix: await params
  const { id } = await params;

  const body = await request.json();
  const { name, steps, trigger_type } = body;
  const updateData: any = {};
  if (name) updateData.name = name;
  if (steps) updateData.steps = steps;
  if (trigger_type) updateData.trigger_type = trigger_type;
  updateData.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabaseAdmin
      .from('follow_up_sequences')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Sequence update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sequence: data });
  } catch (err: any) {
    console.error('Sequence PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ðŸ”¥ Fix: await params
  const { id } = await params;

  try {
    const { error } = await supabaseAdmin
      .from('follow_up_sequences')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Sequence delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Sequence DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}