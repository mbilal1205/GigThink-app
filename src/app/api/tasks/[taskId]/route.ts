import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Project from "@/lib/models/Project";
import Task from "@/lib/models/Task";
import mongoose from "mongoose";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  estimatedHours: z.number().min(0).max(1000).optional(),
  actualHours: z.number().min(0).max(1000).optional(),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  order: z.number().int().optional(),
  dependencies: z.array(z.string()).optional(),
  subtasks: z
    .array(
      z.object({
        _id: z.string().optional(),
        title: z.string().min(1),
        status: z.enum(["pending", "completed"]).optional(),
      })
    )
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }  // âœ… Type changed
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

    const { taskId } = await params;  // âœ… Await params

    if (!mongoose.isValidObjectId(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Verify ownership through project
    const project = await Project.findOne({
      _id: task.projectId,
      userId: user.id,
    }).lean();
    if (!project) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // 3. Build update object
    const update: any = {};
    if (parsed.data.title !== undefined) update.title = parsed.data.title;
    if (parsed.data.description !== undefined) update.description = parsed.data.description;
    if (parsed.data.status !== undefined) update.status = parsed.data.status;
    if (parsed.data.priority !== undefined) update.priority = parsed.data.priority;
    if (parsed.data.estimatedHours !== undefined) update.estimatedHours = parsed.data.estimatedHours;
    if (parsed.data.actualHours !== undefined) update.actualHours = parsed.data.actualHours;
    if (parsed.data.startDate !== undefined)
      update.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null;
    if (parsed.data.dueDate !== undefined)
      update.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (parsed.data.order !== undefined) update.order = parsed.data.order;

    if (parsed.data.dependencies !== undefined) {
      const depIds = parsed.data.dependencies.map(
        (d: string) => new mongoose.Types.ObjectId(d)
      );
      if (depIds.length > 0) {
        const validDeps = await Task.find({
          _id: { $in: depIds },
          projectId: task.projectId,
          userId: user.id,
        })
          .select("_id")
          .lean();
        if (validDeps.length !== depIds.length) {
          return NextResponse.json(
            { error: "Invalid dependency task" },
            { status: 400 }
          );
        }
      }
      update.dependencies = depIds;
    }

    if (parsed.data.subtasks !== undefined) {
      update.subtasks = parsed.data.subtasks.map((s: any) => ({
        _id: s._id ? new mongoose.Types.ObjectId(s._id) : new mongoose.Types.ObjectId(),
        title: s.title,
        status: s.status || "pending",
      }));
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, update, {
      new: true,
    }).lean();

    await recalculateProjectProgress(task.projectId.toString(), user.id);

    return NextResponse.json({
      success: true,
      task: {
        ...updatedTask,
        _id: updatedTask._id.toString(),
        projectId: updatedTask.projectId.toString(),
        dependencies: (updatedTask.dependencies || []).map((d: any) => d.toString()),
      },
    });
  } catch (error: any) {
    console.error("[TASK_PATCH]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }  // âœ… Type changed
) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;  // âœ… Await params

    if (!mongoose.isValidObjectId(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    await connectToDatabase();

    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const project = await Project.findOne({
      _id: task.projectId,
      userId: user.id,
    }).lean();
    if (!project) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await Task.deleteOne({ _id: taskId });
    await Task.updateMany(
      { dependencies: taskId },
      { $pull: { dependencies: taskId } }
    );

    await recalculateProjectProgress(task.projectId.toString(), user.id);

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error: any) {
    console.error("[TASK_DELETE]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

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