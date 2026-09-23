// supabase/functions/ingest-jobs/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';
import { fetchGreenhouseJobs } from './sources/greenhouse.ts';
import { fetchLeverJobs } from './sources/lever.ts';
import { NormalizedJob } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

Deno.serve(async (req) => {
  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch active sources
    const { data: sources, error: sourceError } = await supabase
      .from('job_sources')
      .select('id, provider, board_token, company_name')
      .eq('status', 'active');

    if (sourceError) {
      return new Response(JSON.stringify({ error: sourceError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let totalProcessed = 0;
    let errors: string[] = [];

    for (const source of sources || []) {
      try {
        let jobs: NormalizedJob[] = [];
        if (source.provider === 'greenhouse') {
          jobs = await fetchGreenhouseJobs(source.board_token);
        } else if (source.provider === 'lever') {
          jobs = await fetchLeverJobs(source.board_token);
        } else {
          errors.push(`Unsupported provider: ${source.provider}`);
          continue;
        }

        if (jobs.length > 0) {
          // Format jobs for batch upsert
          const payload = jobs.map((job) => ({
            source_id: job.source_id,
            source: job.source,
            source_job_key: job.source_job_key,
            company: job.company,
            company_logo_url: job.company_logo_url,
            title: job.title,
            department: job.department,
            location: job.location,
            remote_type: job.remote_type,
            employment_type: job.employment_type,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            currency: job.currency,
            description: job.description,
            requirements: job.requirements,
            nice_to_have: job.nice_to_have,
            skills: job.skills,
            experience_years: job.experience_years,
            education: job.education,
            visa_sponsorship: job.visa_sponsorship,
            posted_at: job.posted_at,
            updated_at_source: job.updated_at_source,
            apply_url: job.apply_url,
            source_url: job.source_url,
            extra_data: job.extra_data,
            is_active: true,
            last_checked_at: new Date().toISOString(),
          }));

          // BATCH UPSERT: Saari jobs ek hi query mein bhej rahe hain (Chunks of 100 if needed, but bulk works great)
          const { error: upsertError } = await supabase
            .from('jobs')
            .upsert(payload, { onConflict: 'source_job_key' });

          if (upsertError) {
            errors.push(`Batch upsert failed for source ${source.company_name}: ${upsertError.message}`);
          } else {
            totalProcessed += jobs.length;
          }
        }

        // Update source last_success
        await supabase
          .from('job_sources')
          .update({ last_success_at: new Date().toISOString(), last_error: null })
          .eq('id', source.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Source ${source.id} (${source.company_name}) failed: ${msg}`);
        await supabase
          .from('job_sources')
          .update({ last_error: msg, last_checked_at: new Date().toISOString() })
          .eq('id', source.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});