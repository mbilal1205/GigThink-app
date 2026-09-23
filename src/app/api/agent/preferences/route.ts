// src/app/api/agent/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getPreferences, setPreference, updatePreferences } from "@/lib/ai/brain/preference-service";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferences = await getPreferences(user.id);
  return NextResponse.json({ preferences });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = await req.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: "Key and value required" }, { status: 400 });
  }

  await setPreference(user.id, key, value);
  const preferences = await getPreferences(user.id);
  return NextResponse.json({ preferences });
}

export async function DELETE(req: NextRequest) {
  // Clear all preferences
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await updatePreferences(user.id, {});
  return NextResponse.json({ success: true });
}