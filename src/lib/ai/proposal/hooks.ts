export interface HookExample {
  template: string;
  useCase: string;
}

export interface HookType {
  id: string;
  name: string;
  bestFor: string;
  psychology: string;
  conversionImpact: "High" | "Critical" | "Maximum";
  examples: HookExample[];
}

export interface ProposalHooksKnowledge {
  id: string;
  displayName: string;
  description: string;
  coreFrameworks: string[];
  bestPractices: string[];
  types: HookType[];
}

export const proposalHooks: ProposalHooksKnowledge = {
  id: "proposal_hooks_knowledge",
  displayName: "Conversion-Optimized Opening Hooks",
  description: "Psychologically engineered opening lines designed to disrupt the client's scrolling pattern and maximize proposal open rates.",
  coreFrameworks: ["AIDA (Attention)", "PAS (Problem-Agitate-Solve)", "Value-First Architecture"],
  
  bestPractices: [
    "Zero Ego: Never start with your name, title, or greetings like 'Respected Sir'. The client's UI already displays your identity.",
    "The 120-Character Rule: The core problem or value proposition must fit in the first 120 characters so it is fully visible in the job feed preview snippet.",
    "Client-Centric Pronouns: Ensure 'You' or 'Your' appears before the first comma. Eliminate 'I', 'Me', and 'My' from the opening line.",
    "Micro-Paragraphing: The hook must stand alone as a single, ultra-readable sentence or a maximum of 2 lines. Avoid text walls.",
    "Pattern Interruption: Start directly with a technical diagnostic or an undeniable business metric instead of generic fluff."
  ],

  types: [
    {
      id: "the_technical_surgeon",
      name: "The Problem Solver (Direct Diagnostic)",
      bestFor: "Clients facing concrete bottlenecks, specific bugs, crashes, or well-defined scope definitions.",
      psychology: "Establishes instant authority by validating that you have diagnosed their exact technical pain point while others sent copy-pasted templates.",
      conversionImpact: "Critical",
      examples: [
        {
          template: "Your Next.js site's layout shifts during data fetching can be fixed immediately by implementing structured loading states and optimizing your SSR caching strategy.",
          useCase: "Performance & Hydration Issues"
        },
        {
          template: "I reviewed the checkout crash description you posted. This usually happens when the Stripe webhook state mismatches with the database pool—I can resolve this for you today.",
          useCase: "E-commerce & Webhook Failures"
        },
        {
          template: "That React Native/Expo push notification sync issue you're experiencing is a known lifecycle bug; we can bypass it cleanly using a custom background task listener.",
          useCase: "Mobile App App-State Bottlenecks"
        }
      ]
    },
    {
      id: "the_value_first_audit",
      name: "The ROI/Performance Auditor",
      bestFor: "High-ticket enterprise clients, existing legacy platforms, or businesses looking to scale conversions.",
      psychology: "Demonstrates proactive investment. By giving away a free, high-value technical audit immediately, you trigger the law of reciprocity.",
      conversionImpact: "Maximum",
      examples: [
        {
          template: "I just ran a quick diagnostic on your production web app and noticed that unoptimized database queries are adding an extra 2.4s to your mobile page load time.",
          useCase: "Speed & SEO Optimization"
        },
        {
          template: "Your user onboarding flow currently requires 3 redundant steps that are likely causing a high drop-off rate. Here is how we can streamline it into a single secure session flow:",
          useCase: "UX/UI Conversion Optimization"
        }
      ]
    },
    {
      id: "the_case_study_match",
      name: "The Portfolio Mirror",
      bestFor: "Clients looking for niche expertise, specific SaaS features, or proven industry blueprints.",
      psychology: "Eliminates risk perception immediately. It proves you have already climbed the exact mountain they are standing at.",
      conversionImpact: "High",
      examples: [
        {
          template: "Your architectural layout for this real-time dashboard matches a secure Supabase multi-tenant platform I deployed last month. Here is the live production link to see how it handles lazy loading:",
          useCase: "Direct Functional Match"
        },
        {
          template: "I just finished shipping a high-performance offline-first app that utilizes the exact native layout sync you described. Here is how we handled the local database reconciliation:",
          useCase: "Advanced Feature Copycat"
        }
      ]
    },
    {
      id: "the_discovery_challenger",
      name: "The Architectural Challenger",
      bestFor: "Sophisticated clients, founders, or product managers who value senior-level consulting over code monkeys.",
      psychology: "Positions you as a strategic partner rather than an execution asset. It shows you think deeply about their business logic and scalability.",
      conversionImpact: "Maximum",
      examples: [
        {
          template: "While reviewing your backend stack requirements, opting for a traditional relational database might limit your app's horizontal scaling. Have you considered a distributed edge infrastructure for faster global state lookups?",
          useCase: "Consultative Strategy & System Design"
        }
      ]
    }
  ]
};