import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Proposal from "@/lib/models/Proposal";
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // â”€â”€ 1. Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { clientId, rawConversation, projectTitle, budget } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required." }, { status: 400 });
    }

    // â”€â”€ 2. Fetch Agency Profile (complete branding) â”€â”€
    const { data: agencyRow } = await supabase
      .from("agency_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const agency = {
      name: agencyRow?.agency_name || "Our Agency",
      tagline: agencyRow?.tagline || "",
      email: agencyRow?.contact_email || "",
      website: agencyRow?.website_url || "",
      logo: agencyRow?.logo_url || "",
      phone: agencyRow?.phone || "",
      address: agencyRow?.address || "",
      primaryColor: agencyRow?.primary_color || "#0F172A",
      secondaryColor: agencyRow?.secondary_color || "#3B82F6",
      fontFamily: agencyRow?.font_family || "Inter",
      brandTone: agencyRow?.brand_tone || "Professional and Direct",
      coreSkills: agencyRow?.core_skills || [],
      techStack: agencyRow?.preferred_tech_stack || [],
      hourlyRate: agencyRow?.base_hourly_rate || 50,
      currency: agencyRow?.currency || "USD",
      timezone: agencyRow?.timezone || "Asia/Karachi",
    };

    // â”€â”€ 3. Fetch Client Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client profile not found." }, { status: 404 });
    }

    const clientInfo = {
      name: client.client_name || "Valued Client",
      company: client.company_name || "",
      email: client.email || "",
      industry: client.industry || "Technology",
      projectSummary: client.project_summary || "",
      deadline: client.deadline || "",
      budget: client.budget || 0,
      currency: client.currency || agency.currency,
    };

    const finalTitle = projectTitle || client.project_title || `Proposal for ${clientInfo.name}`;
    const finalBudget = budget || clientInfo.budget || 0;

    // â”€â”€ 4. Build AI System Instruction (100% agency driven) â”€â”€
    const systemInstruction = `You are the lead proposal writer for **${agency.name}**.

**YOUR IDENTITY**  
- Agency Name: ${agency.name}  
- Tagline: "${agency.tagline}"  
- Website: ${agency.website}  
- Contact Email: ${agency.email}  
- Phone: ${agency.phone || "N/A"}  
- Address: ${agency.address || "N/A"}  

**BRAND GUIDELINES**  
- Primary Color: ${agency.primaryColor}  
- Secondary Color: ${agency.secondaryColor}  
- Font: ${agency.fontFamily}  
- Writing Tone: ${agency.brandTone}  

**SERVICES & TECH STACK**  
- Core Services: ${agency.coreSkills?.join(", ") || "Custom Software Development"}  
- Preferred Tech Stack: ${agency.techStack?.join(", ") || "Modern Web Technologies"}  
- Hourly Rate: ${agency.currency} ${agency.hourlyRate}/hour  

**CLIENT DETAILS**  
- Client Name: ${clientInfo.name}  
- Company: ${clientInfo.company || "N/A"}  
- Industry: ${clientInfo.industry}  
- Project Title: ${finalTitle}  
- Budget: ${agency.currency} ${finalBudget}  
${clientInfo.projectSummary ? `- Client's Summary: ${clientInfo.projectSummary}` : ""}  
${clientInfo.deadline ? `- Deadline: ${clientInfo.deadline}` : ""}

**YOUR TASK**  
Generate a complete, winning proposal for this client. The proposal must feel like it was written by ${agency.name}, not by a generic AI.  
Use the agency's branding, tone, tech stack, and services naturally throughout.  

**CRITICAL OUTPUT FORMAT**  
Return ONLY a valid JSON object. No XML, no markdown fences, no extra text.

{
  "coverLetter": "...",
  "executiveSummary": "...",
  "problemStatement": "...",
  "proposedSolution": "...",
  "technicalArchitecture": "...",
  "projectTimeline": "...",
  "investmentPricing": "...",
  "termsConditions": "..."
}

