import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { runFullWorkflow } from "@/lib/ai/workflow-service";
import { consumeCredits } from "@/lib/credits";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // ðŸ”¥ Credit check for full proposal (first time free, then 30 credits)
    const creditResult = await consumeCredits(user.id, "full_proposal", 30);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error, showPaywall: creditResult.showPaywall },
        { status: 403 }
      );
    }

    // Fetch saved lead
    const { data: leadRow, error: fetchError } = await supabase
      .from("saved_leads")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (fetchError || !leadRow) throw new Error("Lead not found");

    const lead = leadRow.lead_data;
    const result = await runFullWorkflow(user.id, {
      title: `Project for ${lead.businessName}`,
      description: `Business: ${lead.businessName}\nLocation: ${lead.location || "Unknown"}\nNiche: ${lead.niche || "General"}`,
      clientName: lead.businessName,
      clientCompany: lead.businessName,
      budgetMin: null,
      budgetMax: null,
      currency: "USD",
      skills: [],
      location: lead.location,
      source: "saved_lead",
    });

    // Update lead status to proposal_sent
    await supabase
      .from("saved_leads")
      .update({ status: "proposal_sent", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[GENERATE_PROPOSAL_LEAD]", error);
    return NextResponse.json({ error: error.message || "Failed to generate proposal" }, { status: 500 });
  }
}