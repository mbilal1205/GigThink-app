// src/lib/ai/brain/activity-service.ts
import { connectToDatabase } from "@/lib/db/mongodb";
import AgentActivity from "@/lib/models/AgentActivity";

export async function logActivity(
  userId: string,
  actionType: string,
  description: string,
  metadata?: any
) {
  await connectToDatabase();
  const activity = new AgentActivity({
    userId,
    actionType,
    description,
    metadata,
  });
  await activity.save();
  return activity;
}

export async function getRecentActivities(userId: string, limit = 20) {
  await connectToDatabase();
  const activities = await AgentActivity.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return activities;
}

export async function clearAllActivities(userId: string) {
  await connectToDatabase();
  await AgentActivity.deleteMany({ userId });
}