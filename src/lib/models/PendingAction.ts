import mongoose, { Schema, Document } from "mongoose";

export interface IPendingAction extends Document {
  userId: string;
  actionType: string; // e.g., "delete_client", "send_email"
  actionPayload: any; // data jo execute karne ke liye chahiye
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  expiresAt: Date; // TTL ke liye
}

const PendingActionSchema = new Schema<IPendingAction>({
  userId: { type: String, required: true, index: true },
  actionType: { type: String, required: true },
  actionPayload: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) }, // 10 minutes
});

export default mongoose.models.PendingAction || 
  mongoose.model<IPendingAction>("PendingAction", PendingActionSchema);