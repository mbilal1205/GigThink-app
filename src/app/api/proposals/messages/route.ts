// src/app/api/proposals/messages/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { createSupabaseServerClient } from "@/utils/supabase/server";

// ==========================================
// Types — MongoDB document shape
// ==========================================
interface MessageDocument {
  _id?: unknown;
  id?: string;
  conversation_id: string;
  user_id: string;
  sender: "user" | "ai";
  content: string;
  created_at: string | Date;
}

interface FormattedMessage {
  id: string;
  sender: "user" | "ai";
  content: string;
  created_at: string;
}

// ==========================================
// GET — Fetch conversation history
// ==========================================
export async function GET(request: Request) {
  try {
    // 1. Authenticate user (Supabase)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Extract conversationId from query params
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // 3. Connect to MongoDB (cached, fast)
    const { db } = await connectToDatabase();

    // 4. Fetch messages chronologically
    const messages = await db
      .collection<MessageDocument>("messages")
      .find({
        conversation_id: conversationId,
        user_id: user.id,
      })
      .sort({ created_at: 1 })
      .toArray();

    // 5. Map to client-safe shape
    const formattedMessages: FormattedMessage[] = messages.map((msg) => ({
      id: String(msg._id ?? msg.id ?? ""),
      sender: msg.sender,
      content: msg.content,
      created_at:
        msg.created_at instanceof Date
          ? msg.created_at.toISOString()
          : msg.created_at,
    }));

    // 6. First AI message = base proposal
    const firstAiMessage = formattedMessages.find((m) => m.sender === "ai");
    const proposalText = firstAiMessage?.content ?? "";

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      proposalText,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("🔴 Error fetching conversation history:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}