// components/LeadCard.tsx
"use client";
import { useAuthModal } from "@/hooks/useAuthModal";
interface Lead {
  id: string;
  title: string;
  description: string;
  platform: string;
  source_url: string;
  budget_info: string;
  author_handle: string;
  skills_tags: string[];
  posted_at: string;
}

export default function LeadCard({ lead }: { lead: Lead }) {
  const { openModal } = useAuthModal();

  // Helper colors for branding
  const getPlatformColors = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "upwork":
        return { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "Upwork" };
      case "reddit":
        return { bg: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "r/reddit" };
      default:
        return { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Social" };
    }
  };

  const badge = getPlatformColors(lead.platform);

  // Trigger Auth Gateway for premium actions
  const handlePremiumAction = (actionName: string) => {
    openModal(`You need a GigThink account to generate a ${actionName} for this lead.`);
  };

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80">
      
      {/* Header Info */}
      <div className="flex items-center justify-between gap-4">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.bg}`}>
          {badge.label}
        </span>
        <span className="text-xs text-zinc-500">
          {new Date(lead.posted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Post Content */}
      <h3 className="mt-4 text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
        {lead.title}
      </h3>
      
      <p className="mt-2 text-sm text-zinc-400 line-clamp-3 leading-relaxed">
        {lead.description}
      </p>

      {/* Dynamic Metadata & Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {lead.skills_tags.map((tag) => (
          <span key={tag} className="rounded bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 font-medium">
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer Info & Pricing */}
      <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Client Budget</p>
          <p className="text-sm font-bold text-white">{lead.budget_info}</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider text-right font-semibold">Source</p>
          <p className="text-sm text-zinc-300 font-medium">{lead.author_handle}</p>
        </div>
      </div>

      {/* Call to Actions (CTA) */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => handlePremiumAction("custom AI proposal")}
          className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-emerald-400"
        >
          âœ¨ AI Proposal
        </button>
        <button
          onClick={() => handlePremiumAction("Cold Outreach Pack (Email + LinkedIn Note)")}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-zinc-750"
        >
          âœ‰ï¸ Outreach Pack
        </button>

        
      </div>

    </div>
  );
}