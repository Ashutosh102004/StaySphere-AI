import { AIConversation } from './conversation.model';
import { AIMessage, IAIMessage } from './message.model';
import { IAIConversation } from './conversation.model';
import { Property, IProperty } from '../properties/property.model';
import { Booking } from '../bookings/booking.model';
import { Review } from '../reviews/review.model';
import { FilterQuery } from 'mongoose';
import {
  ChatMessageInput,
  GenerateDescriptionInput,
  SearchPropertiesInput,
  GetRecommendationsInput,
  OptimizePriceInput,
} from './ai.validation';
import { config } from '@/config/env';
import { v4 as uuidv4 } from 'uuid';

interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIChatToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

interface AICompletionResponse {
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: AIChatToolCall[];
    };
  }[];
}

interface AIProvider {
  chat(messages: AIChatMessage[], tools?: Record<string, unknown>[]): Promise<{ content: string; toolCalls?: AIChatToolCall[] }>;
  generateDescription(prompt: string): Promise<string>;
}

function getProviderErrorMessage(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return undefined;
  }

  const error = value.error;
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return undefined;
  }

  return typeof error.message === 'string' ? error.message : undefined;
}

class OpenAICompatibleProvider implements AIProvider {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(baseURL: string, apiKey: string, model: string, timeoutMs: number, maxTokens: number, temperature: number) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
  }

  private async request(body: unknown): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = this.baseURL.replace(/\/+$/, '') + '/chat/completions';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: typeof body === 'string' ? body : JSON.stringify(body),
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async chat(messages: AIChatMessage[], tools?: Record<string, unknown>[]): Promise<{ content: string; toolCalls?: AIChatToolCall[] }> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: false,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
    }

    const response = await this.request(body);

    if (!response.ok) {
      let message = `AI provider error: ${response.status} ${response.statusText}`;
      try {
        const text = await response.text();
        const sanitized = text.replace(/Bearer\s+\S+/gi, 'Bearer ***');
        let parsed: unknown;
        try {
          parsed = JSON.parse(sanitized);
        } catch {
          parsed = null;
        }
        message += `: ${getProviderErrorMessage(parsed) ?? sanitized.slice(0, 300)}`;
      } catch {
        message += ': (empty response body)';
      }
      throw new Error(message);
    }

    const data = await response.json() as AICompletionResponse;
    const choice = data.choices?.[0];
    const message = choice?.message;

    return {
      content: message?.content ?? '',
      toolCalls: message?.tool_calls,
    };
  }

  async generateDescription(prompt: string): Promise<string> {
    const response = await this.chat([{ role: 'user', content: prompt }]);
    return response.content;
  }
}

export class AIService {
  private provider: AIProvider;

  constructor() {
    // All supported providers now use OpenAI-compatible API
    // Kiro and Anthropic providers should expose OpenAI-compatible endpoints
    const baseURL = process.env.AI_BASE_URL || '';
    const apiKey = process.env.AI_API_KEY || '';
    const model = config.ai.model;
    const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10) || 30000;
    const maxTokens = config.ai.maxTokens;
    const temperature = config.ai.temperature;

    if (!baseURL) {
      throw new Error('AI_BASE_URL is required for AI provider');
    }
    if (!apiKey) {
      throw new Error('AI_API_KEY is required for AI provider');
    }

