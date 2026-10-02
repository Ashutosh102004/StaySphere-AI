import mongoose, { Schema, Document } from 'mongoose';

export interface ISupportTicket extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category?: string;
  assignedTo?: mongoose.Types.ObjectId;
  messages: {
    userId: mongoose.Types.ObjectId;
    message: string;
    isStaff: boolean;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    category: {
      type: String,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    messages: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        isStaff: { type: Boolean, default: false },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
supportTicketSchema.index({ status: 1, priority: -1 });
supportTicketSchema.index({ userId: 1, createdAt: -1 });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
