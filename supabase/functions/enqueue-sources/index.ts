/// <reference lib="deno.ns" />
import { createClient } from "npm:@supabase/supabase-js@2";

const SOURCES = [
  "adzuna",
  "remotive",
  "remoteok",
  "wellfound",
  "weworkremotely",
];

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader.replace("Bearer ", "").trim() !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const now = new Date().toISOString();
  const inserts = SOURCES.map((source) => ({
    source_name: source,
    status: "pending",
    created_at: now,
  }));

  const { error } = await supabaseAdmin.from("ingestion_queue").insert(inserts);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, enqueued: SOURCES.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});