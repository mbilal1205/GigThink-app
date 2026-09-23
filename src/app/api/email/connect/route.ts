import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { encrypt } from "@/lib/email/encryption";
import { z } from "zod";

const connectionSchema = z.object({
  smtp_host: z.string().min(1, "SMTP Host is required"),
  smtp_port: z.number().int().min(1).max(65535).default(587),
  smtp_user: z.string().min(1, "SMTP User is required"),
  smtp_pass: z.string().min(1, "SMTP Password is required"),
  from_name: z.string().min(1, "From Name is required"),
  from_email: z.string().email("Valid email is required"),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = connectionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });

    const encryptedPass = encrypt(parsed.data.smtp_pass);

    // Upsert (user ke liye ek hi connection)
    const { data, error } = await supabase
      .from("email_connections")
      .upsert(
        {
          user_id: user.id,
          smtp_host: parsed.data.smtp_host,
          smtp_port: parsed.data.smtp_port,
          smtp_user: parsed.data.smtp_user,
          smtp_pass_encrypted: encryptedPass,
          from_name: parsed.data.from_name,
          from_email: parsed.data.from_email,
          is_active: true,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;

    // Don't return sensitive fields
    const { smtp_pass_encrypted, ...safeData } = data;
    return NextResponse.json({ success: true, connection: safeData }, { status: 200 });
  } catch (error: any) {
    console.error("[EMAIL_CONNECT]", error);
    return NextResponse.json({ error: error.message || "Failed to save email connection" }, { status: 500 });
  }
}