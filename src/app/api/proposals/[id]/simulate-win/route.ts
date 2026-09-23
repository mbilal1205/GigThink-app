import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { simulateClientWin } from "@/lib/ai/workflow-service";

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
    const result = await simulateClientWin(user.id, id);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("[SIMULATE_WIN]", error);
    return NextResponse.json(
      { error: error.message || "Failed to simulate client win" },
      { status: 500 }
    );
  }
}