**SECTION GUIDELINES**  
- coverLetter: Start with "Dear ${clientInfo.name}," and sign off as "${agency.name}". Mention the agency's website and email.  
- executiveSummary: Highlight the agency's unique strengths (skills, tech stack). Use the tagline if it fits.  
- problemStatement: Based on the client's industry and summary, identify 3-5 real challenges.  
- proposedSolution: Offer a solution that leverages ${agency.coreSkills?.slice(0,3).join(", ") || "the agency's expertise"}.  
- technicalArchitecture: Describe the stack using ${agency.techStack?.join(", ") || "modern tools"}.  
- projectTimeline: Provide a phased timeline with weeks (be realistic).  
- investmentPricing: Use the agency's hourly rate (${agency.currency} ${agency.hourlyRate}/hr) to justify the budget. Break down into items.  
- termsConditions: Include standard terms, payment schedules, and contact info (${agency.email}, ${agency.website}).  

**ABSOLUTE RULES**  
- NEVER use the word "GigThink" or any placeholder agency name. Always use "${agency.name}".  
- Write in ${agency.brandTone} tone.  
- Every section must reflect the agency's branding.  
- Output ONLY the JSON object.`;

    const userPrompt = `Write a full proposal for ${clientInfo.name} (${clientInfo.company || "Individual"}) regarding "${finalTitle}". 
Use all the agency details provided in the system prompt. The response must be pure JSON.`;

    // â”€â”€ 5. Call AI Orchestrator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const generatedContent = await generateAIResponse({
      userId: user.id,
      prompt: userPrompt,
      isProposal: true,
      isSectionGeneration: false,
      systemInstruction,
    });

    // â”€â”€ 6. Parse Response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let parsedSections: Record<string, string> = {};
    try {
      let jsonStr = generatedContent
        .replace(/```json|```/g, "")
        .replace(/<proposal_card>|<\/proposal_card>/gi, "")
        .trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedSections = JSON.parse(jsonMatch[0]);
      } else {
        parsedSections = parseXMLFallback(generatedContent);
      }
    } catch {
      parsedSections = parseXMLFallback(generatedContent);
    }

    // â”€â”€ 7. Build Sections Array â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const timestamp = Date.now();
    const sections = [
      buildSection("cover-letter", "Cover Letter", parsedSections.coverLetter, generateCoverLetter(agency, clientInfo, finalTitle), timestamp, 1),
      buildSection("executive-summary", "Executive Summary", parsedSections.executiveSummary, generateExecutiveSummary(agency, clientInfo, finalTitle), timestamp, 2),
      buildSection("problem-statement", "Problem Statement", parsedSections.problemStatement, null, timestamp, 3),
      buildSection("proposed-solution", "Proposed Solution", parsedSections.proposedSolution, null, timestamp, 4),
      buildSection("technical-architecture", "Technical Architecture", parsedSections.technicalArchitecture, null, timestamp, 5),
      buildSection("project-timeline", "Project Timeline", parsedSections.projectTimeline, null, timestamp, 6),
      buildSection("investment-pricing", "Investment & Pricing", parsedSections.investmentPricing, generatePricing(agency, finalBudget), timestamp, 7),
      buildSection("terms-conditions", "Terms & Conditions", parsedSections.termsConditions, generateTerms(agency, clientInfo), timestamp, 8),
    ];

    // â”€â”€ 8. Save to Database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let projectDoc;
    try {
      projectDoc = await Project.create({
        userId: user.id,
        title: finalTitle,
        clientName: clientInfo.name,
        clientId,
        status: "Draft",
        budget: finalBudget,
        description: rawConversation || clientInfo.projectSummary || "",
      });
    } catch (e) {
      console.warn("[PROJECT_CREATE_WARNING]", e);
      // continue even if project creation fails (rare)
    }

    const proposalDoc = await Proposal.create({
      userId: user.id,
      clientId,
      projectId: projectDoc?._id || undefined,
      title: finalTitle,
      status: "draft",
      version: 1,
      sections,
      metadata: {
        clientName: clientInfo.name,
        clientCompany: clientInfo.company,
        clientEmail: clientInfo.email,
        totalBudget: finalBudget,
        currency: agency.currency,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      template: "professional",
      isTemplate: false,
    });

    // â”€â”€ 9. Return Success â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    return NextResponse.json({
      success: true,
      message: `Branded proposal generated by ${agency.name}!`,
      proposalId: proposalDoc._id,
      proposal: {
        _id: proposalDoc._id,
        title: finalTitle,
        sections,
        agency: { name: agency.name, logo: agency.logo, email: agency.email },
        metadata: { clientName: clientInfo.name, clientCompany: clientInfo.company },
      },
    }, { status: 201 });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API_GENERATE_ROUTE_ERROR]:", message);
    const statusCode = message.includes("LIMIT_RESTRICTION") ? 429 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HELPERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function buildSection(
  type: string,
  title: string,
  content?: string,
  fallback?: string | null,
  ts?: number,
  order?: number
) {
  return {
    id: `section-${ts}-${order}`,
    type,
    title,
    content: content || fallback || "",
    order: order || 1,
    isCustom: false,
    isVisible: true,
    aiGenerated: !!content,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function generateCoverLetter(agency: any, client: any, title: string) {
  return `Dear ${client.name},

