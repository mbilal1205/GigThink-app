import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateTailoredResume } from '@/lib/ai/resume-tailor';
import { generateCoverLetter } from '@/lib/ai/cover-letter';
import { z } from 'zod';

const prepareSchema = z.object({
  job_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = prepareSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const jobId = parsed.data.job_id;

    // Fetch candidate profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Candidate profile not found. Complete onboarding first.' }, { status: 404 });
    }

    // Fetch job
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Generate tailored resume & cover letter concurrently (preventing redundant AI calls)
    const [structuredResume, coverLetterText] = await Promise.all([
      generateTailoredResume(user.id, profileData, jobData),
      generateCoverLetter(user.id, profileData, jobData),
    ]);

    // Save resume with structured_content column support
    const { data: resumeRow, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .insert({
        user_id: user.id,
        job_id: jobId,
        title: `${jobData.company} - ${jobData.title} Resume`,
        content: JSON.stringify(structuredResume),
        structured_content: structuredResume,
        is_master: false,
      })
      .select('id')
      .single();

    if (resumeError) {
      console.error('[RESUME_SAVE_ERROR]', resumeError);
      return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 });
    }

    // Save cover letter (upsert)
    const { data: coverLetterRow, error: coverLetterError } = await supabaseAdmin
      .from('cover_letters')
      .upsert(
        {
          user_id: user.id,
          job_id: jobId,
          content: coverLetterText,
        },
        { onConflict: 'user_id,job_id' }
      )
      .select('id')
      .single();

    if (coverLetterError) {
      console.error('[COVER_LETTER_SAVE_ERROR]', coverLetterError);
      return NextResponse.json({ error: 'Failed to save cover letter' }, { status: 500 });
    }

    // Create/update application record
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .upsert(
        {
          user_id: user.id,
          job_id: jobId,
          status: 'ready',
          resume_id: resumeRow.id,
          cover_letter_id: coverLetterRow.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,job_id' }
      )
      .select()
      .single();

    if (appError) {
      console.error('[APPLICATION_UPSERT_ERROR]', appError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      application,
      resume: resumeRow,
      cover_letter: coverLetterRow,
    });
  } catch (err: any) {
    console.error('[PREPARE_APPLICATION]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}