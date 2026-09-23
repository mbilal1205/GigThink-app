import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { detectIntent } from "@/lib/ai/brain/intent-detector";
import { buildBrainContext } from "@/lib/ai/brain/context-builder";
import { routeIntent, executePendingAction } from "@/lib/ai/brain/router";
import { addMessageToSession, getOrCreateSession } from "@/lib/ai/brain/memory-service";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const body = await req.json();
    const message = body.message?.trim();
    const sessionId = body.sessionId || "default";

    // Check if this is a confirmation request
    if (body.pendingActionId) {
      const approved = body.approved === true;
      const resultText = await executePendingAction(userId, body.pendingActionId, approved);
      // Save assistant response
      await addMessageToSession(userId, sessionId, { role: "assistant", content: resultText });
      return NextResponse.json({ response: resultText });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Ensure session exists
    await getOrCreateSession(userId, sessionId);
    // 2. Save user message
    await addMessageToSession(userId, sessionId, { role: "user", content: message });

    // 3. Detect intent
    const intentResult = await detectIntent(message, userId);
    // 4. Build context
    const context = await buildBrainContext(userId, sessionId);
    // 5. Route (now returns object)
    const routeResult = await routeIntent(userId, intentResult.tool, message, context);

    // 6. Save assistant response (if no pending action)
    if (!routeResult.pendingAction) {
      await addMessageToSession(userId, sessionId, { role: "assistant", content: routeResult.text });
    } else {
      // Save pending action message too
      await addMessageToSession(userId, sessionId, { role: "assistant", content: routeResult.text });
    }

    // 7. Parse structured data if proposal
    let structuredData = null;
    let responseType = "text";
    if (intentResult.tool === "proposal" || intentResult.tool === "save_proposal") {
      try {
        const cleanText = routeResult.text.replace(/```json|```/g, "").trim();
        const jsonStart = cleanText.indexOf("{");
        const jsonEnd = cleanText.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = cleanText.substring(jsonStart, jsonEnd + 1);
          structuredData = JSON.parse(jsonStr);
          responseType = "proposal";
        }
      } catch (e) {}
    }

    return NextResponse.json({
      response: routeResult.text,
      structuredData,
      type: responseType,
      tool: intentResult.tool,
      confidence: intentResult.confidence,
      pendingAction: routeResult.pendingAction || null,
    });
  } catch (error: any) {
    console.error("[AGENT_CHAT] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}