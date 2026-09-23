// supabase/functions/ingest-jobs/types.ts
export interface NormalizedJob {
  source: string;
  source_id: string;
  source_job_key: string;
  company: string;
  company_logo_url?: string;
  title: string;
  department?: string;
  location?: string;
  remote_type: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  description?: string;
  requirements?: string[];
  nice_to_have?: string[];
  skills?: string[];
  experience_years?: number;
  education?: string[];
  visa_sponsorship?: string;
  posted_at?: string;
  updated_at_source?: string;
  apply_url: string;
  source_url?: string;
  extra_data?: Record<string, unknown>;
}