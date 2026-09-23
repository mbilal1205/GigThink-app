"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function VerifyOTPPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail");
    if (!savedEmail) {
      // If no email in session, redirect to forgot password
      router.push("/auth/forgot-password");
    } else {
      setEmail(savedEmail);
    }
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      // OTP verified, cookie set, redirect to reset password
      setMessage("OTP verified! Redirecting...");
      setTimeout(() => {
        sessionStorage.removeItem("resetEmail");
        router.push("/auth/reset-password");
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed.");
      setMessage("New OTP sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <Image src="/gigwaitelogo.jpeg" alt="GigThink Logo" width={64} height={64} className="mx-auto" />
        </div>

        <h1 className="text-2xl font-bold text-center">Enter OTP</h1>
        <p className="text-sm text-muted-foreground text-center mt-2 mb-6">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full bg-card border border-input rounded-lg px-4 py-3 text-center text-xl tracking-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="••••••"
          />
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-black text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-black/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-sm text-primary hover:underline disabled:opacity-60"
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
}