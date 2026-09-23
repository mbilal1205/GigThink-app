import { z } from 'zod';

export const clientSchema = z.object({
  client_name: z.string().min(2, "Client name must be at least 2 characters"),
  company_name: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  project_title: z.string().min(2, "Project title is required"),
  project_summary: z.string().optional().nullable(),
  budget: z.number().nonnegative("Budget cannot be negative").optional().default(0),
  currency: z.string().default('USD'),
  deadline: z.string().optional().nullable(),
  status: z.enum(['lead', 'proposal_sent', 'active', 'completed', 'archived']).default('lead'),
});

export const updateClientSchema = clientSchema.partial();

export type ClientInput = z.infer<typeof clientSchema>;