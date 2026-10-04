import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useBooking } from '@/hooks/use-booking';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'ALL';

export function MyBookingsPage() {
  const navigate = useNavigate();
  const { useMyBookings, useCancelBooking } = useBooking();
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('ALL');

  const { data: bookings, isLoading, error } = useMyBookings();
  const cancelMutation = useCancelBooking();

  const filteredBookings = bookings?.filter((booking: any) => {
    if (statusFilter === 'ALL') return true;
    return booking.status === statusFilter;
  }) || [];

  const handleCancelBooking = (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      cancelMutation.mutate(bookingId, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Booking cancelled successfully',
          });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground mt-2">Manage your reservations</p>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as BookingStatus[]).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
            className="whitespace-nowrap"
          >
            {status === 'ALL' ? 'All Bookings' : status}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="pt-6 space-y-4">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load bookings. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* No Bookings */}
      {!isLoading && !error && filteredBookings.length === 0 && (
        <Card className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No bookings found</h2>
          <p className="text-muted-foreground mb-4">
            {statusFilter === 'ALL'
              ? "You haven't made any bookings yet. Start your journey!"
              : `No ${statusFilter.toLowerCase()} bookings`}
          </p>
          <Button onClick={() => navigate('/search')}>Browse Properties</Button>
        </Card>
      )}

      {/* Bookings List */}
      {!isLoading && !error && filteredBookings.length > 0 && (
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => (
            <Card key={booking._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Property Info */}
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-2">{booking.propertyId?.title || 'Property'}</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {booking.propertyId?.location?.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{booking.propertyId.location.city}</span>
                        </div>
                      )}
                      {booking.numberOfGuests && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Dates</p>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-semibold">Check-in: </span>
                        {formatDate(booking.checkInDate)}
                      </p>
                      <p>
                        <span className="font-semibold">Check-out: </span>
                        {formatDate(booking.checkOutDate)}
                      </p>
                      <p className="text-muted-foreground">
                        {calculateNights(booking.checkInDate, booking.checkOutDate)} nights
                      </p>
                    </div>
                  </div>

                  {/* Price & Status */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Total Price</p>
                      <p className="text-2xl font-bold">${booking.totalPrice}</p>
                    </div>
                    <div>
                      <Badge className={`${getStatusColor(booking.status)} flex items-center gap-2 w-fit`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/bookings/${booking._id}`)}
                  >
                    View Details
                  </Button>
                  {booking.status === 'CONFIRMED' || booking.status === 'PENDING' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
