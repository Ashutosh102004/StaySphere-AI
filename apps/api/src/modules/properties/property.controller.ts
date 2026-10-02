import { Request, Response } from 'express';
import { PropertyService } from './property.service';
import {
  createPropertySchema,
  updatePropertySchema,
  publishPropertySchema,
} from './property.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const propertyService = new PropertyService();

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createPropertySchema.parse(req.body);
  const property = await propertyService.createProperty(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      property: {
        id: property._id,
        title: property.title,
        description: property.description,
        propertyType: property.propertyType,
        location: property.location,
        maxGuests: property.maxGuests,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        pricePerNight: property.pricePerNight,
        currency: property.currency,
        amenities: property.amenities,
        images: property.images,
        cancellationPolicy: property.cancellationPolicy,
        published: property.published,
        createdAt: property.createdAt,
      },
    },
    'Property created successfully',
    201
  );
});

export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const property = req.user
    ? await propertyService.getPropertyById(id)
    : await propertyService.getPublicPropertyById(id);

  if (!property) {
    return ApiResponse.error(res, 'Property not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, { property });
});

export const getMyProperties = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await propertyService.getPropertiesByHost(req.user!.id, page, limit);

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

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updatePropertySchema.parse(req.body);

  const canModify = await propertyService.canUserModifyProperty(
    id,
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

  const property = await propertyService.updateProperty(id, req.user!.id, validatedData);

  if (!property) {
    return ApiResponse.error(res, 'Property not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, { property }, 'Property updated successfully');
});

export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const canModify = await propertyService.canUserModifyProperty(
    id,
    req.user!.id,
    req.user!.role
  );

  if (!canModify) {
    return ApiResponse.error(
      res,
      'You do not have permission to delete this property',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const deleted = await propertyService.deleteProperty(id, req.user!.id);

  if (!deleted) {
    return ApiResponse.error(res, 'Property not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(res, null, 'Property deleted successfully');
});

export const publishProperty = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { published } = publishPropertySchema.parse(req.body);

  const canModify = await propertyService.canUserModifyProperty(
    id,
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

  const property = await propertyService.publishProperty(id, req.user!.id, published);

  if (!property) {
    return ApiResponse.error(res, 'Property not found', 'NOT_FOUND', 404);
  }

  return ApiResponse.success(
    res,
    { property },
    `Property ${published ? 'published' : 'unpublished'} successfully`
  );
});

export const searchProperties = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    city: req.query.city as string,
    country: req.query.country as string,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    maxGuests: req.query.maxGuests ? parseInt(req.query.maxGuests as string) : undefined,
    propertyType: req.query.propertyType as string,
    amenities: req.query.amenities
      ? (req.query.amenities as string).split(',')
      : undefined,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    order: (req.query.order as 'asc' | 'desc') || 'desc',
  };

  const result = await propertyService.searchProperties(filters);

  return ApiResponse.success(res, {
    properties: result.properties,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});
