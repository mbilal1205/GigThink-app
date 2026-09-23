import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateDailyBriefing } from "@/lib/ai/project-manager";

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

    // We could cache, but for simplicity generate fresh each time
    const briefing = await generateDailyBriefing(user.id, id);

    return NextResponse.json({ success: true, briefing });
  } catch (error: any) {
    console.error("[DAILY_BRIEFING_GET]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Same as GET; we can also accept forceRegenerate flag
  return GET(req, { params });
}