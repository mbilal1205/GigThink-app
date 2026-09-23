"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const ALLOWED_PROVIDERS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "aol.com",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("error") === "session_expired") {
        setError("Your session has expired after 30 minutes. Please log in again to continue.");
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || !ALLOWED_PROVIDERS.includes(emailDomain)) {
      setError("Please enter a valid email from a trusted provider (Gmail, Outlook, Yahoo, etc.).");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Invalid password format. Passwords must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes("Email not confirmed")) {
        setError("Your email address is not verified yet. Please check your Inbox or Spam folder.");
      } else if (authError.message.includes("Invalid login credentials")) {
        setError("Incorrect email address or password. Please try again.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
    } else {
      document.cookie = "auth_session_timeout=true; path=/; max-age=1800; SameSite=Lax; Secure";
      router.push("/");
    }
  };

  const handleGoogleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { 
      redirectTo: `${window.location.origin}/auth/callback?source=signup` // <-- ye add karein
    },
  });
};

  return (
    <div className="min-h-screen relative flex flex-col justify-between items-center bg-background text-foreground p-4 sm:p-6 overflow-hidden select-none">
      {/* â”€â”€â”€ Ambient Glow (Themed) â”€â”€â”€ */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl pointer-events-none -z-10" />

      {/* â”€â”€â”€ Main Container â”€â”€â”€ */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto py-6">
        <div className="w-full max-w-[380px] flex flex-col items-center">
          {/* â”€â”€â”€ Logo â”€â”€â”€ */}
          <div className="mb-6 flex items-center justify-center select-none pointer-events-none">
            <Image
              src="/gigwaitelogo.jpeg"
              alt="GigThink Logo"
              width={64}
              height={64}
              className="h-14 w-auto object-contain unselectable"
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>

          {/* â”€â”€â”€ Heading â”€â”€â”€ */}
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground text-center">
            Welcome back!
          </h1>
          <p className="text-xs text-muted-foreground mt-1 mb-6 text-center">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary font-medium hover:underline transition-colors">
              Sign up
            </Link>
          </p>

          {/* â”€â”€â”€ Error Alert â”€â”€â”€ */}
          {error && (
            <div className="w-full mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* â”€â”€â”€ Form â”€â”€â”€ */}
          <div className="w-full space-y-3.5">
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 bg-card hover:bg-muted/60 border border-border py-2.5 px-4 rounded-lg font-medium text-xs text-foreground transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-background px-2 text-muted-foreground font-medium">or</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-card text-foreground border border-input rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Work email"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-card text-foreground border border-input rounded-lg pl-3.5 pr-10 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-primary-foreground py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] hover:bg-black/90 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            {/* Forgot Password */}
            <div className="pt-2 text-center">
  <Link
    href="/auth/forgot-password"
    className="text-xs text-primary hover:underline font-medium transition-colors"
  >
    Forgot Password?
  </Link>
</div>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ Footer â”€â”€â”€ */}
      <footer className="py-4 text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
        Need help?
      </footer>
    </div>
  );
}