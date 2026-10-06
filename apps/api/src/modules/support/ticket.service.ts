import { SupportTicket, ISupportTicket } from './ticket.model';
import { User } from '../users/user.model';
import {
  CreateTicketInput,
  UpdateTicketStatusInput,
  UpdateTicketPriorityInput,
  AssignTicketInput,
  AddTicketMessageInput,
} from './ticket.validation';
import mongoose from 'mongoose';
import { FilterQuery } from 'mongoose';

export class SupportTicketService {
  async createTicket(userId: string, data: CreateTicketInput): Promise<ISupportTicket> {
    const ticket = new SupportTicket({
      userId,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      category: data.category,
      status: 'OPEN',
      messages: [
        {
          userId,
          message: data.description,
          isStaff: false,
          timestamp: new Date(),
        },
      ],
    });

    await ticket.save();
    return ticket;
  }

  async getTicketById(ticketId: string): Promise<ISupportTicket | null> {
    return SupportTicket.findById(ticketId)
      .populate('userId', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName');
  }

  async getUserTickets(
    userId: string,
    status?: string,
    priority?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ tickets: ISupportTicket[]; total: number }> {
    const query: FilterQuery<ISupportTicket> = { userId: new mongoose.Types.ObjectId(userId) };

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName');

    return { tickets, total };
  }

  async getAllTickets(
    status?: string,
    priority?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ tickets: ISupportTicket[]; total: number }> {
    const query: FilterQuery<ISupportTicket> = {};

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .sort({ priority: -1, createdAt: 1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName');

    return { tickets, total };
  }

  async updateTicketStatus(
    ticketId: string,
    data: UpdateTicketStatusInput
  ): Promise<ISupportTicket | null> {
    return SupportTicket.findByIdAndUpdate(
      ticketId,
      { status: data.status },
      { new: true }
    )
      .populate('userId', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName');
  }

  async updateTicketPriority(
    ticketId: string,
    data: UpdateTicketPriorityInput
  ): Promise<ISupportTicket | null> {
    return SupportTicket.findByIdAndUpdate(
      ticketId,
      { priority: data.priority },
      { new: true }
    )
      .populate('userId', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName');
  }

  async assignTicket(
    ticketId: string,
    data: AssignTicketInput
  ): Promise<ISupportTicket | null> {
    // Verify user exists and is staff
    const user = await User.findById(data.assignedTo);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      throw new Error('User must be support staff or admin');
    }

    return SupportTicket.findByIdAndUpdate(
      ticketId,
      { assignedTo: data.assignedTo },
      { new: true }
    )
      .populate('userId', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName');
  }

  async addTicketMessage(
    ticketId: string,
    userId: string,
    data: AddTicketMessageInput,
    isStaff: boolean = false
  ): Promise<ISupportTicket | null> {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.messages.push({
      userId: new mongoose.Types.ObjectId(userId),
      message: data.message,
      isStaff,
      timestamp: new Date(),
    });

    await ticket.save();
    await ticket.populate('userId', 'email firstName lastName');
    await ticket.populate('assignedTo', 'email firstName lastName');
    return ticket;
  }

  async closeTicket(ticketId: string): Promise<ISupportTicket | null> {
    return SupportTicket.findByIdAndUpdate(
      ticketId,
      { status: 'CLOSED' },
      { new: true }
    )
      .populate('userId', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName');
  }

  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    avgResolutionTime: number;
    byPriority: Record<string, number>;
  }> {
    const statusStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await SupportTicket.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      avgResolutionTime: 0,
      byPriority: {} as Record<string, number>,
    };

    for (const stat of statusStats) {
      result[stat._id.toLowerCase() as keyof typeof result] = stat.count;
      result.total += stat.count;
    }

    for (const stat of priorityStats) {
      result.byPriority[stat._id] = stat.count;
    }

    return result;
  }

  async getAssignedTickets(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ tickets: ISupportTicket[]; total: number }> {
    const total = await SupportTicket.countDocuments({ assignedTo: userId });
    const tickets = await SupportTicket.find({ assignedTo: userId })
      .sort({ priority: -1, createdAt: 1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'email firstName lastName')
      .populate('assignedTo', 'email firstName lastName');

    return { tickets, total };
  }
}
