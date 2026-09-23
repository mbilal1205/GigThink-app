import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import mongoose from "mongoose";
import { z } from "zod";
import { generateProjectPlan } from "@/lib/ai/planner";

const aiPlanSchema = z.object({
  message: z.string().min(5, "Please describe the project requirements."),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = aiPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    await connectToDatabase();

    // Verify project ownership
    const project = await Project.findOne({ _id: id, userId: user.id }).lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Count existing tasks to pass as offset
    const existingCount = await Task.countDocuments({ projectId: id, userId: user.id });

    // Call AI Planner
    const result = await generateProjectPlan({
      userId: user.id,
      projectId: id,
      message: parsed.data.message,
      projectTitle: project.title,
      clientName: project.clientName,
      existingTasksCount: existingCount,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[AI_PLAN_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate plan" },
      { status: 500 }
    );
  }
}