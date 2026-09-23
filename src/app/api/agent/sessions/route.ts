// src/app/api/agent/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { listUserSessions, deleteSession, togglePinSession } from "@/lib/ai/brain/memory-service";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await listUserSessions(user.id);
  return NextResponse.json({ sessions });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId } = await req.json();
  await deleteSession(user.id, sessionId);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sessionId, isPinned } = await req.json();
  await togglePinSession(user.id, sessionId, isPinned);
  return NextResponse.json({ success: true });
}