import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

/**
 * GET /api/Clients/[id] - Fetch single client by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !client) {
      console.error('[CLIENT_GET_ERROR]:', error?.message);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, client }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[CLIENT_GET_ERROR]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/Clients/[id] - Update client by ID
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Don't allow changing user_id
    delete body.user_id;
    delete body.id;
    delete body.created_at;

    const updatePayload = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[CLIENT_PUT_ERROR]:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Client updated successfully',
      client: updatedClient 
    }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[CLIENT_PUT_ERROR]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/Clients/[id] - Delete client by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if client exists first
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[CLIENT_DELETE_ERROR]:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Client deleted successfully' 
    }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('[CLIENT_DELETE_ERROR]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}