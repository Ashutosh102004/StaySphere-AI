import mongoose, { Schema, Document } from 'mongoose';

export interface IAIMessage extends Document {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: {
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }[];
  toolResults?: {
    toolCallId: string;
    output: string;
  }[];
  createdAt: Date;
}

const aiMessageSchema = new Schema<IAIMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    toolCalls: [
      {
        id: String,
        type: String,
        function: {
          name: String,
          arguments: String,
        },
      },
    ],
    toolResults: [
      {
        toolCallId: String,
        output: String,
      },
    ],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient retrieval
aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const AIMessage = mongoose.model<IAIMessage>('AIMessage', aiMessageSchema);
