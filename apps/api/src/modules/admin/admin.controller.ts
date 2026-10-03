import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import {
  updateUserRoleSchema,
  updateUserStatusSchema,
  propertyModerationSchema,
  getAnalyticsSchema,
} from './admin.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const adminService = new AdminService();

// ========== User Management ==========

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as string;
  const search = req.query.search as string;

  const result = await adminService.getAllUsers(page, limit, role, search);

  return ApiResponse.success(res, {
    users: result.users,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await adminService.getUserById(userId);

  if (!user) {
    return ApiResponse.error(res, 'User not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, { user });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = updateUserRoleSchema.parse(req.body);

  const user = await adminService.updateUserRole(validatedData);

  if (!user) {
    return ApiResponse.error(res, 'User not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, { user }, 'User role updated successfully');
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = updateUserStatusSchema.parse(req.body);

  const user = await adminService.updateUserStatus(validatedData);

  if (!user) {
    return ApiResponse.error(res, 'User not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, { user }, 'User status updated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const deleted = await adminService.deleteUser(userId);

  if (!deleted) {
    return ApiResponse.error(res, 'User not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, null, 'User deleted successfully');
});

// ========== Property Moderation ==========

export const getAllProperties = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as 'published' | 'unpublished' | 'hidden';
  const search = req.query.search as string;

  const result = await adminService.getAllProperties(page, limit, status, search);

  return ApiResponse.success(res, {
    properties: result.properties,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const moderateProperty = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = propertyModerationSchema.parse(req.body);

  const property = await adminService.moderateProperty(validatedData);

  return ApiResponse.success(res, { property }, `Property ${validatedData.action}ed successfully`);
});

export const adminDeleteProperty = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;

  const deleted = await adminService.deleteProperty(propertyId);

  if (!deleted) {
    return ApiResponse.error(res, 'Property not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, null, 'Property deleted successfully');
});

// ========== Booking Oversight ==========

export const getAllBookings = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const result = await adminService.getAllBookings(page, limit, status, startDate, endDate);

  return ApiResponse.success(res, {
    bookings: result.bookings,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const forceCancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const { reason } = req.body;

  const booking = await adminService.forceCancelBooking(bookingId, reason);

  return ApiResponse.success(res, { booking }, 'Booking cancelled successfully');
});

// ========== System Analytics ==========

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = getAnalyticsSchema.parse({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    period: req.query.period as string,
  });

  const analytics = await adminService.getAnalytics(validatedData);

  return ApiResponse.success(res, { analytics });
});

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();

  return ApiResponse.success(res, { stats });
});