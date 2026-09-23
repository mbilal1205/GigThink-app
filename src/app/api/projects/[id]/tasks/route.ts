import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import mongoose from "mongoose";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional().default(""),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional().default("pending"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  estimatedHours: z.number().min(0).max(1000).optional().default(0),
  actualHours: z.number().min(0).max(1000).optional().default(0),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  dependencies: z.array(z.string()).optional().default([]),
  order: z.number().int().optional(),
  subtasks: z.array(
    z.object({
      title: z.string().min(1),
      status: z.enum(["pending", "completed"]).optional().default("pending"),
    })
  ).optional().default([]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // âœ… Type changed
) {
  try {
    // 1. Auth
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;  // âœ… Await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    await connectToDatabase();

    // 2. Verify project ownership
    const project = await Project.findOne({ _id: id, userId: user.id }).lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 3. Fetch tasks
    const tasks = await Task.find({ projectId: id, userId: user.id })
      .sort({ order: 1, dueDate: 1 })
      .lean();

    const formattedTasks = tasks.map((task: any) => ({
      ...task,
      _id: task._id.toString(),
      projectId: task.projectId.toString(),
      dependencies: (task.dependencies || []).map((d: any) => d.toString()),
      subtasks: (task.subtasks || []).map((s: any) => ({
        ...s,
        _id: s._id.toString(),
      })),
    }));

    return NextResponse.json({ success: true, tasks: formattedTasks });
  } catch (error: any) {
    console.error("[TASKS_GET]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // âœ… Type changed
) {
  try {
    // 1. Auth
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;  // âœ… Await params

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 2. Verify project ownership
    const project = await Project.findOne({ _id: id, userId: user.id }).lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 3. Validate dependencies belong to same project
    if (parsed.data.dependencies && parsed.data.dependencies.length > 0) {
      const depIds = parsed.data.dependencies;
      const validDeps = await Task.find({
        _id: { $in: depIds },
        projectId: id,
        userId: user.id,
      })
        .select("_id")
        .lean();

      if (validDeps.length !== depIds.length) {
        return NextResponse.json(
          { error: "One or more dependency tasks not found in this project" },
          { status: 400 }
        );
      }
    }

    // 4. Determine next order if not provided
    const maxOrderTask = await Task.findOne({ projectId: id, userId: user.id })
      .sort({ order: -1 })
      .select("order")
      .lean();
    const nextOrder = (maxOrderTask?.order ?? 0) + 1;

    const taskData = {
      projectId: id,
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      estimatedHours: parsed.data.estimatedHours,
      actualHours: parsed.data.actualHours,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      dependencies: parsed.data.dependencies.map(
        (d: string) => new mongoose.Types.ObjectId(d)
      ),
      order: parsed.data.order ?? nextOrder,
      subtasks: parsed.data.subtasks.map((s: any) => ({
        title: s.title,
        status: s.status,
      })),
    };

    const newTask = await Task.create(taskData);
    await recalculateProjectProgress(id, user.id);

    return NextResponse.json(
      {
        success: true,
        task: {
          ...newTask.toObject(),
          _id: newTask._id.toString(),
          projectId: newTask.projectId.toString(),
          dependencies: newTask.dependencies.map((d: any) => d.toString()),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[TASKS_POST]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Helper: Recalculate project progress based on completed tasks
async function recalculateProjectProgress(projectId: string, userId: string) {
  const tasks = await Task.find({ projectId, userId })
    .select("status")
    .lean();

  if (tasks.length === 0) {
    await Project.updateOne(
      { _id: projectId, userId },
      { $set: { progress: 0 } }
    );
    return;
  }

  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress = Math.round((completed / tasks.length) * 100);

  await Project.updateOne(
    { _id: projectId, userId },
    { $set: { progress } }
  );
}