import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { scoreOpportunity } from "@/lib/ai/opportunity-scorer";
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

    // ðŸ”¥ Credit check for AI analysis (first time free, then 10 credits)
    const creditResult = await consumeCredits(user.id, "ai_analyze", 10);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error, showPaywall: creditResult.showPaywall },
        { status: 403 }
      );
    }

    // Fetch lead from DB
    const { data: leadRow, error: fetchError } = await supabase
      .from("saved_leads")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (fetchError || !leadRow) throw new Error("Lead not found");

    const leadData = leadRow.lead_data;
    const score = await scoreOpportunity(user.id, {
      title: leadData.businessName,
      description: `${leadData.businessName} in ${leadData.location || "Unknown"}. ${leadData.niche || ""}`,
      clientName: leadData.businessName,
      budget: undefined,
      currency: "USD",
      skillsRequired: [],
      source: "saved_lead",
    });

    // Save AI score back
    await supabase
      .from("saved_leads")
      .update({ ai_score: score, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, score });
  } catch (error: any) {
    console.error("[ANALYZE_LEAD]", error);
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
  }
}