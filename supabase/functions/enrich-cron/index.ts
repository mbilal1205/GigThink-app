/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from "npm:@supabase/supabase-js@2";
import { enrichJobDescription } from "./enrichOpportunity.ts";

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
    // 3. Fetch unenriched jobs with descriptions (limit 10)
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from("opportunities")
      .select("id, description, posted_at")
      .eq("enriched", false)
      .not("description", "is", null)
      .limit(10);

    if (fetchError) throw fetchError;

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ message: "No jobs to enrich" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let enriched = 0;

    for (const job of jobs) {
      try {
        const result = await enrichJobDescription(job.description || "");

        // ---- naya: base_score calculate karo ----
        const clientQualityScore = 
          result.client_quality === 'high' ? 0.9 :
          result.client_quality === 'medium' ? 0.6 :
          result.client_quality === 'low' ? 0.3 : 0.5;

        const competitionScore = 
          result.competition_estimate === 'low' ? 0.8 :
          result.competition_estimate === 'medium' ? 0.5 :
          result.competition_estimate === 'high' ? 0.2 : 0.4;

        // Freshness based on original posted_at (agar job purani ho to base kam)
        const ageHours = (Date.now() - new Date(job.posted_at).getTime()) / (1000*60*60);
        const freshness = ageHours <= 24 ? 1 : ageHours <= 168 ? 0.7 : 0.3;

        // base_score weighted formula
        const baseScore = (clientQualityScore * 0.3) + (competitionScore * 0.3) + (freshness * 0.4);
        // -----------------------------------------

        const { error: updateError } = await supabaseAdmin
          .from("opportunities")
          .update({
            skills: result.skills,
            budget_min: result.budget_min,
            budget_max: result.budget_max,
            client_quality: result.client_quality,
            pain_points: result.pain_points,
            industry: result.industry,
            competition_estimate: result.competition_estimate,
            base_score: Math.round(baseScore * 100) / 100,   // naya column
            enriched: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        if (updateError) {
          console.error(`Update error for job ID ${job.id}:`, updateError);
          continue;
        }

        enriched++;
      } catch (aiError) {
        const errorMessage = aiError instanceof Error ? aiError.message : String(aiError);
        console.error(`AI enrichment failed for job ID ${job.id}:`, errorMessage);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: jobs.length,
      enriched,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Enrich cron critical error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});