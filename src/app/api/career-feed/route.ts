import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { calculateMatchScore } from '@/lib/ai/job-matcher';
import { CandidateProfile } from '@/lib/types/candidate';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch candidate profile (No longer throwing 404 if missing)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const candidate = profile as CandidateProfile | null;

    // Parse query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const sort = url.searchParams.get('sort') || 'best_match';
    const offset = (page - 1) * limit;

    // Fetch active jobs
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('posted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobsError) {
      return NextResponse.json({ error: jobsError.message }, { status: 500 });
    }

    // Calculate match for each job
    const scoredJobs = jobs.map((job) => {
      // Agar profile hai toh proper AI score calculate karo
      if (candidate) {
        const match = calculateMatchScore(candidate, job as any);
        return {
          ...job,
          match_score: match.score,
          match_reasons: match.reasons,
          missing_skills: match.missing_skills,
          matched_skills: match.matched_skills,
          is_good_match: match.is_good_match,
        };
      } else {
        // Agar profile nahi hai toh default empty values pass karo taake UI crash na ho
        return {
          ...job,
          match_score: 0,
          match_reasons: ['Profile incomplete.'],
          missing_skills: [],
          matched_skills: [],
          is_good_match: false,
        };
      }
    });

    // Sort logic (Agar profile nahi hai toh best_match ki bajaye newest par fallback karega)
    if (sort === 'best_match' && candidate) {
      scoredJobs.sort((a, b) => b.match_score - a.match_score);
    } else if (sort === 'newest' || (sort === 'best_match' && !candidate)) {
      scoredJobs.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
    } else if (sort === 'salary_high') {
      scoredJobs.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
    }

    // Professional short warning message for the frontend
    const warningMessage = !candidate 
      ? "Please complete your profile to unlock personalized job recommendations." 
      : null;

    return NextResponse.json({
      jobs: scoredJobs,
      page,
      limit,
      hasMore: scoredJobs.length === limit,
      warning: warningMessage, // Frontend par isko check kar ke alert dikha dein
    });
  } catch (err: any) {
    console.error('[CAREER_FEED]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}