import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const candidateProfileSchema = z.object({
  full_name: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  additional_skills: z.array(z.string()).optional(),
  experience_level: z.enum(['junior', 'mid', 'senior', 'lead', 'executive']).optional(),
  work_experience: z.array(z.any()).optional(),
  education: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  certifications: z.array(z.any()).optional(),
  preferred_roles: z.array(z.string()).optional(),
  preferred_industries: z.array(z.string()).optional(),
  desired_salary_min: z.number().nullable().optional(),
  desired_salary_max: z.number().nullable().optional(),
  currency: z.string().optional(),
  preferred_locations: z.array(z.string()).optional(),
  remote_preference: z.enum(['remote', 'hybrid', 'onsite', 'any']).optional(),
  work_authorization: z.any().optional(),
  visa_sponsorship_required: z.boolean().optional(),
  company_preferences: z.record(z.string(), z.any()).optional(),
  excluded_companies: z.array(z.string()).optional(),
  career_goals: z.string().optional(),
  onboarding_completed: z.boolean().optional(),
});

// GET profile
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data || null });
  } catch (err: any) {
    console.error('[CANDIDATE_PROFILE_GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Create or update profile (upsert)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = candidateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const payload = {
      ...parsed.data,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('candidate_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err: any) {
    console.error('[CANDIDATE_PROFILE_POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}