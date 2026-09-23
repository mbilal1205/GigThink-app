export interface NormalizedOpportunity {
  source: string;
  source_id: string;
  title: string;
  company: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  budget_currency: string;
  location: string;
  country: string;
  is_remote: boolean;
  job_type: string;
  posted_at: string;
  source_url: string;
  skills: string[];
}