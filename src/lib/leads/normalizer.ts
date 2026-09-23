import { createHash } from "crypto";

export interface NormalizedLead {
  source: string;
  source_lead_id: string | null;
  source_agency: string | null;
  source_provider: string | null;
  source_url: string | null;

  business_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  niche: string | null;
  lead_temperature: string | null;
  rating: number | null;
  description: string | null;

  raw_data: any;
}

/**
 * Normalize any lead object from external sources into our standard shape.
 * Current sources: local scraper (businessName, email, phone, website, location, etc.)
 */
export function normalizeLead(lead: any, source: string = "local_scraper"): NormalizedLead {
  const raw = lead?.raw_data || lead;
  return {
    source,
    source_lead_id: lead?.source_lead_id || lead?.id || null,
    source_agency: lead?.source_agency || null,
    source_provider: lead?.source_provider || null,
    source_url: lead?.source_url || lead?.website || null,

    business_name: (lead?.businessName || lead?.business_name || lead?.company_name || "").trim(),
    company_name: (lead?.company_name || lead?.businessName || "").trim() || null,
    email: (lead?.email || lead?.contact_email || lead?.company_email || "").trim().toLowerCase() || null,
    phone: (lead?.phone || lead?.contact_phone || "").trim() || null,
    website: (lead?.website || lead?.company_domain || "").trim().toLowerCase() || null,
    location: (lead?.location || lead?.city || "").trim() || null,
    industry: (lead?.industry || lead?.niche || "").trim() || null,
    niche: (lead?.niche || lead?.industry || "").trim() || null,
    lead_temperature: lead?.leadTemperature || lead?.lead_temperature || null,
    rating: typeof lead?.rating === "number" ? lead.rating : null,
    description: lead?.description || lead?.summary || null,

    raw_data: raw,
  };
}