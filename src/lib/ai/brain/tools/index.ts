// src/lib/ai/brain/tools/index.ts
import { generateAIResponse } from "@/lib/ai/orchestrator/orchestrator";
import { getPreferences, setPreference } from "../preference-service";
import { BrainContext } from "../context-builder";
import { connectToDatabase } from "@/lib/db/mongodb";
import createSupabaseAdminClient from "@/utils/supabaseAdmin"
import mongoose from "mongoose";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { sendMail } from "@/utils/sendEmail"; // Ø§Ú¯Ø± Ø¢Ù¾ Ú©Û’ Ù¾Ø§Ø³ ÛŒÛ util ÛÛ’
import { generateProjectPlan } from "@/lib/ai/planner";
// ----------------------------------------------
// 1. PROPOSAL GENERATOR (Module 3)
// ----------------------------------------------
// src/lib/ai/brain/tools/index.ts (ØµØ±Ù handleProposal Ú©Ø§ Ø­ØµÛ replace Ú©Ø±ÛŒÚº)
export async function handleProposal(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  if (!ctx.currentProject && !ctx.currentProposal && !message.includes("client")) {
    return "âŒ Pehle koi project ya client select karein, phir proposal generate karne ko kahen.";
  }

  // Client ka naam message se nikalne ki koshish
  let clientName = "Client";
  const nameMatch = message.match(/for\s+([A-Za-z0-9\s]+)/i) || message.match(/client\s+([A-Za-z0-9\s]+)/i);
  if (nameMatch) {
    clientName = nameMatch[1].trim();
  } else if (ctx.currentProject?.clientName) {
    clientName = ctx.currentProject.clientName;
  } else if (ctx.currentProposal?.clientName) {
    clientName = ctx.currentProposal.clientName;
  }

  // Agency info
  const agencyName = ctx.agency.name || "My Agency";
  const hourlyRate = ctx.agency.hourlyRate || 50;
  const currency = ctx.agency.currency || "USD";
  const services = ctx.agency.services && ctx.agency.services.length > 0
    ? ctx.agency.services.join(", ")
    : "web development, UI/UX design, mobile apps";

  const pastProjects = ctx.projects && ctx.projects.length > 0
    ? ctx.projects.slice(0, 3).map((p: any) => `${p.title || p.name} (${p.clientName || "client"})`).join(", ")
    : "None listed";

  const agencyDescription = ctx.agency.description || `We are a professional agency specializing in ${services}.`;

  const systemInstruction = `
You are Lead Proposal Writer for ${agencyName}.

**Agency Profile:**
- Name: ${agencyName}
- Services: ${services}
- Typical hourly rate: ${currency} ${hourlyRate}
- Recent projects: ${pastProjects}
- About: ${agencyDescription}

**STRICT RULES:**
- Write a proposal that is REALISTIC and appropriate for a freelancer/small agency, NOT for enterprise mega-projects.
- Do NOT invent clients like Home Depot or huge budgets unless explicitly mentioned by user.
- Keep the budget aligned with the hourly rate and typical project size. For a small web project, estimate 1-3 months, total budget not more than 5-10x monthly income.
- Use the services provided; do NOT add unrelated services (like cloud migration for huge corporations) unless the client specifically asks.
- Output ONLY the JSON structure as specified, with concise, clear content.
- Include a realistic timeline, milestones, and pricing.
- Do NOT mention that you are an AI; write as a professional from ${agencyName}.
`;

  const prompt = `Client: ${clientName}\nUser Request: ${message}\n\nWrite a full proposal for this client based on the agency profile and the user request.`;

  try {
    const rawResponse = await generateAIResponse({
      userId,
      prompt,
      isProposal: true, // full proposal mode, JSON output expected
      isSectionGeneration: false,
      systemInstruction,
    });

    // rawResponse already JSON string (orchestrator extract kar dega)
    return rawResponse;
  } catch (error: any) {
    console.error("[PROPOSAL_HANDLER] Error:", error);
    return `âŒ Proposal generation mein masla: ${error.message}`;
  }
}

