import { Request, Response } from 'express';
import { SupportTicketService } from './ticket.service';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  updateTicketPrioritySchema,
  assignTicketSchema,
  addTicketMessageSchema,
} from './ticket.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const ticketService = new SupportTicketService();

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createTicketSchema.parse(req.body);

  const ticket = await ticketService.createTicket(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      ticket: {
        id: ticket._id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
      },
    },
    'Support ticket created successfully',
    201
  );
});

export const getTicketById = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;

  const ticket = await ticketService.getTicketById(ticketId);

  if (!ticket) {
    return ApiResponse.error(res, 'Ticket not found', 'NOT_FOUND', 404);
  }

  // Authorization: user can view own ticket, staff/admin can view any
  if (ticket.userId.toString() !== req.user!.id && !['SUPPORT', 'ADMIN'].includes(req.user!.role)) {
    return ApiResponse.error(
      res,
      'You do not have permission to view this ticket',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  return ApiResponse.success(res, {
    ticket: {
      id: ticket._id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assignedTo: ticket.assignedTo,
      messages: ticket.messages,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    },
  });
});

export const getUserTickets = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const { tickets, total } = await ticketService.getUserTickets(
    req.user!.id,
    status,
    priority,
    limit,
    offset
  );

  return ApiResponse.success(res, {
    tickets: tickets.map(t => ({
      id: t._id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      category: t.category,
      assignedTo: t.assignedTo,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    pagination: { total, limit, offset },
  });
});

export const getAllTickets = asyncHandler(async (req: Request, res: Response) => {
  // Support staff and admin only
  if (!['SUPPORT', 'ADMIN'].includes(req.user!.role)) {
    return ApiResponse.error(
      res,
      'Only support staff can view all tickets',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const { tickets, total } = await ticketService.getAllTickets(status, priority, limit, offset);

  return ApiResponse.success(res, {
    tickets: tickets.map(t => ({
      id: t._id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      category: t.category,
      assignedTo: t.assignedTo,
      userId: t.userId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    pagination: { total, limit, offset },
  });
});

export const updateTicketStatus = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const validatedData = updateTicketStatusSchema.parse(req.body);

  const ticket = await ticketService.getTicketById(ticketId);
  if (!ticket) {
    return ApiResponse.error(res, 'Ticket not found', 'NOT_FOUND', 404);
  }

  // Authorization: support staff/admin only
  if (!['SUPPORT', 'ADMIN'].includes(req.user!.role)) {
    return ApiResponse.error(
      res,
      'Only support staff can update ticket status',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const updated = await ticketService.updateTicketStatus(ticketId, validatedData);

  return ApiResponse.success(res, {
    ticket: {
      id: updated!._id,
      status: updated!.status,
    },
  });
});

export const updateTicketPriority = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const validatedData = updateTicketPrioritySchema.parse(req.body);

  // Authorization: admin only
  if (req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'Only admins can update ticket priority',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const updated = await ticketService.updateTicketPriority(ticketId, validatedData);

  return ApiResponse.success(res, {
    ticket: {
      id: updated!._id,
      priority: updated!.priority,
    },
  });
});

export const assignTicket = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const validatedData = assignTicketSchema.parse(req.body);

  // Authorization: admin only
  if (req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'Only admins can assign tickets',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const updated = await ticketService.assignTicket(ticketId, validatedData);

  return ApiResponse.success(res, {
    ticket: {
      id: updated!._id,
      assignedTo: updated!.assignedTo,
    },
  });
});

export const addTicketMessage = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  const validatedData = addTicketMessageSchema.parse(req.body);

  const ticket = await ticketService.getTicketById(ticketId);
  if (!ticket) {
    return ApiResponse.error(res, 'Ticket not found', 'NOT_FOUND', 404);
  }

  // Authorization: ticket owner or support staff
  if (ticket.userId.toString() !== req.user!.id && !['SUPPORT', 'ADMIN'].includes(req.user!.role)) {
    return ApiResponse.error(
      res,
      'You do not have permission to add messages to this ticket',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const isStaff = ['SUPPORT', 'ADMIN'].includes(req.user!.role);
  const updated = await ticketService.addTicketMessage(ticketId, req.user!.id, validatedData, isStaff);

  return ApiResponse.success(
    res,
    {
      ticket: {
        id: updated!._id,
        messageCount: updated!.messages.length,
      },
    },
    'Message added successfully',
    201
  );
});

export const closeTicket = asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.params;

  const ticket = await ticketService.getTicketById(ticketId);
  if (!ticket) {
    return ApiResponse.error(res, 'Ticket not found', 'NOT_FOUND', 404);
  }

  // Authorization: ticket owner or support staff
  if (ticket.userId.toString() !== req.user!.id && !['SUPPORT', 'ADMIN'].includes(req.user!.role)) {
    return ApiResponse.error(
      res,
      'You do not have permission to close this ticket',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const updated = await ticketService.closeTicket(ticketId);

  return ApiResponse.success(res, {
    ticket: {
      id: updated!._id,
      status: updated!.status,
    },
  });
});

export const getTicketStats = asyncHandler(async (req: Request, res: Response) => {
  // Admin only
  if (req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'Only admins can view ticket statistics',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const stats = await ticketService.getTicketStats();

  return ApiResponse.success(res, {
    stats,
  });
});

export const getAssignedTickets = asyncHandler(async (req: Request, res: Response) => {
  // Support staff and admin only
  if (!['SUPPORT', 'ADMIN'].includes(req.user!.role)) {
    return ApiResponse.error(
      res,
      'Only support staff can view assigned tickets',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const { tickets, total } = await ticketService.getAssignedTickets(req.user!.id, limit, offset);

  return ApiResponse.success(res, {
    tickets: tickets.map(t => ({
      id: t._id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      userId: t.userId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    pagination: { total, limit, offset },
  });
});
