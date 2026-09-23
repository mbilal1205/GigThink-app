import { IProposalSection } from "@/lib/models/Proposal";

export interface DefaultSection {
  type: string;
  title: string;
  icon: string;
  description: string;
  defaultContent: string;
}

export const PROFESSIONAL_SECTIONS: DefaultSection[] = [
  {
    type: "cover-letter",
    title: "Cover Letter",
    icon: "ðŸ“‹",
    description: "Personalized introduction letter",
    defaultContent: `Dear {ClientName},

We are pleased to submit this comprehensive proposal for {ProjectTitle}. At GigThink, we understand the importance of delivering high-quality, scalable software solutions that drive business growth.

Our team of experienced developers and architects has carefully analyzed your requirements and designed a solution that will exceed your expectations.

We look forward to the opportunity to work with you.

Best regards,
GigThink Team`,
  },
  {
    type: "executive-summary",
    title: "Executive Summary",
    icon: "ðŸ“Š",
    description: "High-level project overview",
    defaultContent: `This proposal outlines our approach to delivering {ProjectTitle} for {ClientName}. 

Our solution leverages cutting-edge technologies including Next.js, TypeScript, and PostgreSQL to create a robust, scalable platform.

Key Benefits:
â€¢ Enhanced operational efficiency
â€¢ Scalable architecture for future growth
â€¢ Modern, intuitive user interface
â€¢ Comprehensive security measures
â€¢ 24/7 technical support`,
  },
  {
    type: "problem-statement",
    title: "Problem Statement",
    icon: "âš ï¸",
    description: "Current challenges and pain points",
    defaultContent: `After thorough analysis of your current workflows, we have identified the following challenges:

1. Manual processes causing operational inefficiencies
2. Lack of centralized data management
3. Limited scalability in current systems
4. Security vulnerabilities in existing infrastructure
5. Poor user experience affecting productivity

These challenges are impacting your business growth and need immediate attention.`,
  },
  {
    type: "proposed-solution",
    title: "Proposed Solution",
    icon: "ðŸ’¡",
    description: "Our recommended approach",
    defaultContent: `Our proposed solution addresses all identified challenges through:

1. Custom Web Application Development
   - Modern React/Next.js frontend
   - Robust Node.js backend
   - PostgreSQL database

2. Cloud Infrastructure
   - AWS/Google Cloud deployment
   - Auto-scaling capabilities
   - 99.9% uptime guarantee

3. Security Implementation
   - End-to-end encryption
   - Role-based access control
   - Regular security audits`,
  },
  {
    type: "technical-architecture",
    title: "Technical Architecture",
    icon: "ðŸ—ï¸",
    description: "Technology stack and architecture",
    defaultContent: `Technology Stack:

Frontend:
â€¢ Next.js 14 with App Router
â€¢ TypeScript for type safety
â€¢ Tailwind CSS for styling
â€¢ Shadcn UI components

Backend:
â€¢ Node.js with Express
â€¢ RESTful API design
â€¢ GraphQL for complex queries

Database:
â€¢ PostgreSQL (Primary)
â€¢ Redis (Caching)
â€¢ MongoDB (Logs & Analytics)

Infrastructure:
â€¢ Vercel/Netlify (Frontend)
â€¢ AWS EC2 (Backend)
â€¢ Docker containers
â€¢ CI/CD with GitHub Actions`,
  },
  {
    type: "project-timeline",
    title: "Project Timeline",
    icon: "ðŸ“…",
    description: "Milestones and deliverables",
    defaultContent: `Phase 1: Discovery & Planning (Week 1-2)
â€¢ Requirements gathering
â€¢ Technical architecture design
â€¢ UI/UX wireframes

Phase 2: Development (Week 3-6)
â€¢ Frontend development
â€¢ Backend API development
â€¢ Database setup

Phase 3: Testing (Week 7-8)
â€¢ Unit testing
â€¢ Integration testing
â€¢ User acceptance testing

Phase 4: Deployment (Week 9)
â€¢ Production deployment
â€¢ Performance optimization
â€¢ Documentation

Phase 5: Support (Week 10-12)
â€¢ Bug fixes
â€¢ Performance monitoring
â€¢ Team training`,
  },
  {
    type: "investment-pricing",
    title: "Investment & Pricing",
    icon: "ðŸ’°",
    description: "Budget breakdown and costs",
    defaultContent: `Total Investment: $XX,XXX

Breakdown:
â€¢ Design & Architecture: $X,XXX
â€¢ Frontend Development: $X,XXX
â€¢ Backend Development: $X,XXX
â€¢ Testing & QA: $X,XXX
â€¢ Deployment: $X,XXX
â€¢ 3 Months Support: $X,XXX

Payment Terms:
â€¢ 30% - Project Initiation
â€¢ 30% - Mid-development
â€¢ 30% - Pre-deployment
â€¢ 10% - Post-launch

All prices in USD. Valid for 30 days.`,
  },
  {
    type: "terms-conditions",
    title: "Terms & Conditions",
    icon: "ðŸ“œ",
    description: "Legal terms and agreements",
    defaultContent: `1. Project Scope
   Any changes to scope will require mutual agreement

2. Timeline
   Timelines are estimates and subject to change

3. Payment
   Invoices payable within 15 days

4. Intellectual Property
   Client owns final deliverables upon full payment

5. Confidentiality
   Both parties agree to maintain confidentiality

6. Support
   3 months free support included

7. Termination
   30 days notice required`,
  },
];

export function createDefaultSections(clientName: string, projectTitle: string): IProposalSection[] {
  return PROFESSIONAL_SECTIONS.map((section, index) => ({
    id: `section-${Date.now()}-${index}`,
    type: section.type,
    title: section.title,
    content: section.defaultContent
      .replace(/{ClientName}/g, clientName)
      .replace(/{ProjectTitle}/g, projectTitle),
    order: index + 1,
    isCustom: false,
    isVisible: true,
    aiGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}