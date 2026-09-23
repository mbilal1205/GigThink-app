"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  // Strong Password Validation Logic
  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(pass)) {
      return "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.";
    }
    return "";
  };

  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setMessage("");
  setPasswordError("");

  const passError = validatePassword(password);
  if (passError) {
    setPasswordError(passError);
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Signup failed");
    }

    // âœ… Redirect to email confirmation page instead of showing inline message
    router.push("/auth/email-confirmation");
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between items-center bg-background text-foreground p-4 sm:p-6 overflow-hidden select-none">
      
      {/* ClickUp-Style Ambient Top Soft Glow Background */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl pointer-events-none -z-10" />

      {/* Main Container - Centered Form */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto py-6">
        <div className="w-full max-w-[380px] sm:max-w-[400px] flex flex-col items-center">
          
          {/* ========================================================= */}
          {/* LOGO AREA - Custom Logo Image Slot                        */}
          {/* ========================================================= */}
          <div className="mb-6 flex items-center justify-center select-none pointer-events-none">
  {/* Modern Cleaned & Secured Logo with Increased Size */}
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

          

          {/* Heading Section */}
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground text-center">
            Join GigThink
          </h1>
          <p className="text-xs text-muted-foreground mt-1 mb-5 text-center">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>

          {/* Error Message Alert */}
          {error && (
            <div className="w-full mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Success Message Alert */}
          {message && (
            <div className="w-full mb-4 p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Form Content Container */}
          <div className="w-full space-y-3.5">
            
           

            

            {/* Signup Form */}
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-card text-foreground border border-input rounded-lg px-3.5 py-2.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Full name"
                />
              </div>

              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-card text-foreground border border-input rounded-lg px-3.5 py-2.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Work email"
                />
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    className={`w-full bg-card text-foreground border ${passwordError ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-primary'} rounded-lg pl-3.5 pr-10 py-2.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 transition-all`}
                    placeholder="Password (min 8 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {passwordError && (
                  <p className="mt-1.5 text-[11px] text-destructive font-medium leading-tight">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-primary-foreground  py-2.5 rounded-lg font-semibold text-xs transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>

            <p className="text-[11px] text-muted-foreground text-center pt-2 leading-relaxed">
              By signing up, you agree to our terms of service & privacy policy.
            </p>

          </div>

        </div>
      </div>

      {/* Bottom Footer "Need help?" */}
      <footer className="py-4 text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
        Need help?
      </footer>

    </div>
  );
}