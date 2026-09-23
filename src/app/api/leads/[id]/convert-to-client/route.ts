import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: leadId } = await params;

  try {
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.client_id) {
      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id, client_name, company_name')
        .eq('id', lead.client_id)
        .single();

      return NextResponse.json({
        success: true,
        message: 'Lead already linked to a client',
        client: existingClient,
      });
    }

    const clientData = {
      user_id: user.id,
      client_name: lead.contact_name || lead.client_name || lead.business_name || 'Unknown Client',
      company_name: lead.company_name || lead.business_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      industry: lead.industry || lead.niche || 'Other',
      project_title: lead.project_title || lead.project_summary || 'Untitled Project',
      budget: lead.budget || 0,
      deadline: lead.deadline || null,
    };

    const { data: newClient, error: createError } = await supabaseAdmin
      .from('clients')
      .insert(clientData)
      .select('id, client_name, company_name')
      .single();

    if (createError) {
      console.error('Client creation error:', createError);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({ client_id: newClient.id, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to link client to lead' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lead converted to client successfully',
      client: newClient,
    });
  } catch (err: any) {
    console.error('Convert lead error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}