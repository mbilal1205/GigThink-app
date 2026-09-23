import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubtask {
  _id: Types.ObjectId;
  title: string;
  status: "pending" | "completed";
}

export interface ITask extends Document {
  projectId: Types.ObjectId;
  userId: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  estimatedHours?: number;
  actualHours?: number;
  startDate?: Date | null;
  dueDate?: Date | null;
  dependencies: Types.ObjectId[];
  order: number;
  subtasks: ISubtask[];
  createdAt: Date;
  updatedAt: Date;
}

const SubtaskSchema = new Schema<ISubtask>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
});

const TaskSchema = new Schema<ITask>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "blocked"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    estimatedHours: {
      type: Number,
      min: 0,
      max: 1000,
      default: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
      max: 1000,
      default: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    dependencies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
        default: [],
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    subtasks: {
      type: [SubtaskSchema],
      default: [],
    },
  },
  { timestamps: true }
);

TaskSchema.index({ projectId: 1, order: 1 });
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, dueDate: 1 });

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);