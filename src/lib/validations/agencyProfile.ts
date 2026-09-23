import { z } from 'zod';

export const agencyProfileSchema = z.object({
  agency_name: z.string().min(2, "Agency name must be at least 2 characters long"),
  tagline: z.string().optional().nullable(),
  website_url: z.string().url("Invalid website URL").optional().nullable().or(z.literal('')),
  contact_email: z.string().email("Invalid email address").optional().nullable().or(z.literal('')),
  logo_url: z.string().url("Invalid logo URL").optional().nullable().or(z.literal('')),
  primary_color: z.string().default('#0F172A'),
  secondary_color: z.string().default('#3B82F6'),
  font_family: z.string().default('Inter'),
  brand_tone: z.string().default('Professional and Direct'),
  core_skills: z.array(z.string()).optional().default([]),
  preferred_tech_stack: z.array(z.string()).optional().default([]),
  base_hourly_rate: z.number().nonnegative("Hourly rate must be 0 or positive").optional().nullable(),
  currency: z.string().default('USD'),
  timezone: z.string().default('Asia/Karachi'),
});

// Partial Schema for Updates (PUT/PATCH)
export const updateAgencyProfileSchema = agencyProfileSchema.partial();

export type AgencyProfileInput = z.infer<typeof agencyProfileSchema>;