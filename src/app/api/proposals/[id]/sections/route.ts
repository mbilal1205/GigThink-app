import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Proposal from "@/lib/models/Proposal";
import mongoose from "mongoose";

// Update all sections (Drag & Drop reorder + Save)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log("ðŸ’¾ [SAVE_SECTIONS]: ID received:", id);

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { sections, title } = body;

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: "Sections array is required" }, { status: 400 });
    }

    // Build query - try both _id and projectId
    let query: any = { userId: user.id };

    // Check if id is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      // Try finding by _id first, then by projectId
      query.$or = [
        { _id: new mongoose.Types.ObjectId(id) },
        { projectId: id }
      ];
    } else {
      // If not ObjectId, try string match
      query.$or = [
        { _id: id },
        { projectId: id }
      ];
    }

    console.log("ðŸ” [SAVE_SECTIONS]: Query:", JSON.stringify(query));

    // Find the proposal
    let proposal = await Proposal.findOne(query);

    // If still not found, try without userId (for debugging)
    if (!proposal) {
      console.log("âš ï¸ [SAVE_SECTIONS]: Not found with userId, trying without...");
      proposal = await Proposal.findOne(
        mongoose.Types.ObjectId.isValid(id) 
          ? { _id: new mongoose.Types.ObjectId(id) }
          : { $or: [{ _id: id }, { projectId: id }] }
      );
    }

    if (!proposal) {
      console.error("âŒ [SAVE_SECTIONS]: Proposal not found for ID:", id);
      
      // List all proposals for this user to debug
      const allProposals = await Proposal.find({ userId: user.id })
        .select('_id projectId title')
        .lean();
      
      console.log("ðŸ“‹ All user proposals:", allProposals);
      
      return NextResponse.json(
        { 
          error: "Proposal not found", 
          debug: { searchedId: id, userProposals: allProposals }
        },
        { status: 404 }
      );
    }

    console.log("âœ… [SAVE_SECTIONS]: Proposal found:", proposal._id);

    // Update sections
    proposal.sections = sections.map((section: any) => ({
      id: section.id,
      type: section.type || "custom",
      title: section.title || "Untitled",
      content: section.content || "",
      order: section.order,
      isCustom: section.isCustom || false,
      isVisible: section.isVisible !== undefined ? section.isVisible : true,
      aiGenerated: section.aiGenerated || false,
      createdAt: section.createdAt || new Date(),
      updatedAt: new Date(),
    }));

    // Update title if provided
    if (title) {
      proposal.title = title;
    }

    // Update metadata timestamp
    proposal.metadata.updatedAt = new Date();
    proposal.markModified("sections");

    // Save
    await proposal.save();

    console.log("âœ… [SAVE_SECTIONS]: Saved successfully!");

    // Return updated proposal
    const updatedProposal = await Proposal.findById(proposal._id).lean();

    return NextResponse.json({
      success: true,
      message: "Sections saved successfully!",
      proposal: {
        ...updatedProposal,
        _id: updatedProposal._id.toString(),
        sections: updatedProposal.sections.map((s: any) => ({
          ...s,
          _id: s._id?.toString(),
        })),
      },
    });
  } catch (error: any) {
    console.error("âŒ [SAVE_SECTIONS_ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Update single section content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { sectionId, content, title: sectionTitle } = body;

    // Find proposal - try both _id and projectId
    let query: any = { userId: user.id };
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [
        { _id: new mongoose.Types.ObjectId(id) },
        { projectId: id }
      ];
    } else {
      query.$or = [{ _id: id }, { projectId: id }];
    }

    const proposal = await Proposal.findOne(query);

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Find section
    const sectionIndex = proposal.sections.findIndex(
      (s: any) => s.id === sectionId || s._id?.toString() === sectionId
    );

    if (sectionIndex === -1) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Update
    if (content !== undefined) {
      proposal.sections[sectionIndex].content = content;
      proposal.sections[sectionIndex].aiGenerated = true;
    }

    if (sectionTitle !== undefined) {
      proposal.sections[sectionIndex].title = sectionTitle;
    }

    proposal.sections[sectionIndex].updatedAt = new Date();
    proposal.metadata.updatedAt = new Date();
    proposal.markModified("sections");

    await proposal.save();

    return NextResponse.json({
      success: true,
      message: "Section updated!",
    });
  } catch (error: any) {
    console.error("[UPDATE_SECTION_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add custom section
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const body = await req.json();
    const { title, content, type } = body;

    // Find proposal
    let query: any = { userId: user.id };
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [
        { _id: new mongoose.Types.ObjectId(id) },
        { projectId: id }
      ];
    } else {
      query.$or = [{ _id: id }, { projectId: id }];
    }

    const proposal = await Proposal.findOne(query);

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Create new section
    const newSection = {
      id: `custom-${Date.now()}`,
      type: type || "custom",
      title: title || "New Section",
      content: content || "",
      order: proposal.sections.length + 1,
      isCustom: true,
      isVisible: true,
      aiGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    proposal.sections.push(newSection);
    proposal.metadata.updatedAt = new Date();
    await proposal.save();

    return NextResponse.json({
      success: true,
      message: "Section added!",
      section: newSection,
    });
  } catch (error: any) {
    console.error("[ADD_SECTION_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete section
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("sectionId");

    if (!sectionId) {
      return NextResponse.json({ error: "Section ID required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find proposal
    let query: any = { userId: user.id };
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [
        { _id: new mongoose.Types.ObjectId(id) },
        { projectId: id }
      ];
    } else {
      query.$or = [{ _id: id }, { projectId: id }];
    }

    const proposal = await Proposal.findOne(query);

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Remove section
    proposal.sections = proposal.sections
      .filter((s: any) => s.id !== sectionId && s._id?.toString() !== sectionId)
      .map((s: any, i: number) => ({ ...s, order: i + 1 }));

    proposal.metadata.updatedAt = new Date();
    await proposal.save();

    return NextResponse.json({
      success: true,
      message: "Section deleted!",
    });
  } catch (error: any) {
    console.error("[DELETE_SECTION_ERROR]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}