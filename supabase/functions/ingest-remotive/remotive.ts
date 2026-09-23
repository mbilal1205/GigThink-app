/// <reference lib="deno.ns" />
import axios from "npm:axios@1.7.9";
import type { NormalizedOpportunity } from "../adzuna-cron/adzuna.ts";

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  description: string;
  salary?: string;
  candidate_required_location: string;
  job_type: string;
  category: string;
  url: string;
  publication_date: string;
}

export async function fetchRemotiveJobs(): Promise<NormalizedOpportunity[]> {
  const res = await axios.get("https://remotive.com/api/remote-jobs?limit=100");
  const jobs: RemotiveJob[] = res.data.jobs;

  return jobs.map((job) => ({
    source: "remotive",
    source_id: job.id.toString(),
    title: job.title,
    company: job.company_name,
    description: job.description,
    budget_min: undefined,
    budget_max: undefined,
    budget_currency: "USD",
    location: job.candidate_required_location || "Remote",
    country: extractCountry(job.candidate_required_location),
    is_remote: true,
    job_type: mapRemotiveType(job.job_type),
    posted_at: job.publication_date,
    source_url: job.url,
    skills: [],
  }));
}

function extractCountry(location: string): string {
  if (location.includes("US")) return "US";
  if (location.includes("UK")) return "UK";
  return "WW";
}

function mapRemotiveType(type: string): string {
  if (type === "full_time") return "full-time";
  if (type === "contract") return "contract";
  return type;
}