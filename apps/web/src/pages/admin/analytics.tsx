import { useState } from 'react';
import { BarChart, Users, Home, BookOpen, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    activeHosts: number;
  };
  growth: {
    newUsers: number;
    newProperties: number;
    bookingsThisMonth: number;
  };
  bookingStatus: Record<string, number>;
  averagePropertyRating: string;
}

const MOCK_ANALYTICS: AnalyticsData = {
  overview: {
    totalUsers: 1250,
    totalProperties: 342,
    totalBookings: 2847,
    totalRevenue: 125400,
    activeHosts: 287,
  },
  growth: {
    newUsers: 145,
    newProperties: 23,
    bookingsThisMonth: 342,
  },
  bookingStatus: {
    PENDING: 45,
    CONFIRMED: 128,
    COMPLETED: 2647,
    CANCELLED: 27,
  },
  averagePropertyRating: '4.6',
};

const MOCK_PROPERTY_DISTRIBUTION = [
  { city: 'New York', count: 68 },
  { city: 'Los Angeles', count: 52 },
  { city: 'Chicago', count: 38 },
  { city: 'Houston', count: 32 },
  { city: 'Phoenix', count: 28 },
];

export function AdminAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30d');
  const [analytics] = useState<AnalyticsData>(MOCK_ANALYTICS);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">Platform overview and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold mt-2">{analytics.overview.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
            <p className="text-xs text-green-600 mt-2">↑ {analytics.growth.newUsers} new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Hosts</p>
                <p className="text-3xl font-bold mt-2">{analytics.overview.activeHosts}</p>
              </div>
              <Home className="h-8 w-8 text-green-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{Math.round((analytics.overview.activeHosts / analytics.overview.totalUsers) * 100)}% of users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-3xl font-bold mt-2">{analytics.overview.totalProperties}</p>
              </div>
              <BarChart className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
            <p className="text-xs text-green-600 mt-2">↑ {analytics.growth.newProperties} new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-2">{formatCurrency(analytics.overview.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">From completed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-3xl font-bold mt-2">{analytics.averagePropertyRating}★</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Properties average</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Bookings</p>
              <p className="text-2xl font-bold">{analytics.overview.totalBookings}</p>
              <p className="text-xs text-green-600 mt-2">↑ {analytics.growth.bookingsThisMonth} this month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Completed</p>
              <p className="text-2xl font-bold text-green-600">{analytics.bookingStatus.COMPLETED}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((analytics.bookingStatus.COMPLETED / analytics.overview.totalBookings) * 100)}% success rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Confirmed</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.bookingStatus.CONFIRMED}</p>
              <p className="text-xs text-muted-foreground mt-2">Awaiting completion</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{analytics.bookingStatus.CANCELLED}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((analytics.bookingStatus.CANCELLED / analytics.overview.totalBookings) * 100)}% cancellation rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.bookingStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{status}</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      status === 'COMPLETED'
                        ? 'bg-green-600'
                        : status === 'CONFIRMED'
                          ? 'bg-blue-600'
                          : status === 'PENDING'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                    }`}
                    style={{
                      width: `${(count / analytics.overview.totalBookings) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Properties by City */}
        <Card>
          <CardHeader>
            <CardTitle>Properties by Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_PROPERTY_DISTRIBUTION.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{item.city}</span>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(item.count / MOCK_PROPERTY_DISTRIBUTION[0].count) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
