import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createProjectFromOpportunity } from "@/lib/ai/workflow-service";
import { z } from "zod";

const opportunitySchema = z.object({
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
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = opportunitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await createProjectFromOpportunity(user.id, parsed.data);

    return NextResponse.json(
      { success: true, projectId: result.projectId, clientId: result.clientId },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[OPPORTUNITY_SELECT]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process opportunity" },
      { status: 500 }
    );
  }
}