export const proposalStructure = {
  id: "structure",
  description: "The architectural flow of the proposal mapped with precise copywriting blueprints to eliminate AI fluff.",
  layouts: [
    {
      name: "The Upwork Short-Form",
      bestFor: "Small to medium jobs, bug fixes, quick tactical tasks, and fast-moving contracts.",
      maxWords: 150,
      sections: [
        "1. Scroll-Stopping Hook: Instantly isolate their exact technical pain point or performance bottleneck in the first sentence. Zero introductions, zero greetings.",
        "2. Tactical Execution: Explain exactly how you will kill the bug or engineer the fix in 2 punchy sentences. Name drop the exact mechanism (e.g., Supabase policy, Next.js API route modification).",
        "3. Hyper-Relevant Proof: Provide a single line of social proof or a live portfolio link that identically matches their exact problem space.",
        "4. Low-Friction CTA: End with a single, open-ended technical question that forces a reply without demanding a call commitment."
      ]
    },
    {
      name: "The Enterprise Deep-Dive",
      bestFor: "High-ticket projects ($5k+), complex full-stack SaaS builds, mobile ecosystems, and corporate clients.",
      maxWords: 400,
      sections: [
        "1. Strategic Hook: Address the macroscopic business outcome (e.g., scaling architecture, user data security, or conversion rates). Frame the project as patient-critical digital infrastructure, not a generic website or app.",
        "2. Structural Diagnosis: Ruthlessly break down the hidden risks, common pitfalls, or data leaks that generic agencies encounter in this specific niche. Show them you understand their system better than they do.",
        "3. Milestoned Architecture (The Roadmap): Divide the build into 3 high-velocity execution phases (e.g., Phase 1: Core Database & Auth Schema, Phase 2: High-Fidelity UI Engine, Phase 3: Edge Deployment & Optimization).",
        "4. Elite Tech Stack Mandate: Articulate exactly why the Next.js, TypeScript, Expo, and Supabase ecosystem is the only viable choice for their specific constraints—focusing on sub-second rendering, type-safety, and robust scalability.",
        "5. Case Study / Proof Metric: Drop a 2-sentence case study showcasing a similar enterprise-grade infrastructure you launched and its direct operational success.",
        "6. The No-Pressure Sync (CTA): Invite them to a value-packed, brief discovery sync to map out their user flow. Keep it completely low-pressure."
      ]
    },
    {
      name: "The Productized Pitch",
      bestFor: "Fixed-price predictable services, rapid MVPs, landing pages, or standardized component builds.",
      maxWords: 250,
      sections: [
        "1. Outcome-Driven Hook: Lead with the exact asset and ROI they will possess upon completion (e.g., 'A production-ready, lightning-fast landing page optimized to convert cold traffic into paid users').",
        "2. Scope Blueprint (What's Included): Bulleted list of hyper-specific deliverables. Never use vague terms like 'maintenance'—use definitive phrases like 'Production-ready GitHub repository with full TypeScript configuration'.",
        "3. High-Velocity Timeline: A transparent, phase-by-phase delivery schedule mapped out in days or weeks with clear engineering milestones.",
        "4. Frictionless Onboarding (Next Steps): A clear, step-by-step checklist telling the client exactly what credentials or assets are required to trigger the kickoff right now."
      ]
    }
  ]
};