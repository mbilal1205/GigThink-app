import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { z } from "zod";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = emailSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    // Fetch user's Gmail connection
    const { data: connection, error: connectionError } = await supabase
      .from("email_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: "Gmail not connected. Please connect Gmail in Settings." }, { status: 400 });
    }

    // OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    );

    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
    });

    // Refresh token if needed (auto)
    // Build raw email
    const rawEmail = [
      `From: ${connection.from_name} <${connection.from_email}>`,
      `To: ${parsed.data.to}`,
      `Subject: ${parsed.data.subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      parsed.data.body,
    ].join("\n");

    const encodedEmail = Buffer.from(rawEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedEmail },
    });

    return NextResponse.json({ success: true, message: "Email sent", id: result.data.id });
  } catch (error: any) {
    console.error("[SEND_EMAIL_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to send email" }, { status: 500 });
  }
}