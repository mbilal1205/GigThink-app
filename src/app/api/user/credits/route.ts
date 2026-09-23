import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { getCreditBalance, isPremiumUser } from "@/lib/credits";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const credits = await getCreditBalance(user.id);
  const premium = await isPremiumUser(user.id);

  return NextResponse.json({ credits, isPremium: premium });
}