import mongoose, { Schema, Document } from "mongoose";

export interface IUserPreference extends Document {
  userId: string;
  preferences: {
    services?: string[];
    industries?: string[];
    budgetMin?: number;
    budgetMax?: number;
    communicationStyle?: string;
    proposalStyle?: string;
    targetCountries?: string[];
    [key: string]: any; // extra custom preferences
  };
  updatedAt: Date;
}

const UserPreferenceSchema = new Schema<IUserPreference>({
  userId: { type: String, required: true, unique: true },
  preferences: { type: Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.UserPreference || 
  mongoose.model<IUserPreference>("UserPreference", UserPreferenceSchema);