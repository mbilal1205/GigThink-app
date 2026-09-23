import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";
import { consumeCredits } from "@/lib/credits";
import { z } from "zod";

const leadSchema = z.object({
  lead: z.object({
    businessName: z.string().min(1),
    email: z.string().optional(),
    location: z.string().optional(),
    niche: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().nullable().optional(),
    leadTemperature: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ðŸ”¥ Credit check for short pitch (first time free, then 5 credits)
    const creditResult = await consumeCredits(user.id, "short_pitch", 5);
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error, showPaywall: creditResult.showPaywall },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });

    const { lead } = parsed.data;

    // Fetch user profile
    const { data: agencyRow } = await supabase
      .from("agency_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    const agencyName = agencyRow?.agency_name || "My Agency";
    const contactEmail = agencyRow?.contact_email || user.email || "";
    const website = agencyRow?.website_url || "";
    const phone = agencyRow?.phone || "";
    const userName = profileRow?.name || "";

    const systemInstruction = `You are an expert outreach copywriter for ${agencyName}. 
Write a short, professional first-contact email for the lead. 
Use the following real sender info:
- Sender Name: ${userName || "there"}
- Agency: ${agencyName}
- Email: ${contactEmail}
- Website: ${website}
- Phone: ${phone || "N/A"}

Output ONLY valid JSON in this exact format:
{
  "subject": "Subject line here",
  "body": "Email body with proper paragraphs, greeting, concise value pitch, soft call-to-action, and professional signature with real sender info. Do not use placeholders like [Your Name]."
}`;

    const userPrompt = `Lead details:
Business: ${lead.businessName}
Contact Person: ${lead.email || "Unknown"}
Location: ${lead.location || "Unknown"}
Niche: ${lead.niche || "General"}
Lead Temperature: ${lead.leadTemperature || "N/A"}

Write the first-contact email.`;

    const rawResponse = await generateAIResponse({
      userId: user.id,
      prompt: userPrompt,
      isProposal: false,
      isSectionGeneration: false,
      systemInstruction,
    });

    let parsedResponse: { subject: string; body: string };
    try {
      const cleaned = rawResponse.replace(/```json|```/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsedResponse = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("[PITCH_JSON_PARSE]", error);
      parsedResponse = {
        subject: `Quick question for ${lead.businessName}`,
        body: rawResponse.replace(/\[Your Name\]/g, userName || "").replace(/\[Your Company\]/g, agencyName),
      };
    }

    return NextResponse.json({
      success: true,
      pitch: {
        subject: parsedResponse.subject,
        body: parsedResponse.body,
      },
    });
  } catch (error: any) {
    console.error("[RAW_PITCH]", error);
    return NextResponse.json({ error: error.message || "Pitch generation failed" }, { status: 500 });
  }
}