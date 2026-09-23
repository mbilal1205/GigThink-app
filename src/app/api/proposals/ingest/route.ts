// import { NextRequest, NextResponse } from "next/server";
// import { createSupabaseServerClient } from "@/utils/supabase/server";
// import { connectToDatabase } from "@/lib/db/mongodb";
// import Proposal from "@/lib/models/Proposal";

// // GET - Fetch all proposals (with optional clientId filter)
// export async function GET(req: NextRequest) {
//   try {
//     const supabase = await createSupabaseServerClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     await connectToDatabase();

//     const { searchParams } = new URL(req.url);
//     const clientId = searchParams.get("clientId");
//     const status = searchParams.get("status");
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const skip = (page - 1) * limit;

//     // Build query
//     const query: any = { userId: user.id };

//     if (clientId) {
//       query.clientId = clientId;
//     }

//     if (status) {
//       query.status = status;
//     }

//     // Fetch proposals with pagination
//     const [proposals, total] = await Promise.all([
//       Proposal.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .select(
//           "_id title clientId status version sections metadata createdAt updatedAt"
//         )
//         .lean(),
//       Proposal.countDocuments(query),
//     ]);

//     // Serialize proposals
//     const serializedProposals = proposals.map((p: any) => ({
//       _id: p._id.toString(),
//       title: p.title || "Untitled Proposal",
//       clientId: p.clientId,
//       status: p.status || "draft",
//       version: p.version || 1,
//       sectionsCount: p.sections?.length || 0,
//       clientName: p.metadata?.clientName || "Unknown Client",
//       clientCompany: p.metadata?.clientCompany || "",
//       totalBudget: p.metadata?.totalBudget || 0,
//       currency: p.metadata?.currency || "USD",
//       createdAt: p.createdAt,
//       updatedAt: p.updatedAt,
//       preview: getPreview(p.sections),
//     }));

//     return NextResponse.json({
//       success: true,
//       proposals: serializedProposals,
//       pagination: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//         hasMore: skip + proposals.length < total,
//       },
//     });
//   } catch (error: any) {
//     console.error("[GET_PROPOSALS_ERROR]:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to fetch proposals" },
//       { status: 500 }
//     );
//   }
// }

// // POST - Create new proposal
// export async function POST(req: NextRequest) {
//   try {
//     const supabase = await createSupabaseServerClient();
//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     await connectToDatabase();

//     const body = await req.json();
//     const { clientId, projectTitle, clientName, clientCompany, clientEmail, budget } = body;

//     if (!clientId || !clientName) {
//       return NextResponse.json(
//         { error: "Client ID and name are required" },
//         { status: 400 }
//       );
//     }

//     const timestamp = Date.now();
//     const sections = getDefaultSections(clientName, projectTitle || "New Project", timestamp); // âš¡ FIXED: No space

//     const proposal = await Proposal.create({
//       userId: user.id,
//       clientId,
//       title: projectTitle || `Proposal for ${clientName}`,
//       status: "draft",
//       version: 1,
//       sections,
//       metadata: {
//         clientName,
//         clientCompany: clientCompany || "",
//         clientEmail: clientEmail || "",
//         totalBudget: budget || 0,
//         currency: "USD",
//         validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//       template: "professional",
//       isTemplate: false,
//     });

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Proposal created successfully!",
//         proposal: {
//           _id: proposal._id.toString(),
//           title: proposal.title,
//           clientId: proposal.clientId,
//           status: proposal.status,
//         },
//       },
//       { status: 201 }
//     );
//   } catch (error: any) {
//     console.error("[CREATE_PROPOSAL_ERROR]:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// // HELPER FUNCTIONS
// // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// /**
//  * Get preview text from proposal sections
//  */
// function getPreview(sections: any[]): string {
//   if (!sections || !Array.isArray(sections)) return "";

//   const execSection = sections.find(
//     (s: any) => s.type === "executive-summary" && s.isVisible
//   );

//   if (execSection?.content) {
//     // Clean HTML tags and truncate
//     const clean = execSection.content
//       .replace(/<[^>]*>/g, "")
//       .replace(/\n/g, " ")
//       .trim();
//     return clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
//   }

//   return "No preview available";
// }