On behalf of ${agency.name}, I am pleased to submit this proposal for "${title}".

${agency.tagline ? `"${agency.tagline}"` : ""}

At ${agency.name}, we specialize in ${agency.coreSkills?.slice(0, 3).join(", ") || "custom software solutions"}. We have designed a tailored solution to meet your needs.

We look forward to collaborating with ${client.company || client.name}.

Warm regards,
${agency.name}
${agency.email} | ${agency.website}`;
}

function generateExecutiveSummary(agency: any, client: any, title: string) {
  return `${agency.name} is excited to propose a comprehensive ${title} for ${client.company || client.name}.

Leveraging our expertise in ${agency.coreSkills?.join(", ") || "modern development"} and a powerful tech stack (${agency.techStack?.join(", ") || "cutting-edge tools"}), we deliver scalable, high-performance solutions.

This proposal outlines our approach, timeline, and investment to achieve your goals.

Contact: ${agency.email} | ${agency.website}`;
}

function generatePricing(agency: any, budget: number) {
  return `Based on our standard rate of ${agency.currency} ${agency.hourlyRate}/hour, the total estimated investment for this project is ${agency.currency} ${budget || "TBD"}.

Payment Schedule:
â€¢ 30% â€“ Project initiation
â€¢ 30% â€“ Mid-project milestone
â€¢ 30% â€“ Pre-deployment
â€¢ 10% â€“ Post-launch

All amounts in ${agency.currency}. Valid for 30 days.`;
}

function generateTerms(agency: any, client: any) {
  return `1. Scope: As defined in this proposal document.
2. Timeline: Subject to agreed-upon scope; changes require written approval.
3. Payment: Invoices due within 15 days of receipt.
4. IP Rights: ${client.company || client.name} receives full ownership upon final payment.
5. Confidentiality: ${agency.name} will keep all client information strictly confidential.
6. Support: Complimentary 30-day post-launch bug fixing included.
7. Contact: ${agency.email} | ${agency.website}`;
}

function parseXMLFallback(xml: string): Record<string, string> {
  const tags = ["cover_letter", "executive_summary", "problem_statement", "solution_overview", "technical_architecture", "timeline", "investment", "terms"];
  const res: any = {};
  tags.forEach((tag) => {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
    const match = xml.match(regex);
    if (match) res[tag] = match[1].replace(/<[^>]+>/g, "").trim();
  });
  return res;
}