// ----------------------------------------------
// 2. PRICING ADVISOR (Module 4)
// ----------------------------------------------
export async function handlePricing(userId: string, message: string, ctx: BrainContext) {
  const budget = ctx.currentProposal?.totalBudget || "Unknown";
  const rate = ctx.agency.hourlyRate;
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Pricing Consultant. Agency Rate: ${ctx.agency.currency} ${rate}/hr. Current Budget: ${budget}. Analyze if budget matches work. Provide Fair Market Price, Reality Check, and Negotiation Script.`,
  });
}

// ----------------------------------------------
// 3. RISK DETECTOR (Module 10)
// ----------------------------------------------
export async function handleRisk(userId: string, message: string, ctx: BrainContext) {
  const p = ctx.currentProposal;
  let detail = "No proposal found.";
  if (p) {
    detail = `Client: ${p.clientName}, Budget: ${p.currency} ${p.totalBudget}. `;
    const timeline = p.sections.find((s: any) => s.type === "project-timeline")?.content || "";
    detail += `Timeline: ${timeline}`;
  }
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Risk Detector. ${detail}. Output: Risk Score (/10), Top 3 Specific Risks (mention exact numbers), Recommended Actions, Go/No-Go Decision.`,
  });
}

// ----------------------------------------------
// 4. PROJECT ANALYZER (Module 2)
// ----------------------------------------------
export async function handleAnalyzer(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Project Understanding expert. Break down client requirements into simple bullet points. List features, modules, and estimated work days. Be extremely clear.`,
  });
}

// ----------------------------------------------
// 5. TASK PLANNER (Module 8 & 20)
// ----------------------------------------------
export async function handlePlanning(userId: string, message: string, ctx: BrainContext) {
  if (!ctx.currentProject) {
    return "âŒ Select a project first to create a plan.";
  }

  try {
    const result = await generateProjectPlan({
      userId,
      projectId: ctx.currentProject.id,
      message,
      projectTitle: ctx.currentProject.title,
      clientName: ctx.currentProject.clientName,
      existingTasksCount: 0, // you could fetch current count, but we'll pass 0 for simplicity
    });

    return `âœ… **Project Plan Created!**\n\nI've added ${result.tasksCreated.length} tasks to this project.\n\nâ€¢ Total estimated hours: ${result.totalHours}h\nâ€¢ Open your Project Workspace to view, reorder, and start execution.\n\n**Tasks created:**\n${result.tasksCreated
      .map((t, i) => `${i + 1}. ${t.title}`)
      .join("\n")}`;
  } catch (error: any) {
    console.error("[PLANNING_ERROR]", error);
    return `âŒ Failed to create plan: ${error.message}. Please try again with more details.`;
  }
}

// ----------------------------------------------
// 6. NEGOTIATION COACH (Module 5)
// ----------------------------------------------
export async function handleNegotiation(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Negotiation Coach. Client: ${ctx.currentProject?.clientName || "Client"}. Provide professional replies, psychology tricks, discount strategies, and upsell tactics. Format as bullet points.`,
  });
}

// ----------------------------------------------
// 7. TECH ARCHITECT (Module 7)
// ----------------------------------------------
export async function handleTechArchitect(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Senior Technical Architect. Recommend best tech stack (React, Node, Python, Supabase, etc.) based on requirements. Explain WHY each choice fits. Consider scalability and cost.`,
  });
}

// ----------------------------------------------
// 8. TIME ESTIMATOR (Module 9)
// ----------------------------------------------
export async function handleTimeEstimator(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Time Estimator. Estimate Senior, Intermediate, and Junior developer hours for the described project. Provide realistic timeline and what to tell the client.`,
  });
}

// ----------------------------------------------
// 9. INTERVIEW COACH (Module 13)
// ----------------------------------------------
export async function handleInterviewCoach(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Interview Coach. Generate possible client questions, best answers, and confidence tips for the discovery call. Be very practical.`,
  });
}

// ----------------------------------------------
// 10. PROPOSAL REVIEWER (Module 18)
// ----------------------------------------------
export async function handleReviewer(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are AI Reviewer. Score the proposal out of 100. Give feedback on Grammar, Sales, Confidence, Professionalism, and Technical Accuracy. Suggest improvements.`,
  });
}

