// src/app/api/agent/memory/clear/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import ConversationMemory from "@/lib/models/ConversationMemory";
import UserPreference from "@/lib/models/UserPreference";

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  await ConversationMemory.deleteMany({ userId: user.id });
  await UserPreference.deleteMany({ userId: user.id });

  return NextResponse.json({ success: true });
}