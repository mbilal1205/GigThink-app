import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Task from "@/lib/models/Task";
import mongoose from "mongoose";
import { z } from "zod";

const reorderSchema = z.object({
  taskIds: z.array(z.string().refine((val) => mongoose.isValidObjectId(val), {
    message: "Invalid task ID",
  })),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }

    await connectToDatabase();

    const { taskIds } = parsed.data;
    // Verify all tasks belong to the user
    const tasks = await Task.find({ _id: { $in: taskIds }, userId: user.id }).select("_id").lean();
    if (tasks.length !== taskIds.length) {
      return NextResponse.json({ error: "One or more tasks not found or unauthorized" }, { status: 403 });
    }

    // Update order sequentially
    const bulkOps = taskIds.map((taskId, index) => ({
      updateOne: {
        filter: { _id: taskId, userId: user.id },
        update: { $set: { order: index + 1 } },
      },
    }));

    await Task.bulkWrite(bulkOps);

    return NextResponse.json({ success: true, message: "Task order updated" });
  } catch (error: any) {
    console.error("[REORDER]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}