// ----------------------------------------------
// 11. CONTRACT ASSISTANT (Module 15)
// ----------------------------------------------
export async function handleContract(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Contract Assistant. Generate Agreement, Terms, Milestones, Refund, Revision, and Ownership clauses based on the context. Use professional legal language.`,
  });
}

// ----------------------------------------------
// 12. DAILY MENTOR (Module 17)
// ----------------------------------------------
export async function handleMentor(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Daily Mentor. Give actual actionable guidance (not motivation). Today's goal: Send proposals, improve portfolio, reply clients, learn skills. Provide specific tasks.`,
  });
}

// ----------------------------------------------
// 13. UPSELL ENGINE (Module 25)
// ----------------------------------------------
export async function handleUpsell(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Upsell Engine. Suggest Maintenance, SEO, Mobile App, Admin Panel, Hosting, Monthly Support plans after project delivery. Provide pricing recommendations.`,
  });
}

// ----------------------------------------------
// 14. QA ENGINEER (Module 22)
// ----------------------------------------------
export async function handleQA(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are QA Engineer. Generate pre-delivery checklist: Responsive, Performance, SEO, Accessibility, Security, Errors. Provide detailed test cases.`,
  });
}

// ----------------------------------------------
// 15. DELIVERY ASSISTANT (Module 23)
// ----------------------------------------------
export async function handleDelivery(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Delivery Assistant. Write professional delivery message, video script, documentation outline, and deployment notes.`,
  });
}

// ----------------------------------------------
// 16. SKILL GAP DETECTOR (Module 12)
// ----------------------------------------------
export async function handleSkillGap(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Skill Gap Detector. Analyze the project requirements and list exactly 3-5 things the freelancer needs to learn. Provide a learning roadmap.`,
  });
}

// ----------------------------------------------
// 17. SCOPE GENERATOR (Module 16)
// ----------------------------------------------
export async function handleScopeGenerator(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Scope Generator. Automatically write: Included, Not Included, Extra Charges, Timeline, Milestones. Be very strict to avoid scope creep.`,
  });
}

// ----------------------------------------------
// 18. CLIENT RELATIONSHIP MANAGER (Module 26)
// ----------------------------------------------


// ----------------------------------------------
// 19. BUSINESS COACH (Module 27)
// ----------------------------------------------
export async function handleBusinessCoach(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Business Coach. Analyze monthly revenue, average project value, conversion rate, proposal success rate. Provide weaknesses and growth advice.`,
  });
}

// ----------------------------------------------
// 20. HEALTH MONITOR (Module 28)
// ----------------------------------------------
export async function handleHealthMonitor(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Health Monitor. Detect burnout signs, check overloaded schedule, recommend breaks, suggest better planning.`,
  });
}

// ----------------------------------------------
// 21. CALL PREPARATION (Module 14)
// ----------------------------------------------
export async function handleCallPrep(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Call Prep Assistant. Generate a list of questions for Google Meet/Zoom. Discovery Call questions and Requirements Call questions.`,
  });
}

// ----------------------------------------------
// 22. REVISION ASSISTANT (Module 24)
// ----------------------------------------------
export async function handleRevisionAssistant(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Revision Assistant. Analyze client revision requests. Tell if they are Valid, Invalid, Free, or Paid. Provide the best reply.`,
  });
}

// ----------------------------------------------
// 23. PORTFOLIO MATCHER (Module 11)
// ----------------------------------------------
export async function handlePortfolioMatcher(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Portfolio Matcher. Suggest which past project to attach, which screenshot to send, which GitHub to share, which case study is best for this client.`,
  });
}

// ----------------------------------------------
// 24. LEARNING COACH (Module 19)
// ----------------------------------------------
export async function handleLearningCoach(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Learning Coach. Turn the client's project into a course. E.g., Client wants Stripe -> Learn Stripe -> Practice -> Implement -> Deliver.`,
  });
}

// ----------------------------------------------
// 25. DEADLINE MANAGER (Module 21)
// ----------------------------------------------
export async function handleDeadlineManager(userId: string, message: string, ctx: BrainContext) {
  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction: `You are Deadline Manager. Provide daily reminders, pending tasks, late warnings, and priority list based on the project timeline.`,
  });
}

