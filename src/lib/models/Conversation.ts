// models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true 
    },
    source: { 
      type: String, 
      enum: ['WhatsApp', 'Email', 'Meeting', 'Manual'], 
      required: true 
    },
    rawText: { 
      type: String, 
      required: true // Original paste ki hui chat
    },
    // AI Engineering Layer ka output yahan save hoga
    extractedContext: {
      projectType: String,
      detectedModules: [String],
      missingInformation: [String], // Jo AI user se mazeed poochega
      isContextComplete: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);