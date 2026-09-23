// src/lib/ai/brain/memory-service.ts
import { connectToDatabase } from "@/lib/db/mongodb";
import ConversationMemory from "@/lib/models/ConversationMemory";

export interface MemoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function getOrCreateSession(userId: string, sessionId: string) {
  await connectToDatabase();
  let session = await ConversationMemory.findOne({ userId, sessionId });
  if (!session) {
    session = new ConversationMemory({
      userId,
      sessionId,
      messages: [],
      isPinned: false,
    });
    await session.save();
  }
  return session;
}

export async function addMessageToSession(
  userId: string,
  sessionId: string,
  message: MemoryMessage
) {
  await connectToDatabase();
  const session = await getOrCreateSession(userId, sessionId);
  session.messages.push({
    role: message.role,
    content: message.content,
    timestamp: new Date(),
  });
  // Session title auto-generate from first user message
  if (!session.sessionTitle && message.role === "user") {
    session.sessionTitle = message.content.slice(0, 50);
  }
  await session.save();
  return session;
}

export async function getRecentMessages(
  userId: string,
  sessionId: string,
  limit = 10
) {
  await connectToDatabase();
  const session = await ConversationMemory.findOne({ userId, sessionId });
  if (!session) return [];
  return session.messages.slice(-limit);
}

export async function listUserSessions(userId: string) {
  await connectToDatabase();
  const sessions = await ConversationMemory.find({ userId })
    .select("sessionId sessionTitle isPinned updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  return sessions;
}

export async function deleteSession(userId: string, sessionId: string) {
  await connectToDatabase();
  await ConversationMemory.deleteOne({ userId, sessionId });
}

export async function togglePinSession(userId: string, sessionId: string, isPinned: boolean) {
  await connectToDatabase();
  await ConversationMemory.updateOne({ userId, sessionId }, { isPinned });
}

export async function getSessionMessages(userId: string, sessionId: string) {
  await connectToDatabase();
  const session = await ConversationMemory.findOne({ userId, sessionId });
  return session?.messages || [];
}