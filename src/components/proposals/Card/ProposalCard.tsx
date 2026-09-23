"use client";

import { Badge } from "@/components/ui/badge";
import { Brain, ArrowRight } from "lucide-react";

// ──────────────────────────────────────────────────
// Sub-components (flat, elegant, no shadows)
// ──────────────────────────────────────────────────

function CoverLetter({ clientName, company, body }: { clientName: string; company: string; body: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">📝 Cover Letter</h3>
      <p className="text-xs text-muted-foreground">Dear {clientName},</p>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/85">{body}</p>
      <p className="text-xs text-muted-foreground">
        Best regards,<br />
        Lead Proposal Writer, {company}
      </p>
    </div>
  );
}

function Section({ title, children, icon }: { title: string; children: React.ReactNode; icon?: string }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        {icon && <span className="text-base">{icon}</span>} {title}
      </h3>
      <div className="text-sm leading-relaxed text-foreground/80">{children}</div>
    </div>
  );
}

function Timeline({ milestones }: { milestones: { week: string; task: string }[] }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">⏳ Timeline</h3>
      <ul className="space-y-1">
        {milestones.map((m, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span className="font-medium text-primary whitespace-nowrap">{m.week}:</span>
            <span className="text-foreground/80">{m.task}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Pricing({ total, breakdown }: { total: string; breakdown: { item: string; cost: string }[] }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">💰 Pricing</h3>
      <p className="text-sm font-medium text-foreground">Total: {total}</p>
      <ul className="space-y-0.5">
        {breakdown.map((b, i) => (
          <li key={i} className="text-xs text-muted-foreground flex justify-between max-w-xs">
            <span>{b.item}</span>
            <span className="text-foreground/80">{b.cost}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TermsAndConditions({ terms }: { terms: string[] }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">📜 Terms &amp; Conditions</h3>
      <ul className="space-y-1">
        {terms.map((t, i) => (
          <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
            <span className="text-primary mt-0.5 shrink-0">●</span> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProposalFooter({ decision, risk, nextStep }: { decision: string; risk: string; nextStep: string }) {
  return (
    <div className="pt-3 mt-4 border-t border-white/5 space-y-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <Brain size={14} className="text-primary shrink-0" />
        <span className="font-medium">AI Decision Engine:</span>
        <span className="text-emerald-400">Decision: {decision}</span>
        <span className="text-yellow-400">| Risk: {risk}</span>
        <ArrowRight size={12} className="text-primary" />
        <span className="text-foreground/80">{nextStep}</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Main Component (renders the full JSON proposal)
// ──────────────────────────────────────────────────

interface ProposalData {
  clientName: string;
  company: string;
  coverLetterBody: string;
  summary: string;
  problem: string;
  solution: string;
  technical: string;
  milestones: { week: string; task: string }[];
  pricingTotal: string;
  pricingBreakdown: { item: string; cost: string }[];
  terms: string[];
  decision: string;
  risk: string;
  nextStep: string;
}

export default function ProposalCard({ data }: { data: ProposalData }) {
  return (
    <div className="w-full max-w-3xl mx-auto p-5 space-y-5 rounded-xl bg-white/5 border border-white/5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          G
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold heading-gradient truncate">Project Proposal</h2>
          <p className="text-[10px] text-muted-foreground">Prepared by GigThink AI • Confidential</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 shrink-0">AI Generated</Badge>
      </div>

      {/* Content */}
      <CoverLetter clientName={data.clientName} company={data.company} body={data.coverLetterBody} />
      <Section title="Summary" icon="📌">{data.summary}</Section>
      <Section title="Problem Statement" icon="⚠️">{data.problem}</Section>
      <Section title="Solution" icon="💡">{data.solution}</Section>
      <Section title="Technical Details" icon="⚙️">{data.technical}</Section>
      <Timeline milestones={data.milestones} />
      <Pricing total={data.pricingTotal} breakdown={data.pricingBreakdown} />
      <TermsAndConditions terms={data.terms} />
      <ProposalFooter decision={data.decision} risk={data.risk} nextStep={data.nextStep} />
    </div>
  );
}