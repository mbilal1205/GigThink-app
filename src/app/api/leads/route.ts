import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("saved_leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, leads: data || [] });
  } catch (error: any) {
    console.error("[GET_LEADS]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch leads" }, { status: 500 });
  }
}