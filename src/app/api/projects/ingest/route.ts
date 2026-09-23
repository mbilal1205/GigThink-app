import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Project from '@/lib/models/Project';
import Conversation from '@/lib/models/Conversation';
import { z } from 'zod';

// 1. Zod Validation Schema (Strict TypeScript validation)
const ingestSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  source: z.enum(['WhatsApp', 'Email', 'Meeting', 'Manual']),
  rawText: z.string().min(10, "Conversation text is too short. Need more context."),
});

export async function POST(req: Request) {
  try {
    // 2. Enterprise Auth Check (Supabase)
    const supabase = await  createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 3. Body Parsing & Strict Validation
    const body = await req.json();
    const parsedData = ingestSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ 
        error: 'Invalid input data', 
        details: parsedData.error.format() 
      }, { status: 400 });
    }

    const { title, source, rawText } = parsedData.data;

    // 4. Connect to MongoDB (Singleton Cache)
    await connectToDatabase();

    // 5. Create Parent Project in MongoDB (Linked via user.id)
    const newProject = await Project.create({
      userId: user.id,
      title: title,
      status: 'Generating', // Status locked to generating
    });

    // 6. Save Raw Conversation 
    const newConversation = await Conversation.create({
      userId: user.id,
      projectId: newProject._id,
      source: source,
      rawText: rawText,
    });

    // 7. Return Success (Yeh ID frontend pe redirect ke kaam aayegi)
    return NextResponse.json({
      success: true,
      projectId: newProject._id,
      conversationId: newConversation._id,
      message: "Chat ingested successfully. Ready for AI processing."
    }, { status: 201 });

  } catch (error) {
    console.error("[INGEST_API_ERROR]:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}