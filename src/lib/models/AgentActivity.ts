// src/lib/models/AgentActivity.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAgentActivity extends Document {
  userId: string;
  actionType: string; // e.g., "tool_call", "proactive_alert", "pending_action"
  description: string;
  metadata?: any;
  createdAt: Date;
}

const AgentActivitySchema = new Schema<IAgentActivity>({
  userId: { type: String, required: true, index: true },
  actionType: { type: String, required: true },
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.AgentActivity ||
  mongoose.model<IAgentActivity>("AgentActivity", AgentActivitySchema);