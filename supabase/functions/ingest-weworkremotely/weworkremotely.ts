/// <reference lib="deno.ns" />
import Parser from "npm:rss-parser";
import type { NormalizedOpportunity } from "../adzuna-cron/adzuna.ts";

const parser = new Parser();

export async function fetchWeWorkRemotelyJobs(): Promise<NormalizedOpportunity[]> {
  const feed = await parser.parseURL(
    "https://weworkremotely.com/categories/remote-programming-jobs.rss"
  );

  return feed.items.map((item) => ({
    source: "weworkremotely",
    source_id: item.guid || item.link || "",
    title: item.title || "",
    company: extractCompany(item.title || ""),
    description: item.contentSnippet || "",
    budget_min: undefined,
    budget_max: undefined,
    budget_currency: "USD",
    location: "Remote",
    country: "WW",
    is_remote: true,
    job_type: "full-time",
    posted_at: item.pubDate || new Date().toISOString(),
    source_url: item.link || "",
    skills: [],
  }));
}

function extractCompany(title: string): string {
  const parts = title.split(" at ");
  return parts.length > 1 ? parts[1].trim() : "Unknown";
}