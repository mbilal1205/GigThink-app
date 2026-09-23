import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Proposal from "@/lib/models/Proposal";
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";

export const maxDuration = 60;

// â”€â”€â”€â”€â”€â”€ Types for helper functions â”€â”€â”€â”€â”€â”€
interface Agency {
  name: string;
  tagline: string;
  email: string;
  website: string;
  logo: string;
  phone: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  brandTone: string;
  coreSkills: string[];
  techStack: string[];
  hourlyRate: number;
  currency: string;
  timezone: string;
}

interface ClientInfo {
  name: string;
  company: string;
  email: string;
  industry: string;
  projectSummary: string;
  deadline: string;
  budget: number;
  currency: string;
}

export async function POST(req: Request) {
  try {
    // â”€â”€ 1. Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { opportunityId } = await req.json();
    if (!opportunityId) {
      return NextResponse.json({ error: "Missing opportunityId" }, { status: 400 });
    }

    // â”€â”€ 2. Fetch Opportunity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { data: opp, error: oppError } = await supabaseAdmin
      .from("opportunities")
      .select("*")
      .eq("id", opportunityId)
      .single();

    if (oppError || !opp) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // â”€â”€ 3. Ensure Client Record â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let clientId: string | null = null;
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .ilike("company_name", opp.company || "")
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: createError } = await supabaseAdmin
        .from("clients")
        .insert({
          user_id: user.id,
          client_name: opp.company || "Unknown Client",
          company_name: opp.company || "",
          project_title: opp.title || "Untitled Project",
          budget: opp.budget_max || opp.budget_min || 0,
        })
        .select("id")
        .single();

      if (createError) {
        console.error("Failed to create client:", createError);
        return NextResponse.json({ error: "Could not create client record" }, { status: 500 });
      }
      clientId = newClient.id;
    }

    // â”€â”€ 4. Fetch Agency Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { data: agencyRow } = await supabase
      .from("agency_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const agency: Agency = {
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

    // â”€â”€ 5. Fetch Client Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const { data: clientRecord } = await supabaseAdmin
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    const clientInfo: ClientInfo = {
      name: clientRecord?.client_name || opp.company || "Valued Client",
      company: clientRecord?.company_name || opp.company || "",
      email: clientRecord?.email || "",
      industry: clientRecord?.industry || opp.industry || "Technology",
      projectSummary: clientRecord?.project_summary || opp.description?.substring(0, 200) || "",
      deadline: clientRecord?.deadline || "",
      budget: clientRecord?.budget || opp.budget_max || opp.budget_min || 0,
      currency: clientRecord?.currency || agency.currency,
    };

    const finalTitle = opp.title || `Proposal for ${clientInfo.name}`;
    const finalBudget = clientInfo.budget;

    // â”€â”€ 6. Build AI System Instruction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const systemInstruction = `You are the lead proposal writer for **${agency.name}**.

**YOUR IDENTITY**  
- Agency Name: ${agency.name}  
- Tagline: "${agency.tagline}"  
- Website: ${agency.website}  
- Contact Email: ${agency.email}  

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
${opp.description ? `- Opportunity Description: ${opp.description}` : ""}

**YOUR TASK**  
Generate a complete, winning proposal. Use the agency's branding, tone, tech stack.

**CRITICAL OUTPUT FORMAT**  
Return ONLY a valid JSON object:
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
Write every section professionally.`;

    const userPrompt = `Write a full proposal for ${clientInfo.name} (${clientInfo.company || "Individual"}) regarding "${finalTitle}". Use the opportunity description for context. The response must be pure JSON.`;

    // â”€â”€ 7. Call AI Orchestrator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    await connectToDatabase();
    const generatedContent = await generateAIResponse({
      userId: user.id,
      prompt: userPrompt,
      isProposal: true,
      isSectionGeneration: false,
      systemInstruction,
    });

    // â”€â”€ 8. Parse Response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let parsedSections: Record<string, string> = {};
    try {
      let jsonStr = generatedContent
        .replace(/```json|```/g, "")
        .replace(/<proposal_card>|<\/proposal_card>/gi, "")
        .trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedSections = JSON.parse(jsonMatch[0]);
      }
    } catch (parseErr) {
      console.warn("JSON parse failed, using fallback");
    }

    // â”€â”€ 9. Build Sections Array â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // â”€â”€ 10. Save Project & Proposal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    let projectDoc;
    try {
      projectDoc = await Project.create({
        userId: user.id,
        title: finalTitle,
        clientName: clientInfo.name,
        clientId,
        status: "Draft",
        budget: finalBudget,
        description: opp.description || "",
      });
    } catch (e) {
      console.warn("Project creation skipped:", e);
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
      shareId: undefined,  // âœ… FIX: prevents duplicate key on sparse unique index
    });

    return NextResponse.json({
      success: true,
      message: `Branded proposal generated by ${agency.name}!`,
      proposalId: proposalDoc._id.toString(),
      projectId: projectDoc?._id?.toString() || null,
    }, { status: 201 });

  } catch (err: unknown) {
    let message = err instanceof Error ? err.message : "Internal Server Error";
    if (message.includes("LIMIT_RESTRICTION")) {
      message = "LIMIT_RESTRICTION: Your free trial period has expired. Please upgrade your plan.";
    }
    console.error("[GENERATE_PROPOSAL_FROM_OPP_ERROR]:", message);
    const statusCode = message.includes("LIMIT_RESTRICTION") ? 429 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FULLY TYPED HELPERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function buildSection(
  type: string,
  title: string,
  content: string | undefined,
  fallback: string | null,
  ts: number,
  order: number
) {
  return {
    id: `section-${ts}-${order}`,
    type,
    title,
    content: content || fallback || "",
    order,
    isCustom: false,
    isVisible: true,
    aiGenerated: !!content,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function generateCoverLetter(agency: Agency, client: ClientInfo, title: string): string {
  return `Dear ${client.name},

On behalf of ${agency.name}, I am pleased to submit this proposal for "${title}".

${agency.tagline ? `"${agency.tagline}"` : ""}

At ${agency.name}, we specialize in ${agency.coreSkills?.slice(0, 3).join(", ") || "custom software solutions"}. We have designed a tailored solution to meet your needs.

Warm regards,
${agency.name}
${agency.email} | ${agency.website}`;
}

function generateExecutiveSummary(agency: Agency, client: ClientInfo, title: string): string {
  return `${agency.name} is excited to propose a comprehensive ${title} for ${client.company || client.name}.

Leveraging our expertise in ${agency.coreSkills?.join(", ") || "modern development"} and a powerful tech stack (${agency.techStack?.join(", ") || "cutting-edge tools"}), we deliver scalable, high-performance solutions.

Contact: ${agency.email} | ${agency.website}`;
}

function generatePricing(agency: Agency, budget: number): string {
  return `Based on our standard rate of ${agency.currency} ${agency.hourlyRate}/hour, the total estimated investment is ${agency.currency} ${budget || "TBD"}.

Payment Schedule:
â€¢ 30% â€“ Project initiation
â€¢ 30% â€“ Mid-project milestone
â€¢ 30% â€“ Pre-deployment
â€¢ 10% â€“ Post-launch

All amounts in ${agency.currency}. Valid for 30 days.`;
}

function generateTerms(agency: Agency, client: ClientInfo): string {
  return `1. Scope: As defined in this proposal document.
2. Timeline: Subject to agreed-upon scope; changes require written approval.
3. Payment: Invoices due within 15 days of receipt.
4. IP Rights: ${client.company || client.name} receives full ownership upon final payment.
5. Confidentiality: ${agency.name} will keep all client information strictly confidential.
6. Support: Complimentary 30-day post-launch bug fixing included.
7. Contact: ${agency.email} | ${agency.website}`;
}