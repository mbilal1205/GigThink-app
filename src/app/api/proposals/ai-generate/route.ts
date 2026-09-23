import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    // 1. Auth
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    // 2. Parse Payload
    const body = await req.json();
    const { prompt, target, projectTitle, clientName, currentContent, clientId } = body;

    if (!target) {
      return NextResponse.json({ error: "Target section is required." }, { status: 400 });
    }

    // 3. Fetch Agency Profile
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

    // 4. Optional: fetch client info from DB if clientId is provided
    let clientInfo = {
      name: clientName || "Valued Client",
      company: "",
      industry: "Technology",
      budget: 0,
      deadline: "",
    };
    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("client_name, company_name, industry, budget, deadline")
        .eq("id", clientId)
        .eq("user_id", user.id)
        .single();
      if (client) {
        clientInfo.name = client.client_name || clientInfo.name;
        clientInfo.company = client.company_name || "";
        clientInfo.industry = client.industry || "Technology";
        clientInfo.budget = client.budget || 0;
        clientInfo.deadline = client.deadline || "";
      }
    }

    // 5. Section-Specific Configs (now branded)
    const sectionConfigs: Record<
      string,
      {
        systemInstruction: string;
        userPrompt: string;
      }
    > = {
      "cover-letter": {
        systemInstruction: `You are a proposal writer for **${agency.name}**. Write ONLY a Cover Letter for the client. Start with "Dear ${clientInfo.name}," and sign off as "${agency.name}". Mention our website ${agency.website} and email ${agency.email}. Keep the tone ${agency.brandTone}. Do NOT include any other sections. No XML. No HTML.`,

        userPrompt: `Write a cover letter for ${clientInfo.name} (${clientInfo.company || "Individual"}) regarding "${projectTitle || 'Project'}". Use agency tagline: "${agency.tagline}". Focus on ${agency.coreSkills?.slice(0, 3).join(", ") || "our expertise"}.` +
          (currentContent ? `\nCurrent content to improve:\n${currentContent}` : ""),
      },

      "executive-summary": {
        systemInstruction: `You are the lead strategist at **${agency.name}**. Write ONLY an Executive Summary (2-3 paragraphs). Highlight our strengths: ${agency.coreSkills?.join(", ") || "expert development"}, tech stack ${agency.techStack?.join(", ") || "modern tools"}, and our tagline "${agency.tagline}". Use ${agency.brandTone} tone. No XML. No HTML. Do NOT include other sections.`,

        userPrompt: `Write an executive summary for ${clientInfo.name} (${clientInfo.company || "Individual"}) about "${projectTitle || 'Project'}". Industry: ${clientInfo.industry}. Budget: ${agency.currency} ${clientInfo.budget || 'TBD'}. ${currentContent ? `Improve this:\n${currentContent}` : ''}` +
          (prompt ? `\nAdditional focus: ${prompt}` : ""),
      },

      "problem-statement": {
        systemInstruction: `You are a business analyst at **${agency.name}**. Write ONLY a Problem Statement. Identify 3-5 real challenges for ${clientInfo.industry} businesses. Use bullet points (â€¢). No XML. No HTML. No other sections.`,

        userPrompt: `Write a problem statement for ${clientInfo.name} (${clientInfo.company || "Individual"}) regarding "${projectTitle || 'Project'}". Industry: ${clientInfo.industry}. ${currentContent ? `Improve:\n${currentContent}` : ''}` +
          (prompt ? `\nContext: ${prompt}` : ""),
      },

      "proposed-solution": {
        systemInstruction: `You are a solutions architect at **${agency.name}**. Write ONLY a Proposed Solution. Leverage our core services: ${agency.coreSkills?.join(", ") || "custom development"} and our tech stack: ${agency.techStack?.join(", ") || "modern tech"}. Use ${agency.brandTone} tone. No XML. No HTML.`,

        userPrompt: `Propose a solution for ${clientInfo.name} (${clientInfo.company || "Individual"}) regarding "${projectTitle || 'Project'}". Use our expertise in ${agency.coreSkills?.slice(0, 3).join(", ") || "web development"}. ${currentContent ? `Improve:\n${currentContent}` : ''}` +
          (prompt ? `\nRequirements: ${prompt}` : ""),
      },

      "technical-architecture": {
        systemInstruction: `You are the CTO of **${agency.name}**. Write ONLY a Technical Architecture section. Detail the stack: ${agency.techStack?.join(", ") || "Next.js, TypeScript, PostgreSQL"}. Include database, frontend, backend, cloud. No XML. No HTML.`,

        userPrompt: `Describe the technical architecture for "${projectTitle || 'Project'}" for ${clientInfo.name}. Use our preferred stack: ${agency.techStack?.join(", ") || "Modern Web Stack"}. ${currentContent ? `Current:\n${currentContent}` : ''}` +
          (prompt ? `\nTech focus: ${prompt}` : ""),
      },

      "project-timeline": {
        systemInstruction: `You are a project manager at **${agency.name}**. Write ONLY a Project Timeline. Break into phases with realistic week estimates. Use plain text. No XML. No HTML.`,

        userPrompt: `Create a timeline for "${projectTitle || 'Project'}" for ${clientInfo.name}. Include discovery, development, testing, deployment. ${currentContent ? `Improve:\n${currentContent}` : ''}`,
      },

      "investment-pricing": {
        systemInstruction: `You are the pricing specialist at **${agency.name}**. Write ONLY an Investment & Pricing section. Base calculations on our hourly rate of ${agency.currency} ${agency.hourlyRate}/hour. Include payment schedule. No XML. No HTML.`,

        userPrompt: `Write the pricing for "${projectTitle || 'Project'}" (budget: ${agency.currency} ${clientInfo.budget || 'not specified'}). Use our rate: ${agency.currency} ${agency.hourlyRate}/hr. ${currentContent ? `Improve:\n${currentContent}` : ''}`,
      },

      "terms-conditions": {
        systemInstruction: `You are the legal advisor for **${agency.name}**. Write ONLY Terms & Conditions. Include payment terms, IP rights, confidentiality, support. Use numbered clauses. No XML. No HTML.`,

        userPrompt: `Write terms for ${clientInfo.name}. Mention our contact: ${agency.email} | ${agency.website}. ${currentContent ? `Improve:\n${currentContent}` : ''}`,
      },

      custom: {
        systemInstruction: `You are a content writer at **${agency.name}**. Write ONLY the requested custom section. Use ${agency.brandTone} tone. No XML. No HTML. Do NOT include other proposal sections.`,

        userPrompt: `Write a custom section about "${prompt || 'Additional Information'}" for ${clientInfo.name} (project: ${projectTitle || 'Project'}). ${currentContent ? `Improve:\n${currentContent}` : ''}`,
      },
    };

    const config = sectionConfigs[target] || sectionConfigs["executive-summary"];

    // 6. Strict system instruction
    const strictSystemInstruction = `${config.systemInstruction}

âš ï¸ ABSOLUTE RULES:
- Generate ONLY the "${target}" section.
- NEVER use the word "GigThink" or any placeholder agency name. Use "${agency.name}".
- Write in ${agency.brandTone} tone.
- NO XML, NO HTML, NO markdown fences.
- Output plain text, suitable for direct insertion.`;

    // 7. Call AI
    const generatedContent = await generateAIResponse({
      userId: user.id,
      prompt: `${config.userPrompt}\n\nâš ï¸ REMINDER: Only the "${target}" section. No XML.`,
      isProposal: true,
      isSectionGeneration: true,
      systemInstruction: strictSystemInstruction,
    });

    // 8. Clean response (same as before)
    let cleanedContent = generatedContent
      .replace(/<proposal_card>/gi, "").replace(/<\/proposal_card>/gi, "")
      .replace(/<proposal>/gi, "").replace(/<\/proposal>/gi, "")
      .replace(/<executive_summary>/gi, "").replace(/<\/executive_summary>/gi, "")
      .replace(/<problem_statement>/gi, "").replace(/<\/problem_statement>/gi, "")
      .replace(/<solution_overview>/gi, "").replace(/<\/solution_overview>/gi, "")
      .replace(/<technical_architecture>/gi, "").replace(/<\/technical_architecture>/gi, "")
      .replace(/<timeline>/gi, "").replace(/<\/timeline>/gi, "")
      .replace(/<investment>/gi, "").replace(/<\/investment>/gi, "")
      .replace(/<acceptance_criteria>/gi, "").replace(/<\/acceptance_criteria>/gi, "")
      .replace(/<custom_section>/gi, "").replace(/<\/custom_section>/gi, "")
      .replace(/<ul>/gi, "").replace(/<\/ul>/gi, "")
      .replace(/<li>/gi, "â€¢ ").replace(/<\/li>/gi, "")
      .replace(/<p>/gi, "").replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/```xml|```html|```/gi, "")
      .replace(/^#+\s*(Executive Summary|Problem Statement|Proposed Solution|Technical Architecture|Project Timeline|Investment|Terms):?\s*/gim, "")
      .replace(/\*\*.*?\*\*:?\s*/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // 9. Validate against full proposal
    const sectionKeywords = [
      "executive summary", "problem statement", "proposed solution",
      "technical architecture", "project timeline", "investment", "terms and conditions"
    ];
    const otherSections = sectionKeywords.filter(
      kw => kw !== target.replace(/-/g, " ") && cleanedContent.toLowerCase().includes(kw)
    );
    if (otherSections.length >= 2) {
      console.warn(`[AI_SECTION] Full proposal detected, extracting "${target}"...`);
      const targetKeyword = target.replace(/-/g, " ");
      const nextIdx = sectionKeywords.findIndex(kw => kw === targetKeyword);
      if (nextIdx >= 0 && nextIdx < sectionKeywords.length - 1) {
        const nextKw = sectionKeywords[nextIdx + 1];
        const start = cleanedContent.toLowerCase().indexOf(targetKeyword);
        const end = cleanedContent.toLowerCase().indexOf(nextKw);
        cleanedContent = end > start ? cleanedContent.substring(start, end).trim() : cleanedContent.substring(start).trim();
      }
    }

    return NextResponse.json({
      success: true,
      content: cleanedContent,
      target,
      message: `${target} section generated with ${agency.name} branding.`,
    }, { status: 200 });

  } catch (err: unknown) {
    let message = err instanceof Error ? err.message : "Internal Server Error";
    if (message.includes("LIMIT_RESTRICTION")) {
      message = "LIMIT_RESTRICTION: Your free trial period has expired. Please upgrade your plan.";
    }
    console.error("[AI_GENERATE_SECTION_ERROR]:", message);
    const statusCode = message.includes("LIMIT_RESTRICTION") ? 429 : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}