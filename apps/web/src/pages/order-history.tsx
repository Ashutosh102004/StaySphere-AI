import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Download, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

type OrderStatus = 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED' | 'ALL';

interface Order {
  _id: string;
  orderId: string;
  bookingId: string;
  propertyTitle: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  refundAmount?: number;
  refundReason?: string;
}

const MOCK_ORDERS: Order[] = [
  {
    _id: '1',
    orderId: 'ORD-1728014000000',
    bookingId: 'BK-001',
    propertyTitle: 'Cozy Downtown Apartment',
    transactionId: 'TXN-ABC123DEF',
    amount: 450,
    currency: 'USD',
    status: 'COMPLETED',
    paymentMethod: 'Credit Card (Visa)',
    createdAt: '2026-10-03T08:00:00Z',
    completedAt: '2026-10-03T08:05:00Z',
  },
  {
    _id: '2',
    orderId: 'ORD-1728013000000',
    bookingId: 'BK-002',
    propertyTitle: 'Modern Penthouse Suite',
    transactionId: 'TXN-GHI456JKL',
    amount: 875,
    currency: 'USD',
    status: 'COMPLETED',
    paymentMethod: 'Credit Card (Mastercard)',
    createdAt: '2026-10-02T14:30:00Z',
    completedAt: '2026-10-02T14:35:00Z',
  },
  {
    _id: '3',
    orderId: 'ORD-1728012000000',
    bookingId: 'BK-003',
    propertyTitle: 'Beach House Villa',
    transactionId: 'TXN-MNO789PQR',
    amount: 600,
    currency: 'USD',
    status: 'REFUNDED',
    paymentMethod: 'Credit Card (Visa)',
    createdAt: '2026-09-28T10:15:00Z',
    completedAt: '2026-09-28T10:20:00Z',
    refundAmount: 480,
    refundReason: 'Host cancelled - full refund',
  },
];

export function OrderHistoryPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<OrderStatus>('ALL');
  const [orders] = useState(MOCK_ORDERS);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    return order.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownloadReceipt = (orderId: string) => {
    toast({
      title: 'Success',
      description: `Receipt for ${orderId} downloaded`,
    });
  };

  const handleViewDetails = (bookingId: string) => {
    navigate(`/bookings/${bookingId}`);
  };

  const stats = {
    total: orders.length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    refunded: orders.filter((o) => o.status === 'REFUNDED').length,
    totalSpent: orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.amount, 0),
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="text-muted-foreground mt-2">View and manage your payments and orders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-3xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Refunded</p>
            <p className="text-3xl font-bold mt-2 text-blue-600">{stats.refunded}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-3xl font-bold mt-2">${stats.totalSpent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('ALL')}
          className="gap-2 whitespace-nowrap"
        >
          <Filter className="h-4 w-4" />
          All Orders
        </Button>
        {(['COMPLETED', 'PENDING', 'REFUNDED', 'CANCELLED'] as OrderStatus[]).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            onClick={() => setStatusFilter(status)}
            className="whitespace-nowrap"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card className="text-center py-12">
          <div className="space-y-4">
            <p className="text-muted-foreground">No {statusFilter === 'ALL' ? 'orders' : statusFilter.toLowerCase() + ' orders'} found</p>
            <Button onClick={() => navigate('/search')}>Browse Properties</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  {/* Order Info */}
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-2">{order.propertyTitle}</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Order ID: </span>
                        <span className="font-mono">{order.orderId}</span>
                      </p>
                      <p>
                        <span className="font-medium">Transaction: </span>
                        <span className="font-mono">{order.transactionId}</span>
                      </p>
                      <p>{order.paymentMethod}</p>
                    </div>
                  </div>

                  {/* Amount & Date */}
                  <div className="md:col-span-1">
                    <p className="text-sm text-muted-foreground mb-1">Amount</p>
                    <p className="text-2xl font-bold">
                      ${order.amount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1">
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    {order.refundAmount && (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        Refunded: ${order.refundAmount}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(order.bookingId)}
                      className="gap-2 flex-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReceipt(order.orderId)}
                      className="gap-2 flex-1"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Receipt</span>
                    </Button>
                  </div>
                </div>

                {/* Refund Info */}
                {order.status === 'REFUNDED' && order.refundReason && (
                  <>
                    <Separator className="my-4" />
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold">Refund Reason: </span>
                        {order.refundReason}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment Methods Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Payment Methods</h2>
        <Card>
          <CardHeader>
            <CardTitle>Saved Cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">Visa ending in 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/26</p>
              </div>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">Mastercard ending in 5555</p>
                <p className="text-sm text-muted-foreground">Expires 09/27</p>
              </div>
              <Button variant="outline" size="sm">
                Remove
              </Button>
            </div>
            <Separator />
            <Button variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
