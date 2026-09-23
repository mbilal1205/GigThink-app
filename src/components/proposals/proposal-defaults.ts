import type {
  ProposalContent,
  BreakdownItem,
  CustomBlock,
  FeatureItem,
  TimelineItem,
} from "@/components/proposals/proposal-types";

export const createProfessionalProposal = (
  base: Partial<ProposalContent> = {}
): ProposalContent => {
  const projectTitle = base.projectTitle || "Enterprise Software Solution Proposal";
  const clientName = base.clientName || "Valued Client";

  return {
    executiveSummary:
      base.executiveSummary ||
      `We are pleased to present this professional proposal for ${clientName}. Our objective is to engineer a robust digital solution optimized for scale, efficiency, and business growth.`,
    
    problemStatement:
      base.problemStatement ||
      `Current operational workflows for ${clientName} present friction points, manual overheads, and potential scaling bottlenecks that require a centralized system.`,
    
    solutionOverview:
      base.solutionOverview ||
      `Our engineering team will deliver a secure, modular product built on cutting-edge industry standards (Next.js, TypeScript, PostgreSQL) ensuring high performance.`,
    
    features: base.features?.length
      ? base.features
      : [
          {
            moduleName: "Admin & User Dashboard",
            description:
              "Centralized control panel with role-based access control.",
          },
          {
            moduleName: "Secure Authentication & API Integration",
            description: "Encrypted sessions and robust third-party sync.",
          },
        ],
    
    techStack: base.techStack?.length
      ? base.techStack
      : ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Node.js"],
    
    timeline: base.timeline?.length
      ? base.timeline
      : [
          {
            phase: "Milestone 1: UI/UX & Architecture",
            duration: "1-2 Weeks",
            deliverables: ["Wireframes", "Database Schema"],
          },
          {
            phase: "Milestone 2: Core Development",
            duration: "3-5 Weeks",
            deliverables: ["Backend APIs", "Frontend Build"],
          },
          {
            phase: "Milestone 3: QA & Deployment",
            duration: "1 Week",
            deliverables: ["Testing", "Production Launch"],
          },
        ],
    
    investment: {
      totalCost: base.investment?.totalCost || 55000,
      currency: base.investment?.currency || "USD",
      breakdown: base.investment?.breakdown || [
        { item: "Design & Architecture", cost: 12000 },
        { item: "Core Development", cost: 33000 },
        { item: "Testing & Deployment", cost: 10000 },
      ],
    },
    
    clientName,
    projectTitle,
    
    customSections: base.customSections?.length
      ? base.customSections
      : [
          {
            id: `custom-${Date.now()}`,
            title: "Support & Maintenance",
            content:
              "We offer 3 months of free post-launch bug fixes, performance monitoring, and dedicated server support.",
          },
        ],
  };
};