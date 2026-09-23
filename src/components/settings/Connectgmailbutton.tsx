"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

export function ConnectGmailButton() {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState("");

  const supabase = getSupabaseBrowserClient();

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // ðŸ”¥ Yahan custom scopes pass karte hain (space se separated)
          scopes: "openid email profile https://www.googleapis.com/auth/gmail.send",
          queryParams: {
            access_type: "offline",   // Refresh token ke liye zaroori
            prompt: "consent",        // User ko permission screen dikhane ke liye
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // OAuth redirect hoga; callback route user ko wapas bhejega.
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conn, error } = await supabase
        .from("email_connections")
        .select("from_email, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && conn) {
        setConnected(true);
        setEmail(conn.from_email || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check on mount
  useState(() => {
    checkConnection();
  });

  return (
    <div className="flex items-center gap-2">
      {connected ? (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          Connected as {email}
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={loading}
          className="btn-gradient gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {loading ? "Connecting..." : "Connect Gmail"}
        </Button>
      )}
    </div>
  );
}