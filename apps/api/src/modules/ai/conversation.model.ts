import mongoose, { Schema, Document } from 'mongoose';

export interface IAIConversation extends Document {
  conversationId: string;
  userId: mongoose.Types.ObjectId;
  title?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const aiConversationSchema = new Schema<IAIConversation>(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      maxlength: 200,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user conversations
aiConversationSchema.index({ userId: 1, createdAt: -1 });

// TTL index: auto-delete conversations 90 days after last update
aiConversationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 7776000 });

export const AIConversation = mongoose.model<IAIConversation>('AIConversation', aiConversationSchema);
