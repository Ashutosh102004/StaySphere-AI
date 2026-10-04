import { Request, Response } from 'express';
import { WishlistService } from './wishlist.service';
import {
  addToWishlistSchema,
  removeFromWishlistSchema,
} from './wishlist.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const wishlistService = new WishlistService();

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = addToWishlistSchema.parse(req.body);

  const item = await wishlistService.addToWishlist(req.user!.id, validatedData);

  return ApiResponse.success(
    res,
    {
      wishlistItem: {
        id: item._id,
        propertyId: item.propertyId,
        createdAt: item.createdAt,
      },
    },
    'Property added to wishlist',
    201
  );
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = removeFromWishlistSchema.parse(req.body);

  const removed = await wishlistService.removeFromWishlist(req.user!.id, validatedData);

  if (!removed) {
    return ApiResponse.error(
      res,
      'Property not found in wishlist',
      'NOT_FOUND',
      404
    );
  }

  return ApiResponse.success(res, {}, 'Property removed from wishlist');
});

export const getUserWishlist = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const sort = (req.query.sort as 'newest' | 'oldest') || 'newest';

  const { items, total } = await wishlistService.getUserWishlist(
    req.user!.id,
    limit,
    offset,
    sort
  );

  return ApiResponse.success(res, {
    wishlist: items.map(item => ({
      id: item._id,
      propertyId: item.propertyId,
      createdAt: item.createdAt,
    })),
    pagination: {
      total,
      limit,
      offset,
    },
  });
});

export const getWishlistCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await wishlistService.getWishlistCount(req.user!.id);

  return ApiResponse.success(res, {
    count,
  });
});

export const checkInWishlist = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params.propertyId;

  const inWishlist = await wishlistService.isInWishlist(req.user!.id, propertyId);

  return ApiResponse.success(res, {
    propertyId,
    inWishlist,
  });
});

export const clearWishlist = asyncHandler(async (req: Request, res: Response) => {
  const result = await wishlistService.clearWishlist(req.user!.id);

  return ApiResponse.success(res, {
    deletedCount: result.deletedCount,
  });
});

export const getWishlistStats = asyncHandler(async (req: Request, res: Response) => {
  // Admin only
  if (req.user!.role !== 'ADMIN') {
    return ApiResponse.error(
      res,
      'Only admins can view wishlist statistics',
      'AUTHORIZATION_ERROR',
      403
    );
  }

  const stats = await wishlistService.getWishlistStats();

  return ApiResponse.success(res, {
    stats,
  });
});
