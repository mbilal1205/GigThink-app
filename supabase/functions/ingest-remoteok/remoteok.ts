/// <reference lib="deno.ns" />
import axios from "npm:axios@1.7.9";
import type { NormalizedOpportunity } from "../adzuna-cron/adzuna.ts";

function parseJobDate(dateInput: unknown): string {
  if (!dateInput) return new Date().toISOString();
  let date: Date;
  if (typeof dateInput === "number") {
    date = new Date(dateInput > 1e12 ? dateInput : dateInput * 1000);
  } else if (typeof dateInput === "string") {
    const numericValue = Number(dateInput);
    if (!isNaN(numericValue)) {
      date = new Date(numericValue > 1e12 ? numericValue : numericValue * 1000);
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = new Date(String(dateInput));
  }
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export async function fetchRemoteOkJobs(): Promise<NormalizedOpportunity[]> {
  const res = await axios.get("https://remoteok.com/api", {
    headers: { "User-Agent": "GigThink/1.0" },
  });

  const rawData = res.data;
  if (!rawData || !Array.isArray(rawData) || rawData.length <= 1) {
    return [];
  }

  const jobs: any[] = rawData.slice(1);

  return jobs.map((job) => ({
    source: "remoteok",
    source_id: job.id?.toString() || String(job.url || Math.random()),
    title: job.position || "Untitled Position",
    company: job.company || "Unknown",
    description: job.description || "",
    budget_min: undefined,
    budget_max: undefined,
    budget_currency: "USD",
    location: job.location || "Remote",
    country: "WW",
    is_remote: (job.location || "").toLowerCase().includes("remote") || true,
    job_type: "full-time",
    posted_at: parseJobDate(job.date),
    source_url: job.url || "",
    skills: Array.isArray(job.tags) ? job.tags : [],
  }));
}