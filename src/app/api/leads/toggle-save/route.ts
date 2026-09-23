import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/utils/supabaseAdmin";
import { z } from "zod";

const toggleSchema = z.object({
  lead_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const leadId = parsed.data.lead_id;
    const userId = user.id;

    // Check if lead exists
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, business_name, email, phone, website, location, niche, lead_temperature, rating")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Check existing saved_lead
    const { data: existingSaved, error: savedError } = await supabase
      .from("saved_leads")
      .select("id")
      .eq("user_id", userId)
      .eq("lead_id", leadId)
      .maybeSingle();

    if (savedError) {
      return NextResponse.json({ error: savedError.message }, { status: 500 });
    }

    let isSaved: boolean;

    if (existingSaved) {
      // Unsave: delete from saved_leads and update interaction
      const { error: deleteError } = await supabase
        .from("saved_leads")
        .delete()
        .eq("id", existingSaved.id);

      if (deleteError) throw deleteError;

      isSaved = false;

      // Update interaction
      await supabaseAdmin
        .from("lead_user_interactions")
        .upsert(
          {
            user_id: userId,
            lead_id: leadId,
            saved: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lead_id" }
        );
    } else {
      // Save: insert into saved_leads and update interaction
      const leadData = {
        businessName: lead.business_name,
        email: lead.email || "",
        phone: lead.phone || "",
        website: lead.website || null,
        location: lead.location || "",
        rating: lead.rating || 0,
        leadTemperature: lead.lead_temperature || "Warm",
        niche: lead.niche || "",
      };

      const { error: insertError } = await supabase
        .from("saved_leads")
        .insert({
          user_id: userId,
          lead_id: leadId,
          lead_data: leadData,
          status: "saved",
        });

      if (insertError) throw insertError;

      isSaved = true;

      await supabaseAdmin
        .from("lead_user_interactions")
        .upsert(
          {
            user_id: userId,
            lead_id: leadId,
            saved: true,
            last_saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lead_id" }
        );
    }

    return NextResponse.json({ success: true, is_saved: isSaved });
  } catch (error: any) {
    console.error("[TOGGLE_SAVE]", error);
    return NextResponse.json({ error: error.message || "Failed to toggle save" }, { status: 500 });
  }
}