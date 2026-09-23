// src/supabase/getAgencyProfile.ts
import { createSupabaseServerClient } from "@/utils/supabase/server";

/**
 * Agency profile data shape.
 * Matches `agencyProfileSchema` in `src/lib/validations/agencyProfile.ts`.
 */
export interface AgencyProfileData {
  // Supabase standard
  id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;

  // Identity (from schema)
  agency_name: string;
  tagline?: string | null;
  website_url?: string | null;
  contact_email?: string | null;
  logo_url?: string | null;

  // Branding
  primary_color: string;
  secondary_color: string;
  font_family: string;
  brand_tone: string;

  // Skills & Stack
  core_skills: string[];
  preferred_tech_stack: string[];

  // Pricing
  base_hourly_rate?: number | null;
  currency: string;
  timezone: string;

  // Allow extra columns without breaking types
  [key: string]: unknown;
}

/**
 * Fetch the agency profile for an authenticated user.
 *
 * @param userId - The authenticated user's ID.
 * @returns The agency profile row, or `null` if not found.
 */
export async function getAgencyProfile(
  userId: string
): Promise<AgencyProfileData | null> {
  if (!userId?.trim()) {
    console.warn("[getAgencyProfile] Called with empty userId");
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("agency_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      // PGRST116 = no rows returned (not a real error)
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("[getAgencyProfile] Supabase error:", error.message);
      return null;
    }

    return (data as AgencyProfileData) ?? null;
  } catch (err) {
    console.error(
      "[getAgencyProfile] Unexpected error:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Fetch agency profile by explicit user id.
 * Alias of `getAgencyProfile` — kept for API stability.
 */
export async function getAgencyProfileByUserId(
  userId: string
): Promise<AgencyProfileData | null> {
  return getAgencyProfile(userId);
}