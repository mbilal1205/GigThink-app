import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/utils/supabaseAdmin";
import { z } from "zod";
import { ingestLeads } from "@/lib/leads/ingest-leads";

const leadSchema = z.object({
  lead: z.object({
    businessName: z.string().min(1),
    email: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().nullable().optional(),
    location: z.string().optional(),
    rating: z.number().optional(),
    leadTemperature: z.string().optional(),
    niche: z.string().optional(),
  }),
  central_lead_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });

    let leadId = parsed.data.central_lead_id;

    // If no central lead id provided, ingest the lead now
    if (!leadId) {
      const ingested = await ingestLeads([parsed.data.lead], {
        userId: user.id,
        searchQuery: "manual_save",
        source: "manual_save",
      });
      if (ingested.length > 0) {
        leadId = ingested[0].id;
      } else {
        return NextResponse.json({ error: "Lead ingestion failed" }, { status: 500 });
      }
    }

    // Insert into saved_leads with lead_id
    const { data, error } = await supabase
      .from("saved_leads")
      .insert({
        user_id: user.id,
        lead_id: leadId,
        lead_data: parsed.data.lead,
        status: "saved",
      })
      .select("id")
      .single();

    if (error) throw error;

    // Record interaction: saved = true
    await supabaseAdmin.from("lead_user_interactions").upsert(
      {
        user_id: user.id,
        lead_id: leadId,
        saved: true,
        last_saved_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lead_id" }
    );

    return NextResponse.json({ success: true, id: data.id, lead_id: leadId }, { status: 201 });
  } catch (error: any) {
    console.error("[SAVE_LEAD]", error);
    return NextResponse.json({ error: error.message || "Failed to save lead" }, { status: 500 });
  }
}