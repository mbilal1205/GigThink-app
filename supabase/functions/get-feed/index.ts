/// <reference lib="deno.ns" />
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Strict type definitions for mapping weights safely
type ClientQuality = 'high' | 'medium' | 'low';
type CompetitionEstimate = 'low' | 'medium' | 'high';

const CLIENT_QUALITY_SCORES: Record<ClientQuality, number> = {
  high: 0.9,
  medium: 0.6,
  low: 0.3,
};

const COMPETITION_SCORES: Record<CompetitionEstimate, number> = {
  low: 0.9,
  medium: 0.6,
  high: 0.3,
};

// Scoring logic with type safety
function scoreOpportunity(opp: any, user: any): number {
  const userSkills = user.skills || [];
  const reqSkills = opp.skills || [];
  
  const sMatch = reqSkills.length > 0
    ? reqSkills.filter((s: string) => userSkills.some((us: string) => us.toLowerCase() === s.toLowerCase())).length / reqSkills.length
    : 0.5;

  const bFit = (opp.budget_max && user.min_budget <= opp.budget_max) ? 1 : 0.5;
  
  const lFit = (opp.is_remote || (user.preferred_markets || []).some((m: string) => m.toUpperCase() === (opp.country || "").toUpperCase())) ? 1 : 0.5;

  // Safe indexing with type casting
  const cqKey = (opp.client_quality as ClientQuality) || 'medium';
  const cq = CLIENT_QUALITY_SCORES[cqKey] ?? 0.5;

  const ageHrs = (Date.now() - new Date(opp.posted_at || Date.now()).getTime()) / (1000 * 60 * 60);
  const fScore = ageHrs <= 24 ? 1 : ageHrs > 168 ? 0.2 : 1 - (ageHrs - 24) / (168 - 24);

  const compKey = (opp.competition_estimate as CompetitionEstimate) || 'medium';
  const comp = COMPETITION_SCORES[compKey] ?? 0.5;

  const raw = sMatch * 0.35 + bFit * 0.25 + lFit * 0.15 + cq * 0.1 + fScore * 0.1 + comp * 0.05;
  return Math.round(raw * 100);
}

function generateWhyThis(opp: any, user: any): string[] {
  const reasons: string[] = [];
  const userSkills = user.skills || [];
  const reqSkills = opp.skills || [];

  const sMatch = reqSkills.filter((s: string) => userSkills.some((us: string) => us.toLowerCase() === s.toLowerCase())).length;
  
  if (sMatch > 0) reasons.push(`Skills match (${sMatch}/${reqSkills.length})`);
  if ((user.min_budget || 0) <= (opp.budget_max || 0)) reasons.push(`Budget fits your target`);
  if (opp.is_remote || (user.preferred_markets || []).includes(opp.country)) reasons.push(`Location matches`);
  if (opp.client_quality === 'high') reasons.push(`High-quality client`);
  if (opp.competition_estimate === 'low') reasons.push(`Low competition`);
  
  return reasons;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized: Missing token" }), { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("skills, min_budget, preferred_markets, opportunity_types")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: "Profile not found" }), { 
      status: 404, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: opps, error: oppError } = await adminClient
    .from("opportunities")
    .select("*")
    .eq("enriched", true)
    .order("posted_at", { ascending: false })
    .limit(200);

  if (oppError) {
    return new Response(JSON.stringify({ error: oppError.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const scored = (opps || [])
    .map((opp: any) => ({
      ...opp,
      score: scoreOpportunity(opp, profile),
      why_this: generateWhyThis(opp, profile),
    }))
    .filter((o: any) => o.score >= 60)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 20);

  return new Response(JSON.stringify({ opportunities: scored, total: scored.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});