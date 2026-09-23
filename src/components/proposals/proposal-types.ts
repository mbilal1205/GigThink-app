export interface FeatureItem {
  moduleName: string;
  description: string;
}

export interface TimelineItem {
  phase: string;
  duration: string;
  deliverables: string[];
}

export interface BreakdownItem {
  item: string;
  cost: number;
}

export interface CustomBlock {
  id: string;
  title: string;
  content: string;
}

export interface ProposalContent {
  executiveSummary?: string;
  problemStatement?: string;
  solutionOverview?: string;
  features?: FeatureItem[];
  techStack?: string[];
  timeline?: TimelineItem[];
  investment?: {
    totalCost: number;
    currency: string;
    breakdown?: BreakdownItem[];
  };
  clientName?: string;
  projectTitle?: string;
  customSections?: CustomBlock[];
}

export type InsertTarget =
  | "executiveSummary"
  | "problemStatement"
  | "solutionOverview"
  | "customSection";