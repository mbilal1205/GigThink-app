// src/lib/db/mongodb.ts
import { MongoClient, Db } from "mongodb";

// ==========================================
// ENV VARIABLES (add these to .env.local)
// ==========================================
// MONGODB_URI=mongodb+srv://...
// MONGODB_DB_NAME=gigthink
// ==========================================

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "gigthink";

if (!MONGODB_URI) {
  throw new Error(
    "❌ MONGODB_URI is not defined. Add it to .env.local (or Vercel env vars)."
  );
}

// ==========================================
// Global cache — Next.js dev ke hot-reload pe
// multiple connections na bane
// ==========================================
interface MongoCache {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: MongoCache | undefined;
}

const cached: MongoCache = global._mongoCache ?? {
  client: null,
  db: null,
  promise: null,
};

if (!global._mongoCache) {
  global._mongoCache = cached;
}

// ==========================================
// connectToDatabase — Main export
// ==========================================
export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  // Already connected — return cached
  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db };
  }

  // Connection in progress — wait for it
  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI!, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    cached.client = await cached.promise;
    cached.db = cached.client.db(MONGODB_DB_NAME);
    return { client: cached.client, db: cached.db };
  } catch (error) {
    // Reset cache on failure so next call retries
    cached.promise = null;
    cached.client = null;
    cached.db = null;
    throw error;
  }
}

// ==========================================
// Optional: Graceful shutdown (for scripts)
// ==========================================
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.client) {
    await cached.client.close();
    cached.client = null;
    cached.db = null;
    cached.promise = null;
  }
}