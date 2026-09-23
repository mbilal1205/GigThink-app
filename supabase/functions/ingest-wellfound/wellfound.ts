/// <reference lib="deno.ns" />
import axios from "npm:axios@1.7.9";
import type { NormalizedOpportunity } from "../adzuna-cron/adzuna.ts";

export async function fetchWellfoundJobs(): Promise<NormalizedOpportunity[]> {
  try {
    const res = await axios.get("https://wellfound.com/api/jobs", {
      params: { page: 1, per_page: 50 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    const jobs: any[] = res.data?.jobs || [];

    return jobs.map((job) => ({
      source: "wellfound",
      source_id: job.id?.toString() || Math.random().toString(),
      title: job.title || "Untitled Position",
      company: job.startup?.name || "Unknown",
      description: job.description || "",
      budget_min: job.salary_min || undefined,
      budget_max: job.salary_max || undefined,
      budget_currency: "USD",
      location: job.location || "Remote",
      country: "US",
      is_remote: job.remote || false,
      job_type: "full-time",
      posted_at: job.published_at
        ? new Date(job.published_at).toISOString()
        : new Date().toISOString(),
      source_url: job.url || "",
      skills: Array.isArray(job.tags)
        ? job.tags.map((t: any) => t.name || String(t))
        : [],
    }));
  } catch (err: any) {
    if (err.response?.status === 404) {
      console.warn("Wellfound endpoint 404. Skipping.");
      return [];
    }
    console.error("Wellfound error:", err.message || err);
    return [];
  }
}