import { createHash } from "crypto";

/**
 * Generate a unique fingerprint hash for deduplication.
 * Uses normalized fields: business_name + email + phone + website + location.
 */
export function generateLeadFingerprint(lead: {
  business_name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  location?: string | null;
}): string {
  const parts = [
    lead.business_name?.toLowerCase().trim(),
    lead.email?.toLowerCase().trim(),
    lead.phone?.replace(/\s+/g, "").trim(),
    lead.website?.toLowerCase().trim(),
    lead.location?.toLowerCase().trim(),
  ].filter(Boolean);

  const normalized = parts.join("|");
  return createHash("sha256").update(normalized).digest("hex");
}