// ----------------------------------------------
// 26. AI DECISION ENGINE (Module 30) - Applied to all
// ----------------------------------------------
// This is auto-added in the router by appending "Decision" at the end.
// We'll handle it in the router.

// ----------------------------------------------
// 27. GENERAL CHAT (Module 6 & 17) - FALLBACK
// ----------------------------------------------
// src/lib/ai/brain/tools/index.ts (Only handleChat part, replace it)

// ----- TOOL: GENERAL CHAT (PERSONA ENFORCEMENT LAYER) -----
// src/lib/ai/brain/tools/index.ts (handleChat function - REPLACE THIS)

// ----- TOOL: GENERAL CHAT (PERSONA + COMPANY PROFILE ENFORCEMENT) -----
// handleChat function (inside tools/index.ts)
// â”€â”€â”€ CHAT MODE: FAST, SHORT, PERSONAL â”€â”€â”€
export async function handleChat(
  userId: string,
  message: string,
  context: BrainContext
): Promise<string> {
  // ðŸ”¥ Only fetch last 3 messages for context (saves tokens)
  const recentMemory = context.memory.lastMessages.slice(-3);
  const memoryContext = recentMemory
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  // ðŸ¢ COMPANY PROFILE (concise)
  const COMPANY = "GigThink AI by CodEarn Tech â€” Freelance OS.";

  // ðŸ‘¤ Get user name (if available from Supabase)
  let userName = "";
  try {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();
    if (profile?.name) userName = profile.name;
  } catch {
    // ignore
  }

  const systemInstruction = `
You are a Senior Freelance Consultant representing ${context.agency.name}, powered by ${COMPANY}.

**RULES (STRICT):**
- Respond in the SAME language as the user: if they write in Roman Urdu (e.g., "kia hal hai"), reply in Roman Urdu. If English, reply in English. Mix is allowed.
- Keep response UNDER 80 WORDS (max 4-5 short sentences).
- Be direct, professional, and personal. Use the user's name if known: ${userName ? `"${userName}"` : "friend"}.
- End with a short, engaging question.
- Never mention you're an AI or bot.
- No lengthy explanations. Just the core advice.

**CONTEXT:**
Agency: ${context.agency.name}
${context.currentProject ? `Project: ${context.currentProject.title} (client: ${context.currentProject.clientName})` : "No project selected."}
Recent chat: ${memoryContext || "New chat."}

User message: "${message}"
  `;

  return await generateAIResponse({
    userId,
    prompt: message,
    isProposal: false,
    isSectionGeneration: false,
    systemInstruction,
  });
}


// ==============================================
// NEW ACTION TOOLS (Phase 3)
// ==============================================

// 1. SEARCH LEADS
export async function handleSearchLeads(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    // Leads collection se search karo (simple text match on title/description)
    // Yahan hum message se keywords nikal kar query banayenge (basic)
    const query = { userId: userId }; // Sirf apne leads
    const leadsCollection = db.collection("leads");
    const leads = await leadsCollection.find(query).limit(10).toArray();

    if (!leads || leads.length === 0) {
      return "âŒ Koi leads nahi mili. Aap pehle leads import ya create karein.";
    }

    // Simple formatting
    const leadList = leads
      .map(
        (l: any, i: number) =>
          `${i + 1}. **${l.title || "Untitled Lead"}**\n   Company: ${l.company || "N/A"}\n   Email: ${l.email || "N/A"}\n   Score: ${l.score || "N/A"}\n`
      )
      .join("\n");

    return `âœ… **${leads.length} leads mili hain:**\n\n${leadList}\n\nAap kisi lead ko qualify ya save karne ko keh sakte hain.`;
  } catch (error: any) {
    console.error("[SEARCH_LEADS] Error:", error);
    return `âŒ Leads search mein masla aaya: ${error.message}`;
  }
}

