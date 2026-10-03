import { AIConversation } from './conversation.model';
import { AIMessage } from './message.model';
import { Property } from '../properties/property.model';
import { Booking } from '../bookings/booking.model';
import { Review } from '../reviews/review.model';
import {
  ChatMessageInput,
  GenerateDescriptionInput,
  SearchPropertiesInput,
  GetRecommendationsInput,
  OptimizePriceInput,
} from './ai.validation';
import { config } from '@/config/env';
import { v4 as uuidv4 } from 'uuid';

interface AIProvider {
  chat(messages: any[], tools?: any[]): Promise<{ content: string; toolCalls?: any[] }>;
  generateDescription(prompt: string): Promise<string>;
}

class AnthropicProvider implements AIProvider {
  constructor() {
    // API configuration available via config.ai.apiKey and config.ai.model
  }

  async chat(messages: any[], _tools?: any[]): Promise<{ content: string; toolCalls?: any[] }> {
    // This is a placeholder - in production, integrate with Anthropic API
    // For now, return a mock response demonstrating the pattern
    const lastMessage = messages[messages.length - 1]?.content || '';

    // Simulate AI response based on message content
    let response = "I'm here to help you with your vacation rental needs. ";

    if (lastMessage.toLowerCase().includes('property')) {
      response += "I can help you find the perfect property, generate descriptions, or optimize pricing.";
    } else if (lastMessage.toLowerCase().includes('booking')) {
      response += "I can assist with booking information and management.";
    } else if (lastMessage.toLowerCase().includes('recommend')) {
      response += "Based on your preferences, I'd be happy to suggest some great properties.";
    } else {
      response += "Feel free to ask about properties, bookings, or recommendations.";
    }

    return { content: response };
  }

  async generateDescription(prompt: string): Promise<string> {
    // Placeholder for actual Anthropic API call
    return `Beautiful property featuring ${prompt}. This stunning space offers comfort and style in a prime location. Perfect for travelers seeking a memorable stay with modern amenities and welcoming atmosphere.`;
  }
}

class OpenAIProvider implements AIProvider {
  constructor() {
    // API configuration available via process.env.OPENAI_API_KEY
  }

  async chat(messages: any[], _tools?: any[]): Promise<{ content: string; toolCalls?: any[] }> {
    // Placeholder for OpenAI integration
    return AnthropicProvider.prototype.chat.call(this, messages);
  }

  async generateDescription(prompt: string): Promise<string> {
    return `Exquisite property: ${prompt}. A perfect blend of luxury and comfort awaits you.`;
  }
}

class KiroProvider implements AIProvider {
  constructor() {
    // API configuration available via config.ai.apiKey and config.ai.model
  }

  async chat(messages: any[], _tools?: any[]): Promise<{ content: string; toolCalls?: any[] }> {
    // Placeholder for Kiro API integration
    return AnthropicProvider.prototype.chat.call(this, messages);
  }

  async generateDescription(prompt: string): Promise<string> {
    return `Welcome to this exceptional property: ${prompt}. Experience unparalleled hospitality and comfort.`;
  }
}

export class AIService {
  private provider: AIProvider;

  constructor() {
    // Initialize the appropriate provider based on config
    switch (config.ai.provider.toLowerCase()) {
      case 'openai':
        this.provider = new OpenAIProvider();
        break;
      case 'kiro':
        this.provider = new KiroProvider();
        break;
      case 'anthropic':
      default:
        this.provider = new AnthropicProvider();
        break;
    }
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
    const messages = [
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

  async getConversations(userId: string): Promise<any[]> {
    return AIConversation.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(20);
  }

  async getConversationMessages(conversationId: string): Promise<any[]> {
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

  async smartSearch(input: SearchPropertiesInput): Promise<any> {
    const query: any = { published: true };

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

  private async rerankResults(_query: string, properties: any[]): Promise<any[]> {
    // Placeholder for AI-powered reranking
    // In production, use embeddings to calculate similarity
    return properties;
  }

  // ========== Recommendations ==========

  async getRecommendations(input: GetRecommendationsInput): Promise<any[]> {
    const query: any = { published: true };

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
        bookedPropertyIds.some((bp: any) => bp._id.toString() === p._id.toString())
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

  async optimizePrice(input: OptimizePriceInput): Promise<any> {
    const property = await Property.findById(input.propertyId);

    if (!property) {
      throw new Error('Property not found');
    }

    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate base price
    let basePrice = property.pricePerNight * nights;

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