"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      // Success - show message and redirect to OTP page
      setMessage(data.message);
      // Save email in sessionStorage for OTP page
      sessionStorage.setItem("resetEmail", email);
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push("/auth/verify-otp");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-6 text-center">
          <Image src="/gigwaitelogo.jpeg" alt="GigThink Logo" width={64} height={64} className="mx-auto" />
        </div>

        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
        <p className="text-sm text-muted-foreground text-center mt-2 mb-6">
          Enter your email and we'll send you a one-time password (OTP).
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-card border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Your email address"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-black/90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}