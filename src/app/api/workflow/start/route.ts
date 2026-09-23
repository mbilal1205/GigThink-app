import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { runFullWorkflow } from "@/lib/ai/workflow-service";
import { consumeCredits } from "@/lib/credits";
import { z } from "zod";

const demoOpportunitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(5),
  clientName: z.string().optional(),
  clientCompany: z.string().optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  currency: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  sourceUrl: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ðŸ”¥ Credit check for full workflow (first time free, then 50 credits)
    const creditResult = await consumeCredits(user.id, "full_workflow", 50);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error, showPaywall: creditResult.showPaywall },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = demoOpportunitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await runFullWorkflow(user.id, parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[WORKFLOW_START]", error);
    return NextResponse.json({ error: error.message || "Workflow failed" }, { status: 500 });
  }
}