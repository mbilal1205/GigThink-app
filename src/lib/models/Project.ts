import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true, 
      index: true 
    },
    title: { 
      type: String, 
      required: true 
    },
    clientName: { 
      type: String, 
      default: 'Unknown Client' 
    },
    description: {
      type: String,
      default: '',
    },
    deadline: {
      type: Date,
      default: null,
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    bufferHours: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0, // 0-100 (auto-calculated from tasks)
    },
    healthScore: {
      type: Number,
      default: 100, // 0-100 (AI can update later)
    },
    status: {
      type: String,
      enum: ["Draft", "Generating", "Review", "In Progress", "Completed", "On Hold"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Project || mongoose.model('Project', projectSchema);