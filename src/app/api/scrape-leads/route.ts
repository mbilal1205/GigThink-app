import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { verifyUserLimits } from "@/app/api/guards/check-limits";
import { ingestLeads } from "@/lib/leads/ingest-leads";

const CACHE_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { query, city, niche } = body;
    if (!query || !city) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const userId = user.id;

    // ðŸ”¥ Credit check & consume
    const limitStatus = await verifyUserLimits(userId, "search");
    if (!limitStatus.allowed) {
      return NextResponse.json(
        { error: limitStatus.reason, showPaywall: limitStatus.showPaywall },
        { status: 403 }
      );
    }

    const cacheKey = `${query.trim().toLowerCase()}_${city.trim().toLowerCase()}`.replace(/\s+/g, "_");

    // 1. Cache lookup
    const { data: cachedData } = await supabase
      .from("lead_caches")
      .select("results, updated_at")
      .eq("search_query", cacheKey)
      .single();

    if (cachedData && Date.now() - new Date(cachedData.updated_at).getTime() < CACHE_EXPIRY_MS) {
      // Ingest cached leads to ensure central DB up-to-date and record search event
      const enrichedCached = await ingestLeads(cachedData.results, {
        userId,
        searchQuery: query,
        city,
        niche: niche || null,
        source: "local_scraper",
      });

      // Record search history
      await supabase.from("lead_searches").insert({
        user_id: userId,
        query,
        city,
        niche: niche || null,
        results_count: enrichedCached.length,
        results_json: enrichedCached,
      });

      return NextResponse.json({
        success: true,
        source: "database_cache",
        leads: enrichedCached,
      });
    }

    // 2. Fetch fresh leads (Apify then Serper)
    let mappedLeads: any[] = [];
    const apifyToken = process.env.APIFY_API_TOKEN;

    if (apifyToken) {
      try {
        const actorId = "compass/Google-Maps-Scraper";
        const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyToken}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchStrings: [`${query} in ${city}`], maxCrawledPlacesPerSearch: 100, language: "en" }),
          signal: AbortSignal.timeout(30000),
        });
        if (runRes.ok) {
          const items = await runRes.json();
          mappedLeads = items.map((place: any, index: number) => ({
            id: place.cid || place.title || `apify-lead-${index}-${Date.now()}`,
            businessName: place.title || "Unknown Business",
            niche: niche || query,
            location: place.address || `${city}, Pakistan`,
            phone: place.phone || "No Contact Number",
            website: place.website || null,
            email: place.email || (place.website ? `info@${new URL(place.website).hostname.replace("www.", "")}` : ""),
            rating: place.rating || 0,
            leadTemperature: !place.website || (place.rating > 0 && place.rating < 4.0) ? "Hot" : place.rating >= 4.0 ? "Warm" : "Cold",
          }));
        }
      } catch (e) { console.warn("[APIFY_FALLBACK]", e); }
    }

    if (mappedLeads.length === 0) {
      const serperApiKey = process.env.SERPER_API_KEY;
      if (!serperApiKey) throw new Error("Scraper configuration missing");
      const serperRes = await fetch("https://google.serper.dev/places", {
        method: "POST",
        headers: { "X-API-KEY": serperApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: `${query} in ${city}`, gl: "pk" }),
      });
      if (!serperRes.ok) throw new Error("External Scraper Service Unavailable");
      const rawData = await serperRes.json();
      const places = rawData.places || [];
      mappedLeads = places.map((place: any, index: number) => {
        const rawWebsite = place.website;
        const hasNoValidWebsite = !rawWebsite || rawWebsite.includes("googleusercontent.com") || rawWebsite.includes("maps.google.com");
        let businessEmail = "";
        if (!hasNoValidWebsite) {
          try { const domain = new URL(rawWebsite).hostname.replace("www.", ""); businessEmail = `info@${domain}`; } catch {}
        }
        const rating = place.rating || 0;
        const temperature = hasNoValidWebsite || (rating > 0 && rating < 4.0) ? "Hot" : rating >= 4.0 ? "Warm" : "Cold";
        return {
          id: place.cid || `serper-lead-${index}-${Date.now()}`,
          businessName: place.title || "Unknown Business",
          niche: niche || query,
          location: place.address || `${city}, Pakistan`,
          phone: place.phoneNumber || "No Contact Number",
          website: hasNoValidWebsite ? null : rawWebsite,
          email: businessEmail,
          rating,
          leadTemperature: temperature,
        };
      });
    }

    // 3. Ingest leads into central database and get enriched leads with central IDs
    const enrichedLeads = await ingestLeads(mappedLeads, {
      userId,
      searchQuery: query,
      city,
      niche: niche || null,
      source: "local_scraper",
    });

    // 4. Save cache and search history with enriched leads
    await supabase.from("lead_caches").upsert({
      search_query: cacheKey,
      results: enrichedLeads,
      updated_at: new Date().toISOString(),
    }, { onConflict: "search_query" });

    await supabase.from("lead_searches").insert({
      user_id: userId,
      query,
      city,
      niche: niche || null,
      results_count: enrichedLeads.length,
      results_json: enrichedLeads,
    });

    return NextResponse.json({
      success: true,
      source: "live_scrape",
      leads: enrichedLeads,
    });
  } catch (error: any) {
    console.error("[SCRAPE_LEADS]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}