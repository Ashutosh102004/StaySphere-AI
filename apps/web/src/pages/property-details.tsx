import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookingCalendar } from '@/components/availability';
import { useAuth } from '@/contexts/auth-context-value';
import { useProperty } from '@/hooks/use-property';
import { useBooking } from '@/hooks/use-booking';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';

export function PropertyDetailsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { usePropertyById } = useProperty();
  const { useCreateBooking } = useBooking();
  const { data: property, isLoading, error } = usePropertyById(propertyId || '');
  const createBookingMutation = useCreateBooking();
  const [selectedDates, setSelectedDates] = useState<{ checkIn: Date; checkOut: Date } | null>(null);
  const [numberOfGuests] = useState<number>(1);

  if (!propertyId) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold">Property not found</h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Loading property...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading property. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleContinueBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedDates) {
      toast({
        title: 'Error',
        description: 'Please select dates',
        variant: 'destructive',
      });
      return;
    }

    try {
      const booking = await createBookingMutation.mutateAsync({
        propertyId,
        checkInDate: selectedDates.checkIn,
        checkOutDate: selectedDates.checkOut,
        numberOfGuests,
        specialRequests: '',
      });

      toast({
        title: 'Success',
        description: 'Booking created successfully!',
      });

      navigate(`/bookings/${booking._id}`, {
        state: { booking },
      });
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to create booking'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="gap-2 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{property.location?.city}, {property.location?.country}</span>
              </div>
              {property.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400" />
                  <span>{property.rating.toFixed(1)} ({property.reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          {property.images && property.images.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <img
                  src={property.images[0]?.url}
                  alt={property.title}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About this property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{property.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-lg font-semibold">{property.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Guests</p>
                  <p className="text-lg font-semibold">{property.maxGuests}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bedrooms</p>
                  <p className="text-lg font-semibold">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bathrooms</p>
                  <p className="text-lg font-semibold">{property.bathrooms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Cancellation Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {property.cancellationPolicy === 'FLEXIBLE'
                  ? 'Flexible - Cancel anytime for a full refund'
                  : property.cancellationPolicy === 'MODERATE'
                  ? 'Moderate - Cancel up to 7 days before for a full refund'
                  : 'Strict - Limited cancellations allowed'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Booking Calendar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${property.pricePerNight}</p>
                <p className="text-sm text-muted-foreground">per night</p>
              </CardContent>
            </Card>

            <BookingCalendar
              propertyId={propertyId}
              basePrice={property?.pricePerNight || 100}
              onDatesSelected={setSelectedDates}
            />

            <Button
              onClick={handleContinueBooking}
              disabled={!selectedDates}
              className="w-full mt-6"
              size="lg"
            >
              {isAuthenticated ? 'Continue to Booking' : 'Sign In to Book'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
