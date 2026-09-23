// src/lib/ai/brain/context-builder.ts
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getRecentMessages } from "./memory-service";
import { getPreferences } from "./preference-service"; // <-- naya import
import mongoose from "mongoose";

export interface BrainContext {
  userId: string;
  agency: {
    name: string;
    currency: string;
    hourlyRate: number;
    website?: string;
    email?: string;
    services?: string[];
    targetMarket?: string[];
    pastClients?: string[];
    description?: string;
  };
  userProfile?: {
    name: string;
    email: string;
  };
  currentProject?: any;
  currentProposal?: any;
  projects: any[];
  services: string[];
  preferences?: any; // <-- user preferences
  memory: {
    lastMessages: { role: string; content: string }[];
  };
}

export async function buildBrainContext(
  userId: string,
  sessionId?: string
): Promise<BrainContext> {
  const context: BrainContext = {
    userId,
    agency: {
      name: "Your Agency",
      currency: "USD",
      hourlyRate: 50,
      services: [],
      targetMarket: [],
      pastClients: [],
      description: "",
    },
    projects: [],
    services: [],
    memory: {
      lastMessages: [],
    },
  };

  try {
    // 1. Supabase user profile
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", userId)
      .single();

    if (profile) {
      context.userProfile = {
        name: profile.name || "",
        email: profile.email || "",
      };
      if (profile.name) context.agency.name = profile.name;
    }

    // 2. MongoDB data fetch
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return context;

    // 2.1 Agency profile
    const agencyCollections = ["agencies", "agencyprofiles", "agency_profiles"];
    let agency = null;
    for (const collName of agencyCollections) {
      try {
        const coll = db.collection(collName);
        agency = await coll.findOne({ userId });
        if (agency) break;
      } catch (e) {}
    }

    if (agency) {
      context.agency = {
        name: agency.name || context.agency.name,
        currency: agency.currency || context.agency.currency,
        hourlyRate: agency.hourlyRate || agency.rate || context.agency.hourlyRate,
        website: agency.website || "",
        email: agency.email || "",
        services: agency.services || [],
        targetMarket: agency.targetMarket || agency.target_market || [],
        pastClients: agency.pastClients || agency.clients || [],
        description: agency.description || agency.bio || "",
      };
    } else {
      const userColl = db.collection("users");
      const userData = await userColl.findOne({ userId });
      if (userData) {
        context.agency.services = userData.services || [];
        context.agency.description = userData.bio || userData.description || "";
      }
    }

    // 2.2 Recent projects
    const projectCollection = db.collection("projects");
    const recentProjects = await projectCollection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();
    context.projects = recentProjects || [];

    context.currentProject =
      recentProjects.find((p: any) => p.status !== "archived") || recentProjects[0] || undefined;

    // 2.3 Latest proposal
    const proposalCollection = db.collection("proposals");
    const latestProposal = await proposalCollection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(1)
      .toArray();
    context.currentProposal = latestProposal?.[0] || undefined;

    // 2.4 Services
    if (!context.agency.services || context.agency.services.length === 0) {
      const serviceSet = new Set<string>();
      context.projects.forEach((proj: any) => {
        if (proj.technologies && Array.isArray(proj.technologies)) {
          proj.technologies.forEach((tech: string) => serviceSet.add(tech));
        }
        if (proj.service) serviceSet.add(proj.service);
        if (proj.type) serviceSet.add(proj.type);
      });
      context.services = Array.from(serviceSet).slice(0, 10);
      context.agency.services = context.services;
    } else {
      context.services = context.agency.services;
    }
  } catch (error) {
    console.error("[CONTEXT_BUILDER] Error fetching context:", error);
  }

  // 3. Load preferences (new)
  try {
    const prefs = await getPreferences(userId);
    context.preferences = prefs;
  } catch (err) {
    console.error("[CONTEXT_BUILDER] Preferences load error:", err);
    context.preferences = {};
  }

  // 4. Load memory (session-based)
  if (sessionId) {
    try {
      const recentMessages = await getRecentMessages(userId, sessionId, 6);
      context.memory.lastMessages = recentMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
    } catch (err) {
      console.error("[CONTEXT_BUILDER] Error loading memory:", err);
    }
  }

  return context;
}