import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NormalizedJob } from '../sources/types';

interface IngestResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function ingestJobs(jobs: NormalizedJob[]): Promise<IngestResult> {
  const result: IngestResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const job of jobs) {
    try {
      // Check if job already exists by source_job_key
      const { data: existing, error: fetchError } = await supabaseAdmin
        .from('jobs')
        .select('id, version')
        .eq('source_job_key', job.source_job_key)
        .maybeSingle();

      if (fetchError) {
        result.errors.push(`Error checking ${job.source_job_key}: ${fetchError.message}`);
        result.skipped++;
        continue;
      }

      if (existing) {
        // Job exists, check if significant change (title, description, salary, location)
        const { data: currentJob, error: currentError } = await supabaseAdmin
          .from('jobs')
          .select('title, description, salary_min, salary_max, location, remote_type, posted_at')
          .eq('id', existing.id)
          .single();

        if (currentError) {
          result.errors.push(`Error fetching current job ${job.source_job_key}: ${currentError.message}`);
          result.skipped++;
          continue;
        }

        const changed =
          currentJob.title !== job.title ||
          currentJob.description !== job.description ||
          currentJob.salary_min !== job.salary_min ||
          currentJob.salary_max !== job.salary_max ||
          currentJob.location !== job.location ||
          currentJob.remote_type !== job.remote_type;

        if (changed) {
          // Update job
          const { error: updateError } = await supabaseAdmin
            .from('jobs')
            .update({
              title: job.title,
              description: job.description,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              location: job.location,
              remote_type: job.remote_type,
              posted_at: job.posted_at,
              updated_at_source: job.updated_at_source,
              apply_url: job.apply_url,
              source_url: job.source_url,
              extra_data: job.extra_data,
              is_active: true,
              last_checked_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            result.errors.push(`Update failed for ${job.source_job_key}: ${updateError.message}`);
            result.skipped++;
            continue;
          }

          // Insert new version
          const newVersion = (currentJob as any).version + 1; // we need to get version; better to have a separate column or use job_versions max+1
          // For simplicity, we'll query job_versions max version.
          const { data: maxVersionData, error: versionError } = await supabaseAdmin
            .from('job_versions')
            .select('version')
            .eq('job_id', existing.id)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();

          const nextVersion = maxVersionData ? maxVersionData.version + 1 : 2;
          await supabaseAdmin.from('job_versions').insert({
            job_id: existing.id,
            version: nextVersion,
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            location: job.location,
            remote_type: job.remote_type,
            posted_at: job.posted_at,
            change_summary: 'Updated from source',
          });

          result.updated++;
        } else {
          // No change, just update last_checked_at and is_active
          await supabaseAdmin
            .from('jobs')
            .update({
              last_checked_at: new Date().toISOString(),
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          result.skipped++;
        }
      } else {
        // Insert new job
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('jobs')
          .insert({
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
          })
          .select('id')
          .single();

        if (insertError) {
          result.errors.push(`Insert failed for ${job.source_job_key}: ${insertError.message}`);
          result.skipped++;
          continue;
        }

        // Insert initial version
        await supabaseAdmin.from('job_versions').insert({
          job_id: inserted.id,
          version: 1,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          location: job.location,
          remote_type: job.remote_type,
          posted_at: job.posted_at,
          change_summary: 'Initial',
        });

        result.inserted++;
      }
    } catch (error: any) {
      result.errors.push(`Exception for ${job.source_job_key}: ${error.message}`);
      result.skipped++;
    }
  }

  return result;
}