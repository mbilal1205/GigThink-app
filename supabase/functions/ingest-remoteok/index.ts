/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchRemoteOkJobs } from "./remoteok.ts";

Deno.serve(async (req) => {
  // 1. Secure Authorization Check
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const expectedSecret = Deno.env.get("CRON_SECRET");

  if (!expectedSecret || token !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid or missing cron secret" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Initialize Supabase Admin Client
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 3. Fetch RemoteOK jobs with safety validation
    const jobs = await fetchRemoteOkJobs();

    if (!jobs || !Array.isArray(jobs)) {
      throw new Error("Invalid response format received from RemoteOK fetcher");
    }

    let inserted = 0;
    let skipped = 0;

    // 4. Process and insert jobs safely
    for (const job of jobs) {
      try {
        const { data: existing, error: queryError } = await supabaseAdmin
          .from("opportunities")
          .select("id")
          .eq("source", job.source || "remoteok")
          .eq("source_id", job.source_id)
          .maybeSingle();

        if (queryError) {
          console.error(`Query error for job ID ${job.source_id}:`, queryError);
          continue;
        }

        if (existing) {
          skipped++;
          continue;
        }

        const { error: insertError } = await supabaseAdmin
          .from("opportunities")
          .insert(job);

        if (insertError) {
          console.error(`Insert error for job ID ${job.source_id}:`, insertError);
          continue;
        }

        inserted++;
      } catch (jobErr) {
        console.error(`Error processing individual RemoteOK job:`, jobErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      fetched: jobs.length,
      inserted,
      skipped,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("RemoteOK cron critical error:", errorMessage);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});