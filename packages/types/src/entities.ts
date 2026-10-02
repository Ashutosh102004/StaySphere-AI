export interface User {
  id: string;
  email: string;
  role: 'GUEST' | 'HOST' | 'SUPPORT' | 'ADMIN';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  address?: Address;
  preferredLanguage?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Property {
  id: string;
  hostId: string;
  title: string;
  description: string;
  propertyType: string;
  location: Location;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  currency: string;
  cancellationPolicy: string;
  published: boolean;
  images?: PropertyImage[];
  amenities?: string[];
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PropertyImage {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  status: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: any;
  createdAt: Date;
}

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface IdentityVerification {
  id: string;
  userId: string;
  provider: string;
  providerSessionId?: string;
  status: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: string;
  priority?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConversation {
  id: string;
  conversationId: string;
  userId: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
  createdAt: Date;
}