// 2. CREATE CLIENT
export async function handleCreateClient(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    // Client name extract karo
    const nameMatch = message.match(/(?:client|naam|name)\s*(?:hai|:)?\s*["']?([^"',]+)/i);
    const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = message.match(/\+?\d[\d\s-]{7,}/); // simple phone
    const projectTitleMatch = message.match(/(?:project|title|project_title)\s*(?:hai|:)?\s*["']?([^"',]+)/i);

    const clientName = nameMatch?.[1]?.trim();
    const clientEmail = emailMatch?.[0] || null;
    const phone = phoneMatch?.[0] || null;
    const projectTitle = projectTitleMatch?.[1]?.trim();

    // Zaroori fields missing hon to sawal karein
    if (!clientName) {
      return "ðŸ¤” Client ka naam to batayein. Jaise: 'Acme Digital naam ka client banao'";
    }

    if (!projectTitle) {
      return `ðŸ¤” "${clientName}" ke liye project title kya hai? Jaise: 'Website Redesign' project title ke saath client banao`;
    }

    // Supabase client (object, callable nahi)
    const supabase = createSupabaseAdminClient; // bina parentheses/await ke

    // Duplicate check (email se)
    if (clientEmail) {
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .eq("email", clientEmail)
        .single();

      if (existing) {
        return `âš ï¸ Pehle se client "${clientName}" email ${clientEmail} ke saath maujood hai. Duplicate nahi banaya.`;
      }
    }

    // Insert into Supabase table "clients" with correct columns
    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: userId,
        client_name: clientName,
        company_name: null, // optional, aap chahein to extract kar sakte hain
        email: clientEmail,
        phone: phone,
        project_title: projectTitle,
        project_summary: null,
        budget: 0,
        currency: "USD",
        deadline: null,
        status: "lead",
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return `âœ… Client "${clientName}" (${projectTitle}) successfully create ho gaya! (ID: ${data.id})\n\nAb aap iske liye proposal generate kar sakte hain.`;
  } catch (error: any) {
    console.error("[CREATE_CLIENT] Error:", error);
    return `âŒ Client create karne mein masla: ${error.message}`;
  }
}

// 3. SAVE PROPOSAL (simple)
export async function handleSaveProposal(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    // Yahan hum assume karte hain ke currentProposal context mein hai
    if (!ctx.currentProposal) {
      return "ðŸ¤” Koi active proposal nahi mila. Pehle proposal generate karein ya select karein.";
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    const proposalsCollection = db.collection("proposals");

    const proposalData = {
      ...ctx.currentProposal,
      userId,
      updatedAt: new Date(),
    };

    const result = await proposalsCollection.updateOne(
      { _id: ctx.currentProposal._id, userId },
      { $set: proposalData },
      { upsert: true }
    );

    return `âœ… Proposal save ho gaya. (${result.upsertedCount ? "naya banaya" : "update kiya"})`;
  } catch (error: any) {
    console.error("[SAVE_PROPOSAL] Error:", error);
    return `âŒ Proposal save karne mein masla: ${error.message}`;
  }
}

// 4. DRAFT EMAIL (high risk, no sending yet)
export async function handleDraftEmail(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    // AI se email draft generate karo
    const emailDraft = await generateAIResponse({
      userId,
      prompt: message,
      isProposal: false,
      isSectionGeneration: false,
      systemInstruction: `You are an email drafting expert. Write a professional, concise email based on user request. Return only the email body, with subject line at top.`,
    });

    return `ðŸ“§ **Email Draft Ready:**\n\n---\n${emailDraft}\n---\n\nâš ï¸ *Yeh abhi draft hai, send nahi hua. Send karne ke liye confirm karein.*`;
  } catch (error: any) {
    console.error("[DRAFT_EMAIL] Error:", error);
    return `âŒ Email draft banane mein masla: ${error.message}`;
  }
}

// 5. CREATE TASK
export async function handleCreateTask(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    if (!ctx.currentProject) {
      return "âŒ Pehle koi project select karein. 'project select' keh kar active project choose kar sakte hain.";
    }

    // Simple task title extract from message (remove common words)
    const taskTitle = message.replace(/create task|task banao|add task/gi, "").trim();
    if (!taskTitle) {
      return "ðŸ¤” Task ka naam to batayein, jaise: 'Design homepage' task banao";
    }

    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    const tasksCollection = db.collection("tasks");

    const newTask = {
      userId,
      projectId: ctx.currentProject._id,
      title: taskTitle,
      status: "todo",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tasksCollection.insertOne(newTask);

    return `âœ… Task "${taskTitle}" project "${ctx.currentProject.title}" mein add ho gaya.`;
  } catch (error: any) {
    console.error("[CREATE_TASK] Error:", error);
    return `âŒ Task create karne mein masla: ${error.message}`;
  }
}

export async function handleListClients(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    const supabase = createSupabaseAdminClient;

    const { data: clients, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    if (!clients || clients.length === 0) {
      return "âŒ Aapke paas abhi koi client nahi hai. Aap naya client create kar sakte hain.";
    }

    const clientList = clients
      .map(
        (c: any, i: number) =>
          `${i + 1}. **${c.client_name}**\n   Project: ${c.project_title || "N/A"}\n   Email: ${c.email || "N/A"}\n   Status: ${c.status || "N/A"}\n`
      )
      .join("\n");

    return `âœ… **Aapke ${clients.length} clients hain:**\n\n${clientList}`;
  } catch (error: any) {
    console.error("[LIST_CLIENTS] Error:", error);
    return `âŒ Clients list lene mein masla: ${error.message}`;
  }
}



export async function handleCRM(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    // Agar user ne clients list mangi to real data do
    if (
      message.toLowerCase().includes("client") &&
      (message.toLowerCase().includes("list") ||
        message.toLowerCase().includes("mere") ||
        message.toLowerCase().includes("kaun") ||
        message.toLowerCase().includes("kon"))
    ) {
      return await handleListClients(userId, message, ctx);
    }

    // Warna generic CRM advice do
    const supabase = createSupabaseAdminClient;
    const { data: clients } = await supabase
      .from("clients")
      .select("client_name, status, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);

    let clientInfo = "No clients found.";
    if (clients && clients.length > 0) {
      clientInfo = clients
        .map((c: any) => `${c.client_name} (${c.status})`)
        .join(", ");
    }

    return await generateAIResponse({
      userId,
      prompt: message,
      isProposal: false,
      isSectionGeneration: false,
      systemInstruction: `You are CRM. Recent clients: ${clientInfo}. Suggest follow-ups, check-in messages, retention strategies, and repeat work reminders.`,
    });
  } catch (error: any) {
    console.error("[CRM] Error:", error);
    return `âŒ CRM mein masla: ${error.message}`;
  }
}


// ==============================================
// MORE ACTION TOOLS (Phase 5)
// ==============================================

// 1. LIST PROPOSALS
export async function handleListProposals(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    const proposalsCollection = db.collection("proposals");
    const proposals = await proposalsCollection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .toArray();

    if (!proposals || proposals.length === 0) {
      return "âŒ Aapke paas koi proposal nahi hai. Aap naya proposal generate kar sakte hain.";
    }

    const list = proposals
      .map(
        (p: any, i: number) =>
          `${i + 1}. **${p.clientName || "Unknown Client"}**\n   Total: ${p.currency || "USD"} ${p.totalBudget || "N/A"}\n   Status: ${p.status || "draft"}\n`
      )
      .join("\n");

    return `âœ… **Aapke ${proposals.length} proposals hain:**\n\n${list}`;
  } catch (error: any) {
    console.error("[LIST_PROPOSALS] Error:", error);
    return `âŒ Proposals list lene mein masla: ${error.message}`;
  }
}

// 2. DELETE CLIENT (High risk)
export async function handleDeleteClient(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    // Extract client name or id from message
    const nameMatch = message.match(/(?:delete|remove|hatana)\s+(?:client\s+)?["']?([^"']+)/i);
    const clientName = nameMatch?.[1]?.trim();
    if (!clientName) {
      return "ðŸ¤” Kis client ko delete karna hai? Naam batayein.";
    }

    // Supabase se search karo
    const supabase = createSupabaseAdminClient;
    const { data: clients, error } = await supabase
      .from("clients")
      .select("id, client_name")
      .eq("user_id", userId)
      .ilike("client_name", `%${clientName}%`);

    if (error) throw new Error(error.message);
    if (!clients || clients.length === 0) {
      return `âŒ "${clientName}" naam ka koi client nahi mila.`;
    }

    // Agar multiple matches hon to pehla le lo (ya list dikhao)
    if (clients.length > 1) {
      const options = clients.map((c: any, i: number) => `${i + 1}. ${c.client_name} (ID: ${c.id})`).join("\n");
      return `âš ï¸ ${clients.length} clients milay. Kaunsa delete karna hai?\n${options}`;
    }

    const clientToDelete = clients[0];

    // High risk: confirm zaroori hai
    // Yahan hum direct delete nahi karte, balke confirmation request return karte hain
    // Frontend confirm karega to woh dobara call karega with action=confirm

    return `âš ï¸ **CONFIRMATION REQUIRED**\n\nKya aap waqai client "${clientToDelete.client_name}" ko delete karna chahte hain? Ye action irreversible hai.\n\nClient ID: ${clientToDelete.id}\n\nAgar haan, to "confirm delete ${clientToDelete.id}" bhejein.`;
  } catch (error: any) {
    console.error("[DELETE_CLIENT] Error:", error);
    return `âŒ Client delete karne mein masla: ${error.message}`;
  }
}

// 3. SEARCH OPPORTUNITIES
export async function handleSearchOpportunities(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    const oppCollection = db.collection("opportunities");
    const opportunities = await oppCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    if (!opportunities || opportunities.length === 0) {
      return "âŒ Koi opportunities nahi mili. Aap Opportunity Discovery se naye leads dhundh sakte hain.";
    }

    const list = opportunities
      .map(
        (o: any, i: number) =>
          `${i + 1}. **${o.title || "Opportunity"}**\n   Company: ${o.company || "N/A"}\n   Budget: ${o.budget || "N/A"}\n   Score: ${o.score || "N/A"}\n`
      )
      .join("\n");

    return `âœ… **Top opportunities:**\n\n${list}`;
  } catch (error: any) {
    console.error("[SEARCH_OPPORTUNITIES] Error:", error);
    return `âŒ Opportunities search mein masla: ${error.message}`;
  }
}

// 4. SCHEDULE FOLLOW-UP (Medium risk)
export async function handleScheduleFollowup(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    // Simple: just return a confirmation that follow-up scheduled (mock for now)
    // Real implementation: call existing follow-ups API or database
    return "âœ… Follow-up schedule kar diya gaya hai (demo). Aap apne Follow-ups section mein dekh sakte hain.";
  } catch (error: any) {
    console.error("[SCHEDULE_FOLLOWUP] Error:", error);
    return `âŒ Follow-up schedule karne mein masla: ${error.message}`;
  }
}


