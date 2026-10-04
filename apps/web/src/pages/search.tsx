import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useProperty } from '@/hooks/use-property';

const AMENITIES = [
  'WiFi',
  'Kitchen',
  'Washer',
  'Dryer',
  'Air Conditioning',
  'Heating',
  'Pool',
  'Hot Tub',
  'Parking',
  'TV',
];

const PROPERTY_TYPES = ['Apartment', 'House', 'Condo', 'Townhouse', 'Villa', 'Cottage'];

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const { useSearchProperties } = useProperty();

  // Search filters from URL or state
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Build search input
  const searchInput = useMemo(
    () => ({
      location: location || undefined,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
      guests: guests ? parseInt(guests) : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      propertyType: propertyType || undefined,
      page,
      limit: 12,
    }),
    [location, minPrice, maxPrice, guests, selectedAmenities, propertyType, page]
  );

  const { data: searchResults, isLoading, error } = useSearchProperties(searchInput);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setGuests('');
    setSelectedAmenities([]);
    setPropertyType('');
    setPage(1);
  };

  const properties = searchResults?.properties || [];
  const total = searchResults?.total || 0;
  const totalPages = searchResults?.totalPages || 1;

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-base font-semibold">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="City or address"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setPage(1);
                  }}
                  className="mt-2"
                />
              </div>

              {/* Price Range */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Price per Night</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setPage(1);
                    }}
                    min="0"
                    className="w-1/2"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setPage(1);
                    }}
                    min="0"
                    className="w-1/2"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <Label htmlFor="guests" className="text-base font-semibold">
                  Guests
                </Label>
                <Input
                  id="guests"
                  type="number"
                  placeholder="Number of guests"
                  value={guests}
                  onChange={(e) => {
                    setGuests(e.target.value);
                    setPage(1);
                  }}
                  min="1"
                  className="mt-2"
                />
              </div>

              {/* Property Type */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Property Type</Label>
                <div className="space-y-2">
                  {PROPERTY_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={propertyType === type}
                        onChange={(e) => {
                          setPropertyType(e.target.checked ? type : '');
                          setPage(1);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Amenities</Label>
                <div className="space-y-2">
                  {AMENITIES.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="rounded"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Search Results</h1>
              <p className="text-muted-foreground mt-1">
                Found {total} properties
                {location && ` in ${location}`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardContent className="pt-4 space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">Failed to load properties. Please try again.</p>
              </CardContent>
            </Card>
          )}

          {/* No Results */}
          {!isLoading && !error && properties.length === 0 && (
            <Card className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No properties found</h2>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </Card>
          )}

          {/* Property Grid */}
          {!isLoading && !error && properties.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {properties.map((property: any) => (
                  <a key={property._id} href={`/properties/${property._id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      {/* Property Image */}
                      {property.images?.[0] && (
                        <div className="relative overflow-hidden bg-muted h-48">
                          <img
                            src={property.images[0].url}
                            alt={property.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      <CardContent className="pt-4 space-y-3">
                        {/* Title and Location */}
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-2">{property.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>{property.location?.city}</span>
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{property.maxGuests} guests</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>
                              {property.bedrooms} bed
                              {property.bedrooms !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Rating */}
                        {property.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">
                              {property.rating.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">
                              ({property.reviewCount} reviews)
                            </span>
                          </div>
                        )}

                        {/* Amenities Preview */}
                        {property.amenities && property.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {property.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {property.amenities.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{property.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Price */}
                        <div className="flex items-baseline gap-1 pt-2">
                          <span className="text-2xl font-bold">${property.pricePerNight}</span>
                          <span className="text-muted-foreground">per night</span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(Math.max(1, page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
