import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { calculateProjectHealth, detectDelays, updateProjectHealth } from "@/lib/ai/project-manager";

export async function GET(
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

    const [health, risks] = await Promise.all([
      calculateProjectHealth(user.id, id),
      detectDelays(user.id, id),
    ]);

    // Update project healthScore and progress in background (no await)
    updateProjectHealth(user.id, id).catch((err) =>
      console.error("[HEALTH_UPDATE_ERROR]", err)
    );

    return NextResponse.json({
      success: true,
      health,
      risks,
    });
  } catch (error: any) {
    console.error("[HEALTH_GET]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}