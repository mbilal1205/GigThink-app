// src/app/api/agent/activity/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getRecentActivities, clearAllActivities } from "@/lib/models/activity-service";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activities = await getRecentActivities(user.id);
  return NextResponse.json({ activities });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await clearAllActivities(user.id);
  return NextResponse.json({ success: true });
}