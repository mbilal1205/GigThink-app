// src/components/Global/DevelopmentBanner.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

const BANNER_MESSAGE =
  "GigThink is under active development. Some features may be temporarily unavailable while we polish them up — our team is fixing them quickly. Thank you for your patience and support!";

const STORAGE_KEY = "gigthink-dev-banner-dismissed";

export default function DevelopmentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setVisible(false);
      }
    } catch {
      // sessionStorage unavailable — keep banner visible
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!mounted || !visible) return null;

  return (
    <>
      {/* Scoped keyframes — no need to touch globals.css */}
      <style>{`
        @keyframes gigthink-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .gigthink-marquee-track {
          animation: gigthink-marquee 45s linear infinite;
          will-change: transform;
        }
        .gigthink-marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .gigthink-marquee-track {
            animation-duration: 90s;
          }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-[0_-2px_12px_rgba(0,0,0,0.12)]"
      >
        <div className="relative flex h-9 items-center overflow-hidden">
          {/* Seamless marquee — same message twice, translate -50% */}
          <div className="gigthink-marquee-track flex w-max items-center pr-12">
            {[0, 1].map((i) => (
              <span
                key={i}
                className="mx-6 inline-flex items-center gap-2 whitespace-nowrap text-[12px] font-medium tracking-wide sm:text-[13px]"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" />
                <span>🚧 {BANNER_MESSAGE}</span>
              </span>
            ))}
          </div>

          {/* Dismiss button — pinned right */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss development notice"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/35 active:scale-95"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}