    this.provider = new OpenAICompatibleProvider(baseURL, apiKey, model, timeoutMs, maxTokens, temperature);
  }

  // ========== Chat ==========

  async chat(userId: string, input: ChatMessageInput) {
    let conversationId = input.conversationId;

    // Create new conversation if not exists
    if (!conversationId) {
      const conversation = await AIConversation.create({
        conversationId: uuidv4(),
        userId: userId,
        title: input.message.substring(0, 50) + '...',
      });
      conversationId = conversation.conversationId;
    }

    // Save user message
    await AIMessage.create({
      conversationId,
      role: 'user',
      content: input.message,
    });

    // Get conversation history for context
    const history = await AIMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(20);

    // Build messages for AI
    const messages: AIChatMessage[] = [
      {
        role: 'system',
        content: `You are StaySphere AI, a helpful vacation rental assistant. You help users find properties, understand booking processes, and get recommendations. Be friendly, concise, and helpful.`,
      },
      ...history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Get AI response
    const response = await this.provider.chat(messages);

    // Save assistant message
    await AIMessage.create({
      conversationId,
      role: 'assistant',
      content: response.content,
      toolCalls: response.toolCalls,
    });

    // Update conversation timestamp
    await AIConversation.findOneAndUpdate(
      { conversationId },
      { updatedAt: new Date() }
    );

    return {
      conversationId,
      message: response.content,
    };
  }

  async getConversations(userId: string): Promise<IAIConversation[]> {
    return AIConversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(20);
  }

  async getConversationMessages(conversationId: string): Promise<IAIMessage[]> {
    return AIMessage.find({ conversationId }).sort({ createdAt: 1 });
  }

  // ========== Property Description Generation ==========

  async generatePropertyDescription(input: GenerateDescriptionInput): Promise<string> {
    const property = await Property.findById(input.propertyId);

    if (!property) {
      throw new Error('Property not found');
    }

    const stylePrompts = {
      professional: 'Write in a professional, descriptive tone highlighting key features and amenities.',
      friendly: 'Write in a warm, inviting tone that makes guests feel welcome.',
      luxury: 'Write in an elegant, premium tone emphasizing luxury and exclusivity.',
      budget: 'Write in a practical, value-focused tone emphasizing affordability and value.',
    };

    const prompt = `
Property: ${property.title}
Location: ${property.location.city}, ${property.location.state}, ${property.location.country}
Description: ${property.description}
Amenities: ${property.amenities?.join(', ') || 'Not specified'}
Price: $${property.pricePerNight} per night
Guests: Up to ${property.maxGuests}

${stylePrompts[input.style]}

Generate an engaging property description (150-200 words) that highlights the unique features and creates appeal for potential guests.
`.trim();

    return this.provider.generateDescription(prompt);
  }

  // ========== Smart Search ==========

  async smartSearch(input: SearchPropertiesInput) {
    const query: FilterQuery<IProperty> = { published: true };

    // Text search
    if (input.query) {
      query.$text = { $search: input.query };
    }

    // Location filter
    if (input.location) {
      query['location.city'] = { $regex: input.location, $options: 'i' };
    }

    // Price range
    if (input.priceMin !== undefined || input.priceMax !== undefined) {
      query.pricePerNight = {};
      if (input.priceMin !== undefined) query.pricePerNight.$gte = input.priceMin;
      if (input.priceMax !== undefined) query.pricePerNight.$lte = input.priceMax;
    }

    // Guests
    if (input.guests) {
      query.maxGuests = { $gte: input.guests };
    }

    // Amenities
    if (input.amenities && input.amenities.length > 0) {
      query.amenities = { $all: input.amenities };
    }

    const properties = await Property.find(query)
      .populate('hostId', 'email rating')
      .sort({ rating: -1, reviewCount: -1 })
      .limit(input.limit);

    // If AI search, re-rank using AI
    if (input.query) {
      const rankedProperties = await this.rerankResults(input.query, properties);
      return rankedProperties;
    }

    return properties;
  }

  private async rerankResults(_query: string, properties: IProperty[]): Promise<IProperty[]> {
    // Placeholder for AI-powered reranking
    // In production, use embeddings to calculate similarity
    return properties;
  }

  // ========== Recommendations ==========

  async getRecommendations(input: GetRecommendationsInput): Promise<IProperty[]> {
    const query: FilterQuery<IProperty> = { published: true };

    // Price range filter
    if (input.priceRange) {
      query.pricePerNight = {
        $gte: input.priceRange.min,
        $lte: input.priceRange.max,
      };
    }

    let properties = await Property.find(query)
      .populate('hostId', 'email rating')
      .sort({ rating: -1, reviewCount: -1 })
      .limit(input.limit);

    // If userId provided, personalize based on past bookings
    if (input.userId) {
      const userBookings = await Booking.find({
        guestId: input.userId,
        status: 'COMPLETED',
      }).populate('propertyId');

      // Get categories user has booked before
      const bookedPropertyIds = userBookings.map((b) => b.propertyId);
      const preferredProperties = properties.filter((p) =>
        bookedPropertyIds.some((bp) => bp.toString() === p._id.toString())
      );

      // Boost preferred properties
      properties = [
        ...preferredProperties,
        ...properties.filter((p) => !preferredProperties.includes(p)),
      ];
    }

    // If propertyId provided, find similar properties
    if (input.propertyId) {
      const baseProperty = await Property.findById(input.propertyId);
      if (baseProperty) {
        // Find properties with similar amenities
        const similarProperties = await Property.find({
          _id: { $ne: baseProperty._id },
          published: true,
          amenities: { $in: baseProperty.amenities },
        })
          .populate('hostId', 'email rating')
          .limit(input.limit);

        return similarProperties;
      }
    }

    return properties;
  }

  // ========== Price Optimization ==========

  async optimizePrice(input: OptimizePriceInput) {
    const property = await Property.findById(input.propertyId);

    if (!property) {
      throw new Error('Property not found');
    }

    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate base price
    const basePrice = property.pricePerNight * nights;

    // Check for competitor data
    if (input.competitors && input.competitors.length > 0) {
      const avgCompetitorPrice =
        input.competitors.reduce((sum, c) => sum + c.price, 0) / input.competitors.length;
      const avgCompetitorRating =
        input.competitors.reduce((sum, c) => sum + c.rating, 0) / input.competitors.length;

      // Adjust based on rating comparison
      const myRating = property.rating || 0;
      const ratingDiff = myRating - avgCompetitorRating;

      let recommendedPrice = avgCompetitorPrice;

      // If higher rated, can charge more
      if (ratingDiff > 0.5) {
        recommendedPrice *= 1.15; // 15% premium
      } else if (ratingDiff < -0.5) {
        recommendedPrice *= 0.9; // 10% discount
      }

      // Apply seasonal adjustment
      const month = checkIn.getMonth();
      const isPeakSeason = month >= 5 && month <= 8; // Summer
      if (isPeakSeason) {
        recommendedPrice *= 1.2;
      }

      return {
        propertyId: input.propertyId,
        basePrice: property.pricePerNight,
        totalNights: nights,
        currentTotalPrice: basePrice,
        recommendedTotalPrice: Math.round(recommendedPrice * nights),
        recommendedPerNight: Math.round(recommendedPrice),
        confidence: input.competitors.length >= 3 ? 'high' : 'medium',
        factors: {
          competitorAnalysis: true,
          ratingAdjustment: ratingDiff.toFixed(1),
          seasonalAdjustment: isPeakSeason ? 'peak season' : 'off-season',
        },
      };
    }

    // Without competitor data, use property metrics
    const reviews = await Review.find({ propertyId: input.propertyId });
    const reviewCount = reviews.length;
    const avgRating = property.rating || 0;

    // Base adjustment factors
    let adjustmentFactor = 1.0;

    // Rating factor (up to 20% premium for 5-star)
    adjustmentFactor += (avgRating / 5) * 0.2;

    // Review count factor (up to 10% for many reviews)
    adjustmentFactor += Math.min(reviewCount / 100, 0.1);

    // Seasonal adjustment
    const month = checkIn.getMonth();
    if (month >= 5 && month <= 8) {
      adjustmentFactor *= 1.25;
    } else if (month >= 11 || month <= 1) {
      adjustmentFactor *= 0.9;
    }

    const recommendedPrice = property.pricePerNight * adjustmentFactor;

    return {
      propertyId: input.propertyId,
      basePrice: property.pricePerNight,
      totalNights: nights,
      currentTotalPrice: basePrice,
      recommendedTotalPrice: Math.round(recommendedPrice * nights),
      recommendedPerNight: Math.round(recommendedPrice),
      confidence: 'low',
      factors: {
        ratingAdjustment: `+${((avgRating / 5) * 20).toFixed(0)}%`,
        reviewAdjustment: `+${Math.min(reviewCount / 10, 10).toFixed(0)}%`,
        seasonalAdjustment: month >= 5 && month <= 8 ? 'peak (+25%)' : 'standard',
      },
    };
  }
}