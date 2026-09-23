/// <reference lib="deno.ns" />
import axios from "npm:axios@1.7.9";

const ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs";

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  description: string;
  salary_min?: number;
  salary_max?: number;
  location: { display_name: string; area?: string[] };
  created: string;
  redirect_url: string;
  contract_type?: string;
  category?: { label: string };
}

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

function mapContractType(contract?: string): string {
  if (!contract) return "unknown";
  if (contract.includes("permanent")) return "full-time";
  if (contract.includes("contract")) return "contract";
  if (contract.includes("part")) return "part-time";
  return contract;
}

export async function fetchAdzunaJobs(
  query: string = "developer",
  country: string = "us"
): Promise<NormalizedOpportunity[]> {
  const appId = Deno.env.get("ADZUNA_APP_ID");
  const appKey = Deno.env.get("ADZUNA_APP_KEY");

  if (!appId || !appKey) throw new Error("Adzuna credentials missing");

  let allJobs: NormalizedOpportunity[] = [];

  // Max 5 pages fetch karein, ya jab tak jobs aati rahein
  for (let page = 1; page <= 5; page++) {
    const url =
      `${ADZUNA_BASE}/${country}/search/${page}` +
      `?app_id=${appId}&app_key=${appKey}` +
      `&what=${encodeURIComponent(query)}` +
      `&content-type=application/json`;

    const response = await axios.get(url);
    const jobs: AdzunaJob[] = response.data?.results;

    if (!jobs || jobs.length === 0) break; // agay koi page nahi

    const normalized = jobs.map((job) => ({
      source: "adzuna",
      source_id: job.id,
      title: job.title,
      company: job.company?.display_name || "Unknown",
      description: job.description,
      budget_min: job.salary_min,
      budget_max: job.salary_max,
      budget_currency: "USD",
      location: job.location?.display_name || "Remote",
      country: (job.location?.area && job.location.area[1])
        ? job.location.area[1]
        : country.toUpperCase(),
      is_remote: job.location?.display_name
        ?.toLowerCase()
        .includes("remote") || false,
      job_type: mapContractType(job.contract_type),
      posted_at: job.created,
      source_url: job.redirect_url,
      skills: [],
    }));

    allJobs = allJobs.concat(normalized);
  }

  return allJobs;
}