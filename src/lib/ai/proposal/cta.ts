export const proposalCTA = {
  id: "cta",
  description: "The strategic closing mechanism designed to establish authority, minimize friction, and seamlessly transition the prospect into the discovery phase.",
  bestPractices: [
    "Eliminate passive or submissive phrasing (e.g., 'Waiting for your reply'). High-end clients respect peer-level authority, not desperation.",
    "Focus on micro-commitments. Shift the immediate goal from 'getting hired' to 'unlocking the next logical step' in the process.",
    "Lower the barrier to entry. Frame the next interaction as a brief, high-value alignment or diagnostic session rather than a formal meeting.",
    "Maintain a consultative posture. Speak as a strategic partner who is diagnosing a problem, not a vendor chasing a contract."
  ],
  types: [
    {
      name: "The Consultative Alignment (Soft CTA)",
      psychology: "Positions the provider as a strategic advisor. Invites collaboration by addressing a critical architectural or operational decision the client cares about.",
      examples: [
        "To ensure optimal data infrastructure, do you have an internal preference for the database layer, or should we model a bespoke scalable solution for this phase?",
        "I noticed a potential user-flow bottleneck in the current discovery phase layout. Are you open to a brief exchange to review how we can optimize this before finalizing the roadmap?"
      ]
    },
    {
      name: "The Prescriptive Schedule (Authoritative CTA)",
      psychology: "Takes control of the process. It appeals directly to busy enterprise executives who value decisive experts who can lead the project timeline.",
      examples: [
        "To properly align on the engineering milestones, I have reserved time this Thursday for a focused 15-minute synchronization. Does 2:00 PM or 4:00 PM EST align with your team's calendar?",
        "If this strategic approach aligns with your operational goals, let's schedule a concise technical breakdown call to finalize the scope of work."
      ]
    },
    {
      name: "The High-Value Deliverable Teaser (Value-First CTA)",
      psychology: "Leverages professional curiosity and reciprocity by demonstrating immediate value-add and proactive problem-solving before any formal commitment is made.",
      examples: [
        "I've put together a preliminary architecture wireframe addressing the real-time data sync challenge you mentioned. Let me know if you would like me to share the access link.",
        "I recorded a quick 90-second video audit explaining our exact technical implementation strategy for your API integrations. Would you like me to drop the link over?"
      ]
    }
  ]
};