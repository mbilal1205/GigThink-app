import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { agencyProfileSchema, updateAgencyProfileSchema } from '@/lib/validations/agencyProfile';

/**
 * 1. GET: Fetch current user's Agency Profile
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('agency_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[AGENCY_PROFILE_GET_ERROR]:', error.message);
      return NextResponse.json({ error: 'Failed to fetch agency profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      exists: !!profile, 
      profile: profile || null 
    }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 2. POST: Create a new Agency Profile
 */
export async function POST(req: Request) {
  try {
    const supabase =await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = agencyProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const payload = {
      ...validation.data,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data: newProfile, error } = await supabase
      .from('agency_profiles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[AGENCY_PROFILE_POST_ERROR]:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Agency profile created successfully', 
      profile: newProfile 
    }, { status: 201 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 3. PUT: Edit / Update / Upsert existing Agency Profile
 */
export async function PUT(req: Request) {
  try {
    const supabase =await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateAgencyProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const payload = {
      ...validation.data,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // Upsert ensures that if record exists, it updates; if not, it creates.
    const { data: updatedProfile, error } = await supabase
      .from('agency_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[AGENCY_PROFILE_PUT_ERROR]:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Agency profile updated successfully', 
      profile: updatedProfile 
    }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 4. DELETE: Remove Agency Profile
 */
export async function DELETE() {
  try {
    const supabase =await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('agency_profiles')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('[AGENCY_PROFILE_DELETE_ERROR]:', error.message);
      return NextResponse.json({ error: 'Failed to delete agency profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Agency profile deleted successfully' 
    }, { status: 200 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}