import { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, Users, BookOpen, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type DateRange = '7d' | '30d' | '90d' | 'all';

interface EarningsData {
  totalEarnings: number;
  pendingEarnings: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  occupancyRate: number;
}

interface PropertyStats {
  propertyId: string;
  propertyTitle: string;
  earnings: number;
  bookings: number;
  rating: number;
  occupancyRate: number;
  pricePerNight: number;
}

interface Transaction {
  _id: string;
  bookingId: string;
  propertyTitle: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
  guestName: string;
}

const MOCK_EARNINGS: EarningsData = {
  totalEarnings: 12540,
  pendingEarnings: 850,
  thisMonth: 4230,
  lastMonth: 3890,
  growth: 8.7,
};

const MOCK_BOOKING_STATS: BookingStats = {
  totalBookings: 34,
  confirmedBookings: 28,
  cancelledBookings: 2,
  completedBookings: 32,
  occupancyRate: 76,
};

const MOCK_PROPERTIES: PropertyStats[] = [
  {
    propertyId: '1',
    propertyTitle: 'Downtown Modern Apartment',
    earnings: 5430,
    bookings: 12,
    rating: 4.8,
    occupancyRate: 85,
    pricePerNight: 120,
  },
  {
    propertyId: '2',
    propertyTitle: 'Beachfront Villa',
    earnings: 4890,
    bookings: 8,
    rating: 4.9,
    occupancyRate: 72,
    pricePerNight: 180,
  },
  {
    propertyId: '3',
    propertyTitle: 'Cozy Mountain Cottage',
    earnings: 2220,
    bookings: 6,
    rating: 4.6,
    occupancyRate: 68,
    pricePerNight: 95,
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    _id: '1',
    bookingId: 'BK-001',
    propertyTitle: 'Downtown Modern Apartment',
    amount: 840,
    date: '2026-10-03T14:30:00Z',
    status: 'COMPLETED',
    guestName: 'John Smith',
  },
  {
    _id: '2',
    bookingId: 'BK-002',
    propertyTitle: 'Beachfront Villa',
    amount: 1260,
    date: '2026-10-02T10:15:00Z',
    status: 'COMPLETED',
    guestName: 'Sarah Johnson',
  },
  {
    _id: '3',
    bookingId: 'BK-003',
    propertyTitle: 'Cozy Mountain Cottage',
    amount: 475,
    date: '2026-10-01T09:45:00Z',
    status: 'COMPLETED',
    guestName: 'Michael Brown',
  },
  {
    _id: '4',
    bookingId: 'BK-004',
    propertyTitle: 'Downtown Modern Apartment',
    amount: 360,
    date: '2026-09-30T16:20:00Z',
    status: 'PENDING',
    guestName: 'Emma Wilson',
  },
];

export function HostEarningsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Host Earnings</h1>
        <p className="text-muted-foreground mt-2">Track your income and property performance</p>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            onClick={() => setDateRange(range)}
            className="whitespace-nowrap"
          >
            {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'All Time'}
          </Button>
        ))}
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold mt-2">${MOCK_EARNINGS.totalEarnings}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Earnings</p>
                <p className="text-3xl font-bold mt-2">${MOCK_EARNINGS.pendingEarnings}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Pending payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold mt-2">${MOCK_EARNINGS.thisMonth}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
            <p className="text-xs text-green-600 mt-2">↑ {MOCK_EARNINGS.growth}% vs last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-3xl font-bold mt-2">{MOCK_BOOKING_STATS.occupancyRate}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Average across all properties</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold mt-2">{MOCK_BOOKING_STATS.totalBookings}</p>
              </div>
              <BookOpen className="h-6 w-6 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold mt-2 text-green-600">{MOCK_BOOKING_STATS.confirmedBookings}</p>
              </div>
              <Users className="h-6 w-6 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold mt-2 text-blue-600">{MOCK_BOOKING_STATS.completedBookings}</p>
              </div>
              <Award className="h-6 w-6 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Properties Performance */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {MOCK_PROPERTIES.map((property) => (
                <div key={property.propertyId}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{property.propertyTitle}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span>${property.pricePerNight}/night</span>
                        <span>★ {property.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">${property.earnings}</p>
                      <p className="text-xs text-muted-foreground">{property.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Occupancy</span>
                        <span>{property.occupancyRate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${property.occupancyRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_TRANSACTIONS.map((transaction) => (
              <div key={transaction._id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-semibold">${transaction.amount}</p>
                  <p className="text-xs text-muted-foreground">{transaction.guestName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                </div>
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Payout Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="font-semibold text-blue-900">Next Payout</p>
              <p className="text-sm text-blue-700 mt-1">October 10, 2026</p>
              <p className="text-xs text-blue-600 mt-2">Pending amount: ${MOCK_EARNINGS.pendingEarnings}</p>
            </div>
            <Button variant="outline" className="whitespace-nowrap">
              View Details
            </Button>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Bank Account</p>
            <div className="p-3 border rounded-lg">
              <p className="text-sm font-semibold">••••••••••••4242</p>
              <p className="text-xs text-muted-foreground">Wells Fargo - Checking</p>
            </div>
            <Button variant="outline" className="w-full mt-3">
              Edit Bank Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
