import { Request, Response } from 'express';
import { AvailabilityService } from './availability.service';
import {
  createAvailabilitySchema,
  updateAvailabilitySchema,
  blockDatesSchema,
  unblockDatesSchema,
  setPricingSchema,
  setStayRequirementsSchema,
  setLeadTimeSchema,
  setAdvanceNoticeSchema,
  createSeasonSchema,
  bulkSetPricingSchema,
} from './availability.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const availabilityService = new AvailabilityService();

export const createAvailability = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createAvailabilitySchema.parse(req.body);

  const canModify = await availabilityService.canUserModifyProperty(
    validatedData.propertyId,
    req.user!.id,
    req.user!.role
  );

  if (!canModify) {
    return ApiResponse.error(
      res,
      'You do not have permission to modify this property',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const availability = await availabilityService.createAvailability(validatedData);

  return ApiResponse.success(
    res,
    {
      availability: {
        id: availability._id,
        propertyId: availability.propertyId,
        startDate: availability.startDate,
        endDate: availability.endDate,
        available: availability.available,
        customPrice: availability.customPrice,
        createdAt: availability.createdAt,
      },
    },
    'Availability created successfully',
    201
  );
});

export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const availability = await availabilityService.getAvailabilityById(id);

  if (!availability) {
    return ApiResponse.error(res, 'Availability not found', 'NOT_FOUND', 404);
  }

  // Check if user can view this availability
  const canModify = await availabilityService.canUserModifyProperty(
    availability.propertyId.toString(),
    req.user!.id,
    req.user!.role
  );

  if (!canModify) {
    return ApiResponse.error(
      res,
      'You do not have permission to view this availability',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  return ApiResponse.success(res, { availability });
});

export const getPropertyAvailabilities = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  const canModify = await availabilityService.canUserModifyProperty(
    propertyId,
    req.user!.id,
    req.user!.role
  );

  if (!canModify) {
    return ApiResponse.error(
      res,
      'You do not have permission to view this property',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const result = await availabilityService.getAvailabilitiesByProperty(propertyId, page, limit);

  return ApiResponse.success(res, {
    availabilities: result.availabilities,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const queryAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const startDate = new Date(req.query.startDate as string);
  const endDate = new Date(req.query.endDate as string);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return ApiResponse.error(
      res,
      'Invalid date format. Use ISO 8601 format.',
      'VALIDATION_ERROR',
      400
    );
  }

  if (endDate <= startDate) {
    return ApiResponse.error(
      res,
      'End date must be after start date',
      'VALIDATION_ERROR',
      400
    );
  }

  const result = await availabilityService.queryAvailability(propertyId, startDate, endDate);

  return ApiResponse.success(res, {
    propertyId,
    startDate,
    endDate,
    available: result.available,
    periods: result.periods,
  });
});

export const updateAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateAvailabilitySchema.parse(req.body);

  const availability = await availabilityService.updateAvailability(
    id,
    req.user!.id,
    validatedData
  );

  if (!availability) {
    return ApiResponse.error(res, 'Availability not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(
    res,
    { availability },
    'Availability updated successfully'
  );
});

export const deleteAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await availabilityService.deleteAvailability(id, req.user!.id);

  if (!deleted) {
    return ApiResponse.error(res, 'Availability not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, null, 'Availability deleted successfully');
});

export const blockDates = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = blockDatesSchema.parse(req.body);

  const blocked = await availabilityService.blockDates(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      availability: {
        id: blocked._id,
        propertyId: blocked.propertyId,
        startDate: blocked.startDate,
        endDate: blocked.endDate,
        available: blocked.available,
        createdAt: blocked.createdAt,
      },
    },
    'Dates blocked successfully',
    201
  );
});

export const unblockDates = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = unblockDatesSchema.parse(req.body);

  const result = await availabilityService.unblockDates(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    { deletedCount: result.deletedCount },
    'Dates unblocked successfully'
  );
});

export const setPricing = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = setPricingSchema.parse(req.body);

  const pricing = await availabilityService.setPricing(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      availability: {
        id: pricing._id,
        propertyId: pricing.propertyId,
        startDate: pricing.startDate,
        endDate: pricing.endDate,
        available: pricing.available,
        customPrice: pricing.customPrice,
        createdAt: pricing.createdAt,
      },
    },
    'Pricing set successfully',
    201
  );
});

export const getEffectivePrice = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const dateStr = req.query.date as string;

  if (!dateStr) {
    return ApiResponse.error(
      res,
      'Date parameter is required',
      'VALIDATION_ERROR',
      400
    );
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return ApiResponse.error(
      res,
      'Invalid date format. Use ISO 8601 format.',
      'VALIDATION_ERROR',
      400
    );
  }

  const price = await availabilityService.getEffectivePrice(propertyId, date);

  if (price === null) {
    return ApiResponse.error(res, 'Property not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, {
    propertyId,
    date,
    effectivePrice: price,
  });
});