// /**
//  * Create default sections for a new proposal
//  */
// function getDefaultSections(
//   clientName: string,
//   projectTitle: string,
//   timestamp: number
// ) {
//   return [
//     {
//       id: `section-${timestamp}-0`,
//       type: "cover-letter",
//       title: "Cover Letter",
//       content: `Dear ${clientName},\n\nWe are pleased to submit this comprehensive proposal for ${projectTitle}. Our team at GigThink has carefully analyzed your requirements and designed a solution that will exceed your expectations.`,
//       order: 1,
//       isCustom: false,
//       isVisible: true,
//       aiGenerated: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: `section-${timestamp}-1`,
//       type: "executive-summary",
//       title: "Executive Summary",
//       content: `This proposal outlines our comprehensive approach to delivering ${projectTitle} for ${clientName}.\n\nOur solution leverages cutting-edge technologies including Next.js, TypeScript, and PostgreSQL to create a robust, scalable platform that drives business growth and operational efficiency.`,
//       order: 2,
//       isCustom: false,
//       isVisible: true,
//       aiGenerated: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: `section-${timestamp}-2`,
//       type: "problem-statement",
//       title: "Problem Statement",
//       content: "After thorough analysis of your current workflows, we have identified key challenges that need to be addressed:\n\nâ€¢ Challenge 1: Operational inefficiencies\nâ€¢ Challenge 2: Data management issues\nâ€¢ Challenge 3: Scalability limitations\nâ€¢ Challenge 4: Security concerns",
//       order: 3,
//       isCustom: false,
//       isVisible: true,
//       aiGenerated: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: `section-${timestamp}-3`,
//       type: "proposed-solution",
//       title: "Proposed Solution",
//       content: "Our solution addresses all identified challenges through a comprehensive digital transformation strategy:\n\n1. Custom Web Application Development\n2. Cloud Infrastructure Setup\n3. Security Implementation\n4. Data Migration & Integration",
//       order: 4,
//       isCustom: false,
//       isVisible: true,
//       aiGenerated: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: `section-${timestamp}-4`,
//       type: "technical-architecture",
//       title: "Technical Architecture",
//       content: "Technology Stack:\n\nFrontend: Next.js 14, TypeScript, Tailwind CSS\nBackend: Node.js, Express, REST APIs\nDatabase: PostgreSQL, Redis\nInfrastructure: Cloud deployment, Docker, CI/CD",
//       order: 5,
//       isCustom: false,
//       isVisible: true,
//       aiGenerated: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: `section-${timestamp}-5`,
//       type: "project-timeline",
//       title: "Project Timeline",
//       content: "Phase 1: Discovery & Planning (Week 1-2)\nPhase 2: Development (Week 3-6)\nPhase 3: Testing & QA (Week 7-8)\nPhase 4: Deployment (Week 9)\nPhase 5: Support (Week 10-12)",
//       order: 6,
//       isCustom: false,
//       isVisible: true,
//       aiGenerated: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: `section-${timestamp}-6`,
//       type: "investment-pricing",
//       title: "Investment & Pricing",
//       content: "Total investment details will be customized based on project scope.\n\nPayment Terms:\nâ€¢ 30% - Project Initiation\nâ€¢ 30% - Mid-development\nâ€¢ 30% - Pre-deployment\nâ€¢ 10% - Post-launch",
//       order: 7,
//       isCustom: false,
//       isVisible: true,
//       aiGenerated: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//     {
//       id: `section-${timestamp}-7`,
//       type: "terms-conditions",
//       title: "Terms & Conditions",
//       content: "1. Project Scope: Changes require mutual agreement\n2. Timeline: Estimates subject to scope\n3. Payment: Invoices payable within 15 days\n4. Intellectual Property: Client owns deliverables upon full payment\n5. Confidentiality: Both parties maintain confidentiality\n6. Support: 3 months free support included",
//       order: 8,
//       isCustom: false,
//       isVisible: true,
//       aiGenerated: false,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//   ];
// }










import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const query: any = { userId: user.id };
    if (status && status !== "all") {
      query.status = status;
    }

    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .select("_id title clientName clientId status budget description createdAt updatedAt")
      .lean();

    return NextResponse.json({
      success: true,
      projects: projects.map((p: any) => ({
        ...p,
        _id: p._id.toString(),
      })),
    });
  } catch (error: any) {
    console.error("[GET_PROJECTS_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}