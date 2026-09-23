import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Pagination: page-based (simpler, no duplicate keys)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT)), MAX_LIMIT);
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search") || "";
    const niche = searchParams.get("niche") || "";
    const location = searchParams.get("location") || "";
    const source = searchParams.get("source") || "";
    const leadTemperature = searchParams.get("temperature") || "";
    const minRating = parseFloat(searchParams.get("min_rating") || "0");
    const minBudget = parseFloat(searchParams.get("min_budget") || "0");
    const maxBudget = parseFloat(searchParams.get("max_budget") || "0");

    // Sorting
    const sort = searchParams.get("sort") || "newest";

    // Build query
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) query = query.ilike("business_name", `%${search}%`);
    if (niche) query = query.eq("niche", niche);
    if (location) query = query.eq("location", location);
    if (source) query = query.eq("source", source);
    if (leadTemperature) query = query.eq("lead_temperature", leadTemperature);
    if (minRating > 0) query = query.gte("rating", minRating);
    if (minBudget > 0) query = query.gte("budget_min", minBudget);
    if (maxBudget > 0) query = query.lte("budget_max", maxBudget);

    // Sorting with id tiebreaker for stable order
    switch (sort) {
      case "budget_high":
        query = query.order("budget_max", { ascending: false, nullsFirst: false }).order("id", { ascending: false });
        break;
      case "rating_high":
        query = query.order("rating", { ascending: false, nullsFirst: false }).order("id", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true }).order("id", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false }).order("id", { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error: leadsError, count } = await query;

    if (leadsError) {
      console.error("[LEADS_FEED_ERROR]", leadsError);
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    // Fetch user's saved lead IDs
    const leadIds = (leads || []).map((lead) => lead.id);
    let savedLeadIds: Set<string> = new Set();

    if (leadIds.length > 0) {
      const { data: savedLeads, error: savedError } = await supabase
        .from("saved_leads")
        .select("lead_id")
        .eq("user_id", user.id)
        .in("lead_id", leadIds);

      if (savedError) {
        console.error("[SAVED_LEADS_FETCH_ERROR]", savedError);
      } else if (savedLeads) {
        savedLeads.forEach((row) => {
          if (row.lead_id) savedLeadIds.add(row.lead_id);
        });
      }
    }

    const mappedLeads = (leads || []).map((lead) => ({
      ...lead,
      is_saved: savedLeadIds.has(lead.id),
    }));

    return NextResponse.json({
      leads: mappedLeads,
      hasMore: offset + (leads?.length || 0) < (count || 0),
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("[LEADS_FEED_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}