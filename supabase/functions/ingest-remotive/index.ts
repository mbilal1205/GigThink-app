/// <reference lib="deno.ns" />
import { createClient } from "npm:@supabase/supabase-js@2";
import { fetchRemotiveJobs } from "./remotive.ts";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  const expectedSecret = Deno.env.get("CRON_SECRET");

  if (!expectedSecret || token !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const jobs = await fetchRemotiveJobs();
    let inserted = 0;

    for (const job of jobs) {
      const { data: existing } = await supabaseAdmin
        .from("opportunities")
        .select("id")
        .eq("source", job.source)
        .eq("source_id", job.source_id)
        .maybeSingle();

      if (existing) continue;

      const { error } = await supabaseAdmin.from("opportunities").insert(job);
      if (error) {
        console.error("Insert error:", error);
        continue;
      }
      inserted++;
    }

    return new Response(JSON.stringify({ success: true, fetched: jobs.length, inserted }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Remotive cron error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});