import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Proposal from "@/lib/models/Proposal";
import Project from "@/lib/models/Project";   // âš¡ Added for project deletion
import mongoose from "mongoose";

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET - Fetch single proposal by ID
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("ðŸ” [GET_PROPOSAL]: Searching for:", id);

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    let proposal = null;

    // Try multiple ways to locate the proposal
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Try by _id
      proposal = await Proposal.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: user.id,
      }).lean();
      // If not found, try by projectId
      if (!proposal) {
        proposal = await Proposal.findOne({
          projectId: id,
          userId: user.id,
        }).lean();
      }
    } else {
      // Try as string _id or projectId
      proposal = await Proposal.findOne({
        $or: [{ _id: id }, { projectId: id }],
        userId: user.id,
      }).lean();
    }

    if (!proposal) {
      // Debug log: show user's recent proposals
      const userProposals = await Proposal.find({ userId: user.id })
        .select("_id projectId title clientId")
        .limit(10)
        .lean();
      console.log("âŒ [GET_PROPOSAL]: Not found. User proposals:",
        userProposals.map((p: any) => ({ _id: p._id.toString(), projectId: p.projectId, title: p.title }))
      );
      return NextResponse.json(
        { error: "Proposal not found", debug: { searchedId: id } },
        { status: 404 }
      );
    }

    // Serialize safely
    const serialized = {
      ...proposal,
      _id: proposal._id.toString(),
      sections: (proposal.sections || []).map((s: any) => ({
        id: s.id || `section-${Date.now()}`,
        type: s.type || "custom",
        title: s.title || "Untitled",
        content: s.content || "",
        order: s.order || 0,
        isCustom: s.isCustom || false,
        isVisible: s.isVisible !== false,
        aiGenerated: s.aiGenerated || false,
      })),
    };

    console.log("âœ… [GET_PROPOSAL]: Found:", { _id: serialized._id, title: serialized.title, sections: serialized.sections.length });
    return NextResponse.json({ success: true, proposal: serialized });
  } catch (error: any) {
    console.error("âŒ [GET_PROPOSAL_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE - Delete proposal AND its linked project
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("ðŸ—‘ï¸ [DELETE]: Deleting proposal & project for ID:", id);

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // 1. Find the proposal first (to get its projectId)
    let proposal = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      proposal = await Proposal.findOne({
        $or: [
          { _id: new mongoose.Types.ObjectId(id) },
          { projectId: id }
        ],
        userId: user.id,
      }).lean();
    } else {
      proposal = await Proposal.findOne({
        $or: [{ _id: id }, { projectId: id }],
        userId: user.id,
      }).lean();
    }

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // 2. Delete linked project if it exists
    const projectId = (proposal as any).projectId;
    if (projectId) {
      const projectDelete = await Project.deleteOne({ _id: projectId });
      console.log("ðŸ“¦ Project deleted:", projectDelete.deletedCount);
    }

    // 3. Delete the proposal itself
    const deleteResult = await Proposal.deleteOne({ _id: (proposal as any)._id });
    console.log("ðŸ“„ Proposal deleted:", deleteResult.deletedCount);

    return NextResponse.json({
      success: true,
      message: "Proposal and associated project permanently deleted.",
    });
  } catch (error: any) {
    console.error("âŒ [DELETE_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

