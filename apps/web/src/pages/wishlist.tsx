import { useState } from 'react';
import { Heart, Trash2, Share2, MapPin, Star, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface WishlistProperty {
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
  addedDate: string;
}

const MOCK_WISHLIST: WishlistProperty[] = [
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
    addedDate: new Date(Date.now() - 86400000).toISOString(),
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
    addedDate: new Date(Date.now() - 172800000).toISOString(),
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
    addedDate: new Date(Date.now() - 259200000).toISOString(),
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
    addedDate: new Date(Date.now() - 604800000).toISOString(),
  },
];

export function WishlistPage() {
  const { toast } = useToast();
  const [wishlist, setWishlist] = useState<WishlistProperty[]>(MOCK_WISHLIST);
  const [filterCity, setFilterCity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<WishlistProperty | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const filteredWishlist = wishlist.filter((property) => {
    const matchCity = filterCity === 'ALL' || property.city === filterCity;
    const matchSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCity && matchSearch;
  });

  const cities = ['ALL', ...Array.from(new Set(wishlist.map((p) => p.city)))];

  const handleRemove = (propertyId: string) => {
    setWishlist((prev) => prev.filter((p) => p._id !== propertyId));
    toast({ title: 'Removed from wishlist' });
  };

  const handleShare = (property: WishlistProperty) => {
    setSelectedProperty(property);
    setIsShareDialogOpen(true);
  };

  const handleShareAction = async (method: string) => {
    if (!selectedProperty) return;

    const text = `Check out this amazing property: ${selectedProperty.title} in ${selectedProperty.city} - $${selectedProperty.pricePerNight}/night ⭐ ${selectedProperty.rating}`;

    if (method === 'share' && navigator.share) {
      await navigator.share({ title: selectedProperty.title, text });
      toast({ title: 'Shared successfully' });
    } else if (method === 'copy') {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Link copied to clipboard' });
    } else if (method === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent(selectedProperty.title)}&body=${encodeURIComponent(text)}`;
    }

    setIsShareDialogOpen(false);
  };

  const avgRating = (wishlist.reduce((sum, p) => sum + p.rating, 0) / wishlist.length).toFixed(1);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Wishlist</h1>
            <p className="text-muted-foreground mt-2">Save and organize your favorite properties</p>
          </div>
          <Link to="/search">
            <Button variant="outline">Explore More</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {wishlist.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-3xl font-bold mt-2">{wishlist.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <p className="text-3xl font-bold">{avgRating}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground">Price Range</p>
                <p className="text-3xl font-bold mt-2">
                  ${Math.min(...wishlist.map((p) => p.pricePerNight))} - ${Math.max(...wishlist.map((p) => p.pricePerNight))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">City</label>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">View</label>
              <Select value={viewMode} onValueChange={(val) => setViewMode(val as 'grid' | 'list')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wishlist Display */}
      {filteredWishlist.length > 0 ? (
        viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWishlist.map((property) => (
              <Card key={property._id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      onClick={() => handleRemove(property._id)}
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white hover:bg-white/80 rounded-full"
                      onClick={() => handleShare(property)}
                    >
                      <Share2 className="h-5 w-5 text-blue-600" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-white text-black px-2 py-1 rounded text-sm font-semibold">
                    Added {formatDate(property.addedDate)}
                  </div>
                </div>

                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    {property.city}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{property.rating}</span>
                    <span className="text-sm text-muted-foreground">({property.reviewCount})</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {property.amenities.slice(0, 2).map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{property.amenities.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">per night</p>
                      <p className="text-2xl font-bold">${property.pricePerNight}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {property.maxGuests}
                    </div>
                  </div>

                  <Link to={`/properties/${property._id}`}>
                    <Button className="w-full">View Property</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {filteredWishlist.map((property) => (
              <Card key={property._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div className="h-32 overflow-hidden rounded bg-muted">
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        {property.location}
                      </div>
                      <p className="text-xs text-muted-foreground">Added {formatDate(property.addedDate)}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Rating</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{property.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{property.reviewCount} reviews</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-sm font-semibold">${property.pricePerNight}/night</p>
                        <p className="text-xs text-muted-foreground">Max {property.maxGuests} guests</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemove(property._id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(property)}
                          className="gap-1"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        // Empty State
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground mb-6">
              Start exploring and save your favorite properties to come back to them later.
            </p>
            <Link to="/search">
              <Button>Explore Properties</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Property</DialogTitle>
            <DialogDescription>
              Share "{selectedProperty?.title}" with others
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button onClick={() => handleShareAction('share')} className="w-full" variant="outline">
                Share via App
              </Button>
            )}
            <Button onClick={() => handleShareAction('copy')} className="w-full" variant="outline">
              Copy Link to Clipboard
            </Button>
            <Button onClick={() => handleShareAction('email')} className="w-full" variant="outline">
              Share via Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
