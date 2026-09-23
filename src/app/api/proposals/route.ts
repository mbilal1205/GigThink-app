import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Proposal from "@/lib/models/Proposal";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query: any = { userId: user.id };

    if (clientId) query.clientId = clientId;
    if (status && status !== "all") query.status = status;
    if (projectId && mongoose.isValidObjectId(projectId)) query.projectId = projectId;

    console.log("ðŸ” [GET_PROPOSALS]: Query:", JSON.stringify(query));

    const [proposals, total] = await Promise.all([
      Proposal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Proposal.countDocuments(query),
    ]);

    // Serialize with ALL fields needed
    const serializedProposals = proposals.map((p: any) => ({
      _id: p._id.toString(),
      projectId: p.projectId ? p.projectId.toString() : null,
      title: p.title || "Untitled Proposal",
      clientId: p.clientId || "",
      status: p.status || "draft",
      version: p.version || 1,
      // âœ… Include full sections array
      sections: (p.sections || []).map((s: any) => ({
        ...s,
        _id: s._id ? s._id.toString() : undefined,
      })),
      sectionsCount: p.sections?.length || 0,
      clientName: p.metadata?.clientName || "Unknown Client",
      clientCompany: p.metadata?.clientCompany || "",
      clientEmail: p.metadata?.clientEmail || "",
      totalBudget: p.metadata?.totalBudget || 0,
      currency: p.metadata?.currency || "USD",
      preview: getPreview(p.sections),
      shareLink: p.shareLink || null,
      views: p.views ?? 0,
      lastViewedAt: p.lastViewedAt || null,
      clientAction: p.clientAction || "none",
      events: p.events || [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      proposals: serializedProposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + proposals.length < total,
      },
    });
  } catch (error: any) {
    console.error("âŒ [GET_PROPOSALS_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getPreview(sections: any[]): string {
  if (!sections || !Array.isArray(sections)) return "";
  const execSection = sections.find(
    (s: any) => s.type === "executive-summary" && s.isVisible !== false
  );
  if (execSection?.content) {
    const clean = execSection.content
      .replace(/<[^>]*>/g, "")
      .replace(/\n/g, " ")
      .trim();
    return clean.length > 150 ? clean.substring(0, 150) + "..." : clean;
  }
  return "";
}