import supabaseAdmin from "@/utils/supabaseAdmin";
import { normalizeLead } from "./normalizer";
import { generateLeadFingerprint } from "./fingerprint";

interface IngestOptions {
  userId: string;
  searchQuery: string;
  city?: string;
  niche?: string;
  source?: string;
  searchSessionId?: string;
}

interface IngestedLead {
  id: string;
  fingerprint_hash: string;
  business_name: string;
  source: string;
  raw_data: any;
  isNew: boolean;
}

/**
 * Ingest leads into central database.
 * Returns an array of enriched lead objects (original lead + central_lead_id).
 * Duplicate leads are updated (last_seen_at) and not re-inserted.
 */
export async function ingestLeads(
  leadsData: any[],
  options: IngestOptions
): Promise<any[]> {
  const {
    userId,
    searchQuery,
    city = null,
    niche = null,
    source = "local_scraper",
    searchSessionId = null,
  } = options;

  const enrichedLeads: any[] = [];

  for (const rawLead of leadsData) {
    try {
      // 1. Normalize
      const lead = normalizeLead(rawLead, source);

      if (!lead.business_name) continue; // skip empty leads

      // 2. Fingerprint
      const fingerprintHash = generateLeadFingerprint(lead);

      // 3. Check duplicate by fingerprint_hash
      const { data: existingLead, error: existingError } = await supabaseAdmin
        .from("leads")
        .select("id, fingerprint_hash")
        .eq("fingerprint_hash", fingerprintHash)
        .maybeSingle();

      if (existingError) {
        console.error("[INGEST_DUP_CHECK_ERROR]", existingError);
        continue;
      }

      let leadId: string;
      let isNew = false;

      if (existingLead) {
        // Lead exists â†’ update last_seen_at and any missing info
        leadId = existingLead.id;
        const { error: updateError } = await supabaseAdmin
          .from("leads")
          .update({
            last_seen_at: new Date().toISOString(),
            email: lead.email ?? undefined,
            phone: lead.phone ?? undefined,
            website: lead.website ?? undefined,
            location: lead.location ?? undefined,
            niche: lead.niche ?? undefined,
            rating: lead.rating ?? undefined,
            raw_data: lead.raw_data,
          })
          .eq("id", leadId);

        if (updateError) {
          console.error("[INGEST_UPDATE_ERROR]", updateError);
        }
      } else {
        // New lead â†’ insert
        const { data: inserted, error: insertError } = await supabaseAdmin
          .from("leads")
          .insert({
            fingerprint_hash: fingerprintHash,
            source: lead.source,
            source_lead_id: lead.source_lead_id,
            source_agency: lead.source_agency,
            source_provider: lead.source_provider,
            source_url: lead.source_url,
            business_name: lead.business_name,
            company_name: lead.company_name,
            email: lead.email,
            phone: lead.phone,
            website: lead.website,
            location: lead.location,
            industry: lead.industry,
            niche: lead.niche,
            lead_temperature: lead.lead_temperature,
            rating: lead.rating,
            description: lead.description,
            raw_data: lead.raw_data,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("[INGEST_INSERT_ERROR]", insertError);
          continue;
        }
        leadId = inserted.id;
        isNew = true;
      }

      // 4. Record search event (user discovery)
      const { error: eventError } = await supabaseAdmin
        .from("lead_search_events")
        .insert({
          lead_id: leadId,
          user_id: userId,
          search_query: searchQuery,
          city: city || null,
          niche: niche || null,
          source: source,
          search_session_id: searchSessionId,
          results_rank: enrichedLeads.length + 1,
        });

      if (eventError) {
        console.error("[INGEST_EVENT_ERROR]", eventError);
      }

      // 5. Push enriched lead (original + central_lead_id)
      enrichedLeads.push({
        ...rawLead,
        central_lead_id: leadId,
      });
    } catch (err) {
      console.error("[INGEST_LEAD_ERROR]", err);
      continue;
    }
  }

  return enrichedLeads;
}