import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { scoreOpportunity } from "@/lib/ai/opportunity-scorer";
import { consumeCredits } from "@/lib/credits";
import { z } from "zod";

const leadSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(5),
  clientName: z.string().optional(),
  clientCompany: z.string().optional(),
  budget: z.number().optional(),
  currency: z.string().optional(),
  skillsRequired: z.array(z.string()).optional(),
  source: z.string().optional(),
  postedAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ðŸ”¥ Credit check for AI analysis (first time free, then 10 credits)
    const creditResult = await consumeCredits(user.id, "ai_analyze", 10);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error, showPaywall: creditResult.showPaywall },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const score = await scoreOpportunity(user.id, parsed.data);
    return NextResponse.json({ success: true, score });
  } catch (error: any) {
    console.error("[OPPORTUNITY_SCORE_API]", error);
    return NextResponse.json({ error: error.message || "Failed to score opportunity" }, { status: 500 });
  }
}