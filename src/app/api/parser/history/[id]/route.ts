import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ðŸ”¥ Fix: Await params
  const { id } = await params;

  try {
    const { data: lead, error } = await supabaseAdmin
      .from('parsed_leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (err: any) {
    console.error("History single GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ðŸ”¥ Fix: Await params
  const { id } = await params;

  try {
    const { error } = await supabaseAdmin
      .from('parsed_leads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error("History delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("History DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}