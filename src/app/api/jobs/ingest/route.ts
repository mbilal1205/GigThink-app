import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { GreenhouseAdapter } from '@/lib/sources/greenhouse';
import { LeverAdapter } from '@/lib/sources/lever';
import { ingestJobs } from '@/lib/jobs/ingest';

export async function POST(req: NextRequest) {
  try {
    // Authentication: only authenticated users or cron with secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // allow
    } else {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // For now, allow any authenticated user (will be restricted to admin later)
    }

    // Fetch active sources from Supabase
    const { data: sources, error: sourceError } = await supabaseAdmin
      .from('job_sources')
      .select('*')
      .eq('status', 'active');

    if (sourceError) {
      return NextResponse.json({ error: sourceError.message }, { status: 500 });
    }

    const adapterMap: Record<string, any> = {
      greenhouse: new GreenhouseAdapter(),
      lever: new LeverAdapter(),
      // later: ashby, smartrecruiters, etc.
    };

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const errors: string[] = [];

    for (const source of sources) {
      const adapter = adapterMap[source.provider];
      if (!adapter) {
        errors.push(`No adapter for provider: ${source.provider}`);
        continue;
      }

      try {
        const jobs = await adapter.fetchJobs(source.board_token);
        const result = await ingestJobs(jobs);
        totalInserted += result.inserted;
        totalUpdated += result.updated;
        totalSkipped += result.skipped;
        errors.push(...result.errors);

        // Update source last_success_at, clear error
        await supabaseAdmin
          .from('job_sources')
          .update({
            last_checked_at: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.id);
      } catch (err: any) {
        errors.push(`Source ${source.id} failed: ${err.message}`);
        await supabaseAdmin
          .from('job_sources')
          .update({
            last_checked_at: new Date().toISOString(),
            last_error: err.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.id);
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        inserted: totalInserted,
        updated: totalUpdated,
        skipped: totalSkipped,
        sources_processed: sources.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[JOBS_INGEST]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}