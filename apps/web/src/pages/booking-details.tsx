import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useBooking } from '@/hooks/use-booking';

export function BookingDetailsPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { useBookingById, useCancelBooking } = useBooking();

  if (!bookingId) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold">Booking not found</h1>
      </div>
    );
  }

  const { data: booking, isLoading, error } = useBookingById(bookingId);
  const cancelMutation = useCancelBooking();

  const handleCancelBooking = () => {
    if (
      confirm(
        'Are you sure you want to cancel this booking? You may be subject to cancellation fees.'
      )
    ) {
      cancelMutation.mutate(bookingId, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Booking cancelled successfully',
          });
          setTimeout(() => navigate('/bookings'), 1500);
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Failed to cancel booking',
            variant: 'destructive',
          });
        },
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading booking details. Please try again.</p>
            <Button onClick={() => navigate('/bookings')} className="mt-4">
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Booking Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Booking Status</span>
                <Badge className={`${getStatusColor(booking.status)}`}>
                  {booking.status === 'CONFIRMED' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {booking.status === 'PENDING' && <AlertCircle className="h-4 w-4 mr-2" />}
                  {booking.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {booking.status === 'CONFIRMED'
                  ? 'Your booking is confirmed. The host will be notified shortly.'
                  : booking.status === 'PENDING'
                  ? 'Your booking is pending confirmation from the host.'
                  : booking.status === 'CANCELLED'
                  ? 'This booking has been cancelled.'
                  : 'This booking has been completed.'}
              </p>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.propertyId?.images?.[0] && (
                <img
                  src={booking.propertyId.images[0].url}
                  alt={booking.propertyId.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">{booking.propertyId?.title}</h3>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {booking.propertyId?.location?.address}, {booking.propertyId?.location?.city}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Property Type</p>
                  <p className="font-semibold">{booking.propertyId?.propertyType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-semibold">{booking.propertyId?.maxGuests} guests</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p className="font-semibold">{booking.propertyId?.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p className="font-semibold">{booking.propertyId?.bathrooms}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Your Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Check-in</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{formatDate(booking.checkInDate)}</p>
                      <p className="text-xs text-muted-foreground">From 3:00 PM</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Check-out</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{formatDate(booking.checkOutDate)}</p>
                      <p className="text-xs text-muted-foreground">By 11:00 AM</p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{nights} nights</span>
                <span className="font-semibold">${booking.totalPrice}</span>
              </div>
            </CardContent>
          </Card>

          {/* Special Requests */}
          {booking.specialRequests && (
            <Card>
              <CardHeader>
                <CardTitle>Special Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{booking.specialRequests}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            {/* Price Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    ${booking.propertyId?.pricePerNight} × {nights} nights
                  </span>
                  <span className="font-semibold">
                    ${(booking.propertyId?.pricePerNight || 0) * nights}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold">${booking.totalPrice}</span>
                </div>
              </CardContent>
            </Card>

            {/* Guest Info */}
            <Card>
              <CardHeader>
                <CardTitle>Guests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelBooking}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
                  </Button>
                  <p className="text-xs text-red-600 mt-3">
                    Cancellations may be subject to fees depending on the host's cancellation policy.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Booking ID */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground mb-1">Booking ID</p>
                <p className="font-mono text-sm break-all">{booking._id}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
