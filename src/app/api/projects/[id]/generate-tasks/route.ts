import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateTasksFromProposal } from "@/lib/ai/workflow-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await generateTasksFromProposal(user.id, id);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[GENERATE_TASKS_FROM_PROPOSAL]", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate tasks" },
      { status: 500 }
    );
  }
}