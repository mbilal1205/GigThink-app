/// <reference lib="deno.ns" />
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchAdzunaJobs } from "../adzuna-cron/adzuna.ts";
import { fetchRemotiveJobs } from "../ingest-remotive/remotive.ts";
import { fetchRemoteOkJobs } from "../ingest-remoteok/remoteok.ts";
import { fetchWellfoundJobs } from "../ingest-wellfound/wellfound.ts";
import { fetchWeWorkRemotelyJobs } from "../ingest-weworkremotely/weworkremotely.ts";

const adapters: Record<string, () => Promise<any[]>> = {
  adzuna: () => fetchAdzunaJobs("developer"),
  remotive: fetchRemotiveJobs,
  remoteok: fetchRemoteOkJobs,
  wellfound: fetchWellfoundJobs,
  weworkremotely: fetchWeWorkRemotelyJobs,
};

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (!expectedSecret || token !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // ایک ساتھ 5 pending tasks لیں
  const { data: tasks, error: fetchError } = await supabaseAdmin
    .from("ingestion_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  if (fetchError || !tasks || tasks.length === 0) {
    return new Response(JSON.stringify({ message: "No pending tasks" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const task of tasks) {
    await supabaseAdmin
      .from("ingestion_queue")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", task.id);

    const adapter = adapters[task.source_name];
    if (!adapter) {
      await supabaseAdmin
        .from("ingestion_queue")
        .update({
          status: "failed",
          error_message: `No adapter for ${task.source_name}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);
      results.push({ source: task.source_name, error: "Unknown source" });
      continue;
    }

    try {
      const jobs = await adapter();
      let inserted = 0;

      for (const job of jobs) {
        const { data: existing } = await supabaseAdmin
          .from("opportunities")
          .select("id")
          .eq("source", job.source)
          .eq("source_id", job.source_id)
          .maybeSingle();

        if (existing) continue;

        const { error } = await supabaseAdmin
          .from("opportunities")
          .insert(job);
        if (error) {
          console.error(`Insert error for ${job.source_id}:`, error);
          continue;
        }
        inserted++;
      }

      await supabaseAdmin
        .from("ingestion_queue")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      results.push({
        source: task.source_name,
        fetched: jobs.length,
        inserted,
      });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from("ingestion_queue")
        .update({
          status: "failed",
          error_message: msg,
          completed_at: new Date().toISOString(),
        })
        .eq("id", task.id);
      results.push({ source: task.source_name, error: msg });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});