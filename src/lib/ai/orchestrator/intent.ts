// lib/ai/orchestrator/intent.ts

export type DetectedIntent = {
  industry?: string;
  tech?: string;
  pricing?: string;
  module?: string;
};

// 🗺️ DETECTION CONFIGURATION (Centralized Mapping)
// Ab sab kuch yahan hai. Naya industry add karna ho toh bas yahan add karo.
const DETECTION_MAP: Record<keyof DetectedIntent, Record<string, string[]>> = {
  industry: {
    restaurant: ["restaurant", "menu", "food", "cafe"],
    saas: ["saas", "subscription", "mrr", "churn"],
    ecommerce: ["ecommerce", "shop", "cart", "store"],
    healthcare: ["healthcare", "clinic", "patient", "hipaa"],
    fintech: ["fintech", "banking", "crypto", "wallet"],
    realestate: ["real estate", "property", "listing", "mls"],
    education: ["education", "lms", "course", "student"],
    travel: ["travel", "booking", "hotel", "tour"],
    automotive: ["car", "dealership", "automotive", "vin"],
    legal: ["law", "legal", "attorney", "firm"]
  },
  tech: {
    frontend: ["next.js", "react", "frontend", "ui"],
    backend: ["node", "python", "backend", "api"],
    database: ["postgres", "mongodb", "database", "supabase"],
    cloud: ["aws", "vercel", "deploy", "cloud"],
    mobile: ["mobile", "flutter", "react native", "ios"]
  },
  pricing: {
    hourly: ["hourly", "per hour"],
    fixed: ["fixed", "flat rate"],
    enterprise: ["enterprise", "retainer", "value based"]
  },
  module: {
    proposal: ["proposal", "cover letter", "bid"],
    objections: ["objection", "too high", "budget"],
    followup: ["follow up", "ghosted"]
  }
};

export const detectIntent = (userPrompt: string): DetectedIntent => {
  const prompt = (userPrompt || "").toLowerCase();
  const intent: DetectedIntent = {};

  // 🚀 LOOPING ENGINE (Clean & Scalable)
  // Yeh loop khudh hi check karega ke prompt mein koi keyword hai ya nahi.
  for (const [category, options] of Object.entries(DETECTION_MAP)) {
    for (const [key, keywords] of Object.entries(options)) {
      if (keywords.some((word) => prompt.includes(word))) {
        intent[category as keyof DetectedIntent] = key;
        break; // Ek category mein ek hi intent kafi hai
      }
    }
  }

  return intent;
};