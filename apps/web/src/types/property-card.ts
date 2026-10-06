export interface PropertyCardData {
  _id: string;
  title: string;
  images?: { url: string }[];
  location?: { city?: string };
  published?: boolean;
  maxGuests: number;
  bedrooms: number;
  pricePerNight: number;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
}
