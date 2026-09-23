/// <reference lib="deno.ns" />
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization") || "";
  if (
    authHeader.replace("Bearer ", "").trim() !== Deno.env.get("CRON_SECRET")
  ) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const { error, count } = await supabaseAdmin
      .from("opportunities")
      .delete({ count: "exact" })
      .lt("posted_at", thirtyDaysAgo);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, deleted: count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});