// src/components/agent/proposal-view.tsx
"use client";

interface Milestone {
  week: string;
  task: string;
}

interface PricingBreakdown {
  item: string;
  cost: string;
}

interface ProposalData {
  clientName?: string;
  company?: string;
  coverLetterBody?: string;
  summary?: string;
  problem?: string;
  solution?: string;
  technical?: string;
  milestones?: Milestone[];
  pricingTotal?: string;
  pricingBreakdown?: PricingBreakdown[];
  terms?: string[];
  decision?: string;
  risk?: string;
  nextStep?: string;
}

export default function ProposalView({ data }: { data: ProposalData }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-heading text-foreground">
          Proposal {data.clientName ? `for ${data.clientName}` : ""}
        </h1>
        {data.company && (
          <p className="text-sm text-muted-foreground mt-1">
            Prepared by {data.company}
          </p>
        )}
      </div>

      {/* Cover Letter */}
      {data.coverLetterBody && (
        <section className="bg-muted/50 rounded-lg p-4 border border-border">
          <h2 className="text-base font-semibold text-primary mb-2">
            Cover Letter
          </h2>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {data.coverLetterBody}
          </p>
        </section>
      )}

      {/* Summary */}
      {data.summary && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Executive Summary
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
        </section>
      )}

      {/* Problem */}
      {data.problem && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Problem Statement
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {data.problem}
          </p>
        </section>
      )}

      {/* Solution */}
      {data.solution && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Our Solution
          </h3>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {data.solution}
          </div>
        </section>
      )}

      {/* Technical */}
      {data.technical && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Technical Approach
          </h3>
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {data.technical}
          </div>
        </section>
      )}

      {/* Milestones */}
      {data.milestones && data.milestones.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Milestones & Timeline
          </h3>
          <div className="space-y-2">
            {data.milestones.map((milestone, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 rounded-md bg-muted/40 border border-border"
              >
                <span className="text-xs font-medium text-primary bg-primary/10 rounded px-2 py-0.5 min-w-[50px] text-center">
                  Week {milestone.week}
                </span>
                <span className="text-sm text-foreground/80">
                  {milestone.task}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing */}
      {data.pricingTotal && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Investment
          </h3>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-3">
            <span className="text-lg font-semibold text-primary">
              {data.pricingTotal}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              Total Project Cost
            </span>
          </div>
          {data.pricingBreakdown && data.pricingBreakdown.length > 0 && (
            <div className="space-y-1">
              {data.pricingBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm py-1 border-b border-border/40"
                >
                  <span className="text-muted-foreground">{item.item}</span>
                  <span className="font-medium text-foreground">
                    {item.cost}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Terms */}
      {data.terms && data.terms.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Terms & Conditions
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {data.terms.map((term, idx) => (
              <li key={idx} className="text-sm text-muted-foreground">
                {term}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Decision / Risk */}
      {(data.decision || data.risk) && (
        <section className="flex flex-wrap gap-2">
          {data.decision && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                data.decision === "GO"
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}
            >
              Decision: {data.decision}
            </span>
          )}
          {data.risk && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Risk: {data.risk}
            </span>
          )}
        </section>
      )}

      {/* Next Step */}
      {data.nextStep && (
        <section className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-sm text-foreground/80">
            <span className="font-medium text-primary">Next Step:</span>{" "}
            {data.nextStep}
          </p>
        </section>
      )}
    </div>
  );
}