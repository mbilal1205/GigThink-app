import mongoose, { Schema, Document } from "mongoose";

export interface IProposalSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  isCustom: boolean;
  isVisible: boolean;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProposalEvent {
  event: string;
  timestamp: Date;
  metadata?: string;
}

export interface IProposal extends Document {
  userId: string;
  clientId: string;
  projectId?: string;
  title: string;
  status: 'draft' | 'review' | 'sent' | 'accepted' | 'rejected';
  version: number;
  sections: IProposalSection[];
  metadata: {
    clientName: string;
    clientCompany?: string;
    clientEmail?: string;
    totalBudget?: number;
    currency: string;
    validUntil?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
  template: string;
  isTemplate: boolean;
  shareId?: string;
  shareLink?: string;
  sharedAt?: Date;
  views: number;
  lastViewedAt?: Date;
  clientAction?: 'none' | 'accepted' | 'rejected' | 'changes_requested';
  actionAt?: Date;
  events: IProposalEvent[];
}

const ProposalSectionSchema = new Schema<IProposalSection>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  order: { type: Number, required: true },
  isCustom: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true },
  aiGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ProposalEventSchema = new Schema<IProposalEvent>({
  event: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: String, default: "" },
});

const ProposalSchema = new Schema<IProposal>(
  {
    userId: { type: String, required: true, index: true },
    clientId: { type: String, required: true, index: true },
    projectId: { type: String, default: null },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'review', 'sent', 'accepted', 'rejected'],
      default: 'draft',
    },
    version: { type: Number, default: 1 },
    sections: [ProposalSectionSchema],
    metadata: {
      clientName: { type: String, required: true },
      clientCompany: { type: String, default: "" },
      clientEmail: { type: String, default: "" },
      totalBudget: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      validUntil: { type: Date, default: null },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
    template: { type: String, default: "professional" },
    isTemplate: { type: Boolean, default: false },

    // ✅ No unique constraint – only a plain index for fast lookup
    shareId: {
      type: String,
      index: true,        // non-unique index for queries
    },
    shareLink: { type: String, default: "" },
    sharedAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null },
    clientAction: {
      type: String,
      enum: ['none', 'accepted', 'rejected', 'changes_requested'],
      default: 'none',
    },
    actionAt: { type: Date, default: null },
    events: { type: [ProposalEventSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Compound indexes (keep existing ones)
ProposalSchema.index({ userId: 1, clientId: 1 });
ProposalSchema.index({ clientId: 1, status: 1 });

export default mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);