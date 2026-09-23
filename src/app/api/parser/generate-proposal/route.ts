import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Proposal from "@/lib/models/Proposal";
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  
  // 1. Authentication Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    // 2. Fetch Parsed Lead (Using standard client to respect RLS is preferred, but keeping admin as requested if needed for cross-schema)
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('parsed_leads')
      .select('result')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const parsed = lead.result;

    // 3. Fetch Agency Profile
    const { data: agencyRow } = await supabase
      .from("agency_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const agency = {
      name: agencyRow?.agency_name || "Our Agency",
      primaryColor: agencyRow?.primary_color || "#0F172A",
      brandTone: agencyRow?.brand_tone || "Professional and Direct",
      coreSkills: agencyRow?.core_skills || [],
      currency: agencyRow?.currency || "USD",
    };

    // 4. Create or Get Client Profile
    const companyName = parsed.company || "Unknown Client";
    let clientId: string | null = null;
    
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .ilike("company_name", companyName)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: createError } = await supabaseAdmin
        .from("clients")
        .insert({
          user_id: user.id,
          client_name: companyName,
          company_name: companyName,
          project_title: parsed.summary?.split('.')[0] || `Proposal for ${companyName}`,
          budget: parsed.budget_max || parsed.budget_min || 0,
        })
        .select("id")
        .single();

      if (createError) {
        throw new Error("Failed to create new client record");
      }
      clientId = newClient.id;
    }

    // 5. Prepare Proposal Metadata
    const finalTitle = parsed.summary?.split('.')[0] || `Proposal for ${companyName}`;
    const finalBudget = parsed.budget_max || parsed.budget_min || 0;

    // 6. AI System Instruction
    const systemInstruction = `You are an expert proposal writer for ${agency.name}. 
    Write a highly converting, professional proposal based on the provided lead.
    Your tone should be ${agency.brandTone}. Highlight these core skills if relevant: ${agency.coreSkills.join(', ')}.
    
    IMPORTANT: You MUST return the output ONLY as a valid JSON object where keys are section titles (e.g., "Executive Summary", "Approach", "Timeline", "Investment") and values are the section content formatted in Markdown. Do not include any conversational text outside the JSON.`;

    const prompt = `Create a proposal for the project: "${finalTitle}". 
    Here are the lead details and requirements: ${JSON.stringify(parsed)}`;

    // 7. Generate AI Content
    await connectToDatabase();
    const generatedContent = await generateAIResponse({
      userId: user.id,
      prompt,
      isProposal: true,
      isSectionGeneration: false,
      systemInstruction,
    });

    // 8. Robust JSON Parsing Logic (Failsafe)
    let parsedSections: Record<string, string> = {};
    try {
      // Extract everything between the first '{' and the last '}' to strip markdown formatting like ```json
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedSections = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON structure found in AI response");
      }
    } catch (parseError) {
      console.warn("[JSON_PARSE_WARNING]: AI response was not valid JSON, falling back to raw text.");
      // Fallback mechanism to ensure data isn't lost
      parsedSections = { "Complete Proposal": generatedContent.replace(/```json/g, '').replace(/```/g, '') };
    }

    // 9. Save to MongoDB
    const projectDoc = await Project.create({
      userId: user.id,
      clientId: clientId,
      title: finalTitle,
      description: parsed.summary || "Generated from parsed lead.",
      budget: finalBudget,
      currency: agency.currency,
      status: "Active"
    });

    const proposalDoc = await Proposal.create({
      userId: user.id,
      projectId: projectDoc._id,
      clientId: clientId,
      title: `Proposal: ${finalTitle}`,
      sections: parsedSections,
      status: "Draft",
      generatedAt: new Date()
    });

    // 10. Success Response
    return NextResponse.json({ 
      success: true, 
      proposalId: proposalDoc._id.toString(),
      projectId: projectDoc._id.toString()
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[PARSER_GENERATE_PROPOSAL_ERROR]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}