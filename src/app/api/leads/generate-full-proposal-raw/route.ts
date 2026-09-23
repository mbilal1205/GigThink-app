import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { runFullWorkflow } from "@/lib/ai/workflow-service";
import { consumeCredits } from "@/lib/credits";
import { z } from "zod";

const leadSchema = z.object({
  lead: z.object({
    businessName: z.string().min(1),
    email: z.string().optional(),
    location: z.string().optional(),
    niche: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().nullable().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ðŸ”¥ Credit check for full proposal (first time free, then 30 credits)
    const creditResult = await consumeCredits(user.id, "full_proposal", 30);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error, showPaywall: creditResult.showPaywall },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });

    const { lead } = parsed.data;
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
      source: "lead_finder",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[RAW_FULL_PROPOSAL]", error);
    return NextResponse.json({ error: error.message || "Proposal generation failed" }, { status: 500 });
  }
}