import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("email_connections")
      .select("id, smtp_host, smtp_port, smtp_user, from_name, from_email, is_active, created_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, connection: data || null });
  } catch (error: any) {
    console.error("[GET_EMAIL_CONNECTION]", error);
    return NextResponse.json({ error: error.message || "Failed to get email connection" }, { status: 500 });
  }
}