// Set preference tool
export async function handleSetPreference(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    // Extract key-value from message, e.g., "preference: budgetMin 5000"
    const match = message.match(/preference\s*:?\s*(\w+)\s+([\w\s,]+)/i);
    if (!match) {
      return "ðŸ¤” Preference ka format galat hai. Aise bolein: 'set preference budgetMin 5000'";
    }
    const key = match[1].trim();
    const valueStr = match[2].trim();
    // Simple conversion: number if numeric, else string
    let value: any = valueStr;
    if (!isNaN(Number(valueStr))) {
      value = Number(valueStr);
    } else if (valueStr.includes(",")) {
      value = valueStr.split(",").map(s => s.trim());
    }

    await setPreference(userId, key, value);
    return `âœ… Preference "${key}" set kar di gayi: ${JSON.stringify(value)}`;
  } catch (error: any) {
    console.error("[SET_PREF] Error:", error);
    return `âŒ Preference set karne mein masla: ${error.message}`;
  }
}

// Get preferences tool
export async function handleGetPreferences(
  userId: string,
  message: string,
  ctx: BrainContext
): Promise<string> {
  try {
    const prefs = await getPreferences(userId);
    const keys = Object.keys(prefs);
    if (keys.length === 0) {
      return "âŒ Aapki koi preferences set nahi hain. Aap 'set preference <key> <value>' se set kar sakte hain.";
    }
    const prefsStr = keys.map(k => `**${k}**: ${JSON.stringify(prefs[k])}`).join("\n");
    return `âœ… **Aapki preferences:**\n\n${prefsStr}`;
  } catch (error: any) {
    console.error("[GET_PREFS] Error:", error);
    return `âŒ Preferences lene mein masla: ${error.message}`;
  }
}
