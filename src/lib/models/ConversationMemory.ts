// src/lib/models/ConversationMemory.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMemoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export interface IConversationMemory extends Document {
  userId: string;
  sessionId: string;
  sessionTitle?: string;
  isPinned: boolean;
  messages: IMemoryMessage[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemoryMessageSchema = new Schema<IMemoryMessage>({
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const ConversationMemorySchema = new Schema<IConversationMemory>(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    sessionTitle: { type: String, default: "" },
    isPinned: { type: Boolean, default: false },
    messages: [MemoryMessageSchema],
    summary: { type: String, default: "" },
  },
  { timestamps: true }
);

ConversationMemorySchema.index({ userId: 1, sessionId: 1 }, { unique: true });

export default mongoose.models.ConversationMemory ||
  mongoose.model<IConversationMemory>("ConversationMemory", ConversationMemorySchema);