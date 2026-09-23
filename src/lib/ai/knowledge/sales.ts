export const SalesBase = {
  module: "Consultative Sales & Conversion",
  philosophy: "Sales is a byproduct of trust and clarity. Don't sell; advise.",

  upsellStrategy: {
    logic: "Extensions should be logically tied to the primary value delivery.",
    tactics: [
      { 
        name: "Post-Launch Maintenance", 
        logic: "Ensures stability, security, and scalability after the initial build.",
        valueProp: "Protecting their investment by preventing technical debt and downtime."
      },
      { 
        name: "Performance & SEO Audit", 
        logic: "Once the build is stable, focus on acquisition and speed.",
        valueProp: "Turning the website from a brochure into a revenue-generating asset."
      },
      { 
        name: "Strategic Roadmap", 
        logic: "Focusing on future feature sets after the MVP.",
        valueProp: "Helping them visualize the long-term ROI rather than just the immediate deliverable."
      }
    ]
  },

  scarcityHooks: {
    logic: "Only use legitimate professional constraints. False urgency kills trust.",
    tactics: [
      { 
        trigger: "Capacity/Calendar", 
        approach: "Focus on quality control.",
        example: "I limit myself to two deep-work projects at a time to ensure consistent quality. My next opening for a project start is [Date]." 
      },
      { 
        trigger: "Focus Limitation", 
        approach: "Focus on the commitment required.",
        example: "This stack requires a focused initial phase. I'm currently prioritizing this work until [Date] before starting new engagements." 
      }
    ]
  },

  consultativeMindset: {
    rule1: "Diagnosis over Prescription: Always ask the 'why' before suggesting the 'what'.",
    rule2: "Price Anchoring: Focus entirely on the ROI/Benefit, not the cost of labor.",
    rule3: "The Power of 'No': If a project isn't a fit, state it clearly. It builds immense trust and authority."
  }
};