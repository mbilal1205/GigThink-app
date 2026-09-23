// components/AuthModal.tsx
"use client";
import { useAuthModal } from "@/hooks/useAuthModal";

export default function AuthModal() {
  const { isOpen, triggerReason, closeModal } = useAuthModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl text-center">
        {/* Close Button */}
        <button 
          onClick={closeModal} 
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* Dynamic Context Header */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          ✨
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight">
          Unlock GigThink Pro
        </h3>
        
        <p className="mt-2 text-sm text-zinc-400 px-4">
          {triggerReason || "Get instant access to AI proposals, direct cold outreach templates, and off-market lead databases."}
        </p>

        {/* Authentication Buttons */}
        <div className="mt-6 space-y-3">
          <button 
            onClick={() => {
              // Yahan Google login integration lagayenge supabase ki
              console.log("Redirect to Supabase Google Login");
            }}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Continue with Google
          </button>
          
          <button 
            onClick={() => {
              // GitHub Login
              console.log("Redirect to Supabase GitHub Login");
            }}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-850"
          >
            Continue with GitHub
          </button>
        </div>

        <p className="mt-4 text-[11px] text-zinc-500">
          By signing up, you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  );
}