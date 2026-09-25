import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Initialize/Update profile with credits if not exists
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
          await supabaseAdmin.from("profiles").insert({
            id: user.id,
            name: userName,
            email: user.email,
            subscription_plan: "free_trial",
            subscription_status: "active",
            trial_starts_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            credits_remaining: 100, // âœ… 100 trial credits
          });
        }

        // 2. Handle Gmail OAuth tokens if present
        const providerToken = user.user_metadata?.provider_token;
        const providerRefreshToken = user.user_metadata?.provider_refresh_token;

        if (providerToken) {
          const fromEmail = user.email || user.user_metadata?.email || "";
          const fromName = user.user_metadata?.full_name || user.user_metadata?.name || fromEmail.split("@")[0] || "User";

          await supabaseAdmin.from("email_connections").upsert(
            {
              user_id: user.id,
              provider: "google",
              access_token: providerToken,
              refresh_token: providerRefreshToken || null,
              token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
              from_email: fromEmail,
              from_name: fromName,
              is_active: true,
            },
            { onConflict: "user_id" }
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}