export const setStayRequirements = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = setStayRequirementsSchema.parse(req.body);

  const requirements = await availabilityService.setStayRequirements(
    req.user!.id,
    validatedData
  );

  return ApiResponse.success(
    res,
    {
      availability: {
        id: requirements._id,
        propertyId: requirements.propertyId,
        startDate: requirements.startDate,
        endDate: requirements.endDate,
        minStay: requirements.minStay,
        maxStay: requirements.maxStay,
        createdAt: requirements.createdAt,
      },
    },
    'Stay requirements set successfully',
    201
  );
});

export const setLeadTime = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = setLeadTimeSchema.parse(req.body);

  const leadTime = await availabilityService.setLeadTime(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      availability: {
        id: leadTime._id,
        propertyId: leadTime.propertyId,
        startDate: leadTime.startDate,
        endDate: leadTime.endDate,
        leadDays: leadTime.leadDays,
        createdAt: leadTime.createdAt,
      },
    },
    'Lead time set successfully',
    201
  );
});

export const setAdvanceNotice = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = setAdvanceNoticeSchema.parse(req.body);

  const notice = await availabilityService.setAdvanceNotice(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      availability: {
        id: notice._id,
        propertyId: notice.propertyId,
        startDate: notice.startDate,
        endDate: notice.endDate,
        advanceNoticeDays: notice.advanceNoticeDays,
        createdAt: notice.createdAt,
      },
    },
    'Advance notice set successfully',
    201
  );
});

export const createSeason = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createSeasonSchema.parse(req.body);

  const season = await availabilityService.createSeason(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      season: {
        id: season._id,
        propertyId: season.propertyId,
        seasonName: season.seasonName,
        startDate: season.startDate,
        endDate: season.endDate,
        customPrice: season.customPrice,
        minStay: season.minStay,
        maxStay: season.maxStay,
        leadDays: season.leadDays,
        advanceNoticeDays: season.advanceNoticeDays,
        createdAt: season.createdAt,
      },
    },
    'Season created successfully',
    201
  );
});

export const getSeasons = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;

  const canModify = await availabilityService.canUserModifyProperty(
    propertyId,
    req.user!.id,
    req.user!.role
  );

  if (!canModify) {
    return ApiResponse.error(
      res,
      'You do not have permission to view this property',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const seasons = await availabilityService.getSeasonsBySeason(propertyId);

  return ApiResponse.success(res, {
    seasons,
    total: seasons.length,
  });
});

export const bulkSetPricing = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkSetPricingSchema.parse(req.body);

  const records = await availabilityService.bulkSetPricing(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      created: records.length,
      records: records.map((r) => ({
        id: r._id,
        date: r.startDate,
        price: r.customPrice,
      })),
    },
    'Pricing set for multiple dates',
    201
  );
});

export const validateStayDuration = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const checkInStr = req.query.checkIn as string;
  const checkOutStr = req.query.checkOut as string;

  if (!checkInStr || !checkOutStr) {
    return ApiResponse.error(
      res,
      'checkIn and checkOut parameters are required',
      'VALIDATION_ERROR',
      400
    );
  }

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return ApiResponse.error(
      res,
      'Invalid date format. Use ISO 8601 format.',
      'VALIDATION_ERROR',
      400
    );
  }

  if (checkOut <= checkIn) {
    return ApiResponse.error(
      res,
      'Check-out must be after check-in',
      'VALIDATION_ERROR',
      400
    );
  }

  const validation = await availabilityService.validateStayDuration(
    propertyId,
    checkIn,
    checkOut
  );

  return ApiResponse.success(res, {
    propertyId,
    checkIn,
    checkOut,
    ...validation,
  });
});

export const validateLeadTime = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const checkInStr = req.query.checkIn as string;

  if (!checkInStr) {
    return ApiResponse.error(
      res,
      'checkIn parameter is required',
      'VALIDATION_ERROR',
      400
    );
  }

  const checkIn = new Date(checkInStr);

  if (isNaN(checkIn.getTime())) {
    return ApiResponse.error(
      res,
      'Invalid date format. Use ISO 8601 format.',
      'VALIDATION_ERROR',
      400
    );
  }

  const validation = await availabilityService.validateLeadTime(propertyId, checkIn);

  return ApiResponse.success(res, {
    propertyId,
    checkIn,
    ...validation,
  });
});

export const validateAdvanceNotice = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;
  const checkInStr = req.query.checkIn as string;

  if (!checkInStr) {
    return ApiResponse.error(
      res,
      'checkIn parameter is required',
      'VALIDATION_ERROR',
      400
    );
  }

  const checkIn = new Date(checkInStr);

  if (isNaN(checkIn.getTime())) {
    return ApiResponse.error(
      res,
      'Invalid date format. Use ISO 8601 format.',
      'VALIDATION_ERROR',
      400
    );
  }

  const validation = await availabilityService.validateAdvanceNotice(propertyId, checkIn);

  return ApiResponse.success(res, {
    propertyId,
    checkIn,
    ...validation,
  });
});
