import { Request, Response } from 'express';
import { AIService } from './ai.service';
import {
  chatMessageSchema,
  generateDescriptionSchema,
  searchPropertiesSchema,
  getRecommendationsSchema,
  optimizePriceSchema,
} from './ai.validation';
import { asyncHandler } from '@/utils/async-handler';
import { ApiResponse } from '@/utils/response';

const aiService = new AIService();

// ========== Chat ==========

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = chatMessageSchema.parse(req.body);

  const result = await aiService.chat(req.user!.id, validatedData);

  return ApiResponse.success(res, result, 'Message sent');
});

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await aiService.getConversations(req.user!.id);

  return ApiResponse.success(res, { conversations });
});

export const getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
  const { conversationId } = req.params;

  const messages = await aiService.getConversationMessages(conversationId);

  return ApiResponse.success(res, { messages });
});

// ========== Property Description ==========

export const generateDescription = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = generateDescriptionSchema.parse(req.body);

  const description = await aiService.generatePropertyDescription(validatedData);

  return ApiResponse.success(res, { description });
});

// ========== Smart Search ==========

export const smartSearch = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = searchPropertiesSchema.parse({
    ...req.query,
    priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
    priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
    guests: req.query.guests ? Number(req.query.guests) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });

  const properties = await aiService.smartSearch(validatedData);

  return ApiResponse.success(res, { properties, count: properties.length });
});

// ========== Recommendations ==========

export const getRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = getRecommendationsSchema.parse({
    userId: req.user?.id,
    propertyId: req.query.propertyId as string,
    limit: req.query.limit ? Number(req.query.limit) : 10,
    priceRange: req.query.priceMin && req.query.priceMax ? {
      min: Number(req.query.priceMin),
      max: Number(req.query.priceMax),
    } : undefined,
  });

  const recommendations = await aiService.getRecommendations(validatedData);

  return ApiResponse.success(res, { recommendations, count: recommendations.length });
});

// ========== Price Optimization ==========

export const optimizePrice = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = optimizePriceSchema.parse(req.body);

  const pricing = await aiService.optimizePrice(validatedData);

  return ApiResponse.success(res, { pricing });
});