import { connectToDatabase } from "@/lib/db/mongodb";
import UserPreference from "@/lib/models/UserPreference";

export async function getPreferences(userId: string) {
  await connectToDatabase();
  const pref = await UserPreference.findOne({ userId });
  return pref?.preferences || {};
}

export async function setPreference(userId: string, key: string, value: any) {
  await connectToDatabase();
  const pref = await UserPreference.findOneAndUpdate(
    { userId },
    { $set: { [`preferences.${key}`]: value } },
    { upsert: true, new: true }
  );
  return pref.preferences;
}

export async function updatePreferences(userId: string, updates: Record<string, any>) {
  await connectToDatabase();
  const pref = await UserPreference.findOneAndUpdate(
    { userId },
    { $set: { preferences: updates } },
    { upsert: true, new: true }
  );
  return pref.preferences;
}