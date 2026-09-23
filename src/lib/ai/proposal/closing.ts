export interface ClosingStyle {
  type: "Modern Professional" | "Action-Oriented" | "Warm & Collaborative" | "Banned Sign-offs (Do Not Use)";
  examples: string[];
}

export interface ProposalClosing {
  id: string;
  description: string;
  styles: ClosingStyle[];
}

export const proposalClosing: ProposalClosing = {
  id: "closing",
  description: "The final sign-off words before the sender's name.",
  styles: [
    {
      type: "Modern Professional",
      examples: [
        "Best regards,",
        "Kind regards,",
        "Best,",
        "With respect,",
        "Speak soon,"
      ]
    },
    {
      type: "Action-Oriented",
      examples: [
        "Looking forward to diving into this,",
        "Ready when you are,",
        "Excited to get started,",
        "Let's make this happen,",
        "Looking forward to our next steps,"
      ]
    },
    {
      type: "Warm & Collaborative", // Added a new highly effective style for modern proposals
      examples: [
        "Cheers,",
        "Excited to build this together,",
        "Wishing you the best,",
        "Thanks for the opportunity,"
      ]
    },
    {
      type: "Banned Sign-offs (Do Not Use)",
      examples: [
        "Yours faithfully,",
        "Yours sincerely,",
        "Thanks and regards,", // Too generic/robotic
        "Awaiting your swift reply,", // Sounds pushy/old-school
        "Sent from my iPhone," // Classic unprofessional mistake
      ]
    }
  ]
};