import { useState } from 'react';
import { Star, MapPin, Users, DollarSign, Heart, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Property {
  _id: string;
  title: string;
  location: string;
  city: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  amenities: string[];
  image: string;
  reason: string;
  matchScore: number;
}

const MOCK_RECOMMENDATIONS: Property[] = [
  {
    _id: '1',
    title: 'Downtown Modern Apartment',
    location: '123 Main St, New York, NY',
    city: 'New York',
    pricePerNight: 120,
    rating: 4.8,
    reviewCount: 24,
    maxGuests: 4,
    amenities: ['WiFi', 'Kitchen', 'AC', 'Parking'],
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop',
    reason: 'Based on your search for city properties with modern amenities',
    matchScore: 98,
  },
  {
    _id: '2',
    title: 'Beachfront Villa',
    location: '456 Beach Ave, Miami, FL',
    city: 'Miami',
    pricePerNight: 280,
    rating: 4.9,
    reviewCount: 18,
    maxGuests: 8,
    amenities: ['Pool', 'Ocean View', 'WiFi', 'Kitchen', 'BBQ'],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=300&fit=crop',
    reason: 'Perfect for groups - high ratings and excellent amenities',
    matchScore: 95,
  },
  {
    _id: '3',
    title: 'Cozy Mountain Cabin',
    location: '789 Mountain Rd, Aspen, CO',
    city: 'Aspen',
    pricePerNight: 95,
    rating: 4.6,
    reviewCount: 12,
    maxGuests: 6,
    amenities: ['Fireplace', 'Kitchen', 'WiFi', 'Hot Tub'],
    image: 'https://images.unsplash.com/photo-1571896349842-71f90e20498c?w=500&h=300&fit=crop',
    reason: 'Budget-friendly mountain escape with great reviews',
    matchScore: 92,
  },
  {
    _id: '4',
    title: 'Luxury Penthouse',
    location: '999 Luxury Tower, Los Angeles, CA',
    city: 'Los Angeles',
    pricePerNight: 450,
    rating: 4.9,
    reviewCount: 32,
    maxGuests: 6,
    amenities: ['Gym', 'Pool', 'Concierge', 'WiFi', 'Theater'],
    image: 'https://images.unsplash.com/photo-1512314889357-e0c63c67f132?w=500&h=300&fit=crop',
    reason: 'Premium experience - top-rated luxury property',
    matchScore: 94,
  },
  {
    _id: '5',
    title: 'Suburban Family Home',
    location: '321 Oak Lane, Austin, TX',
    city: 'Austin',
    pricePerNight: 110,
    rating: 4.7,
    reviewCount: 28,
    maxGuests: 5,
    amenities: ['Yard', 'WiFi', 'Kitchen', 'Washer', 'Dryer'],
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop',
    reason: 'Family-friendly with excellent value and reviews',
    matchScore: 91,
  },
  {
    _id: '6',
    title: 'Urban Loft',
    location: '555 Art St, San Francisco, CA',
    city: 'San Francisco',
    pricePerNight: 200,
    rating: 4.8,
    reviewCount: 35,
    maxGuests: 3,
    amenities: ['Exposed Brick', 'WiFi', 'Kitchen', 'High Ceilings'],
    image: 'https://images.unsplash.com/photo-1575517111478-7f6afd0973d0?w=500&h=300&fit=crop',
    reason: 'Trendy urban space with artsy atmosphere and high ratings',
    matchScore: 96,
  },
];

export function PropertyRecommendationsPage() {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Property[]>(MOCK_RECOMMENDATIONS);
  const [sortBy, setSortBy] = useState('match');
  const [wishlist, setWishlist] = useState<string[]>([]);

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.pricePerNight - b.pricePerNight;
      case 'price-high':
        return b.pricePerNight - a.pricePerNight;
      case 'rating':
        return b.rating - a.rating;
      case 'match':
      default:
        return b.matchScore - a.matchScore;
    }
  });

  const toggleWishlist = (propertyId: string) => {
    if (wishlist.includes(propertyId)) {
      setWishlist((prev) => prev.filter((id) => id !== propertyId));
      toast({ title: 'Removed from wishlist' });
    } else {
      setWishlist((prev) => [...prev, propertyId]);
      toast({ title: 'Added to wishlist' });
    }
  };

  const handleShare = (property: Property) => {
    const text = `Check out this amazing property: ${property.title} in ${property.city} - $${property.pricePerNight}/night ⭐ ${property.rating}`;
    if (navigator.share) {
      navigator.share({ title: property.title, text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Recommended for You</h1>
        </div>
        <p className="text-muted-foreground mt-2">Personalized property recommendations based on your preferences</p>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-4 mb-6 items-center">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match">Best Match</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{recommendations.length} recommendations</span>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRecommendations.map((property) => (
          <Card key={property._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-muted">
              <img
                src={property.image}
                alt={property.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white hover:bg-white/80 rounded-full"
                  onClick={() => toggleWishlist(property._id)}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      wishlist.includes(property._id) ? 'fill-red-600 text-red-600' : 'text-muted-foreground'
                    }`}
                  />
                </Button>
              </div>
              {/* Match Score Badge */}
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {property.matchScore}% Match
              </div>
            </div>

            <CardContent className="pt-6">
              {/* Why Recommended */}
              <p className="text-xs text-blue-600 font-medium mb-2">✨ {property.reason}</p>

              {/* Title and Location */}
              <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4" />
                {property.city}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{property.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">({property.reviewCount} reviews)</span>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1 mb-4">
                {property.amenities.slice(0, 3).map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {property.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{property.amenities.length - 3} more
                  </Badge>
                )}
              </div>

              {/* Price and Guests */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">per night</p>
                  <p className="text-2xl font-bold">${property.pricePerNight}</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {property.maxGuests} guests
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link to={`/properties/${property._id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleShare(property)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {recommendations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No recommendations available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Chat with our AI assistant to get personalized suggestions!</p>
            <Link to="/ai-chat">
              <Button className="mt-4">Start Chatting</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
