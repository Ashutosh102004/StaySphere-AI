import { useState } from 'react';
import { Bell, Trash2, Archive, Check, Filter, Search, Clock, AlertCircle, CheckCircle2, MessageSquare, Heart, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type NotificationType = 'booking' | 'payment' | 'message' | 'review' | 'system' | 'promotion';
type NotificationStatus = 'unread' | 'read' | 'archived';

interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  actionUrl?: string;
  icon?: React.ReactNode;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    _id: '1',
    type: 'booking',
    title: 'New Booking Confirmed',
    message: 'Your property "Downtown Modern Apartment" has been booked for Oct 15-20, 2026',
    status: 'unread',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    actionUrl: '/bookings/1',
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  },
  {
    _id: '2',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $840 from booking BK-001. Payment will be transferred to your account on Oct 10.',
    status: 'unread',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    actionUrl: '/orders',
    icon: <DollarSign className="h-5 w-5 text-green-600" />,
  },
  {
    _id: '3',
    type: 'message',
    title: 'New Message',
    message: 'Sarah Johnson sent you a message: "Hi, I have a question about the check-in time..."',
    status: 'unread',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    actionUrl: '/support/tickets/1',
    icon: <MessageSquare className="h-5 w-5 text-blue-600" />,
  },
  {
    _id: '4',
    type: 'review',
    title: 'New 5-Star Review',
    message: 'John Doe left a 5-star review on your property "Beachfront Villa"',
    status: 'read',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    actionUrl: '/host/properties/2',
    icon: <Heart className="h-5 w-5 text-red-600" />,
  },
  {
    _id: '5',
    type: 'booking',
    title: 'Booking Cancelled',
    message: 'Guest cancelled their booking for Oct 22-25. Refund of $450 will be processed.',
    status: 'read',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    actionUrl: '/bookings',
    icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
  },
  {
    _id: '6',
    type: 'promotion',
    title: 'Special Promotion',
    message: 'New hosts get 20% discount on platform fees for the first 3 months!',
    status: 'read',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    icon: <Bell className="h-5 w-5 text-purple-600" />,
  },
];

const getTypeColor = (type: NotificationType) => {
  const colors = {
    booking: 'bg-blue-100 text-blue-800',
    payment: 'bg-green-100 text-green-800',
    message: 'bg-purple-100 text-purple-800',
    review: 'bg-red-100 text-red-800',
    system: 'bg-gray-100 text-gray-800',
    promotion: 'bg-orange-100 text-orange-800',
  };
  return colors[type];
};

const getTypeLabel = (type: NotificationType) => {
  const labels = {
    booking: 'Booking',
    payment: 'Payment',
    message: 'Message',
    review: 'Review',
    system: 'System',
    promotion: 'Promotion',
  };
  return labels[type];
};

export function NotificationCenterPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<NotificationType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifications = notifications.filter((notif) => {
    const matchStatus = filterStatus === 'ALL' || notif.status === filterStatus;
    const matchType = filterType === 'ALL' || notif.type === filterType;
    const matchSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;
  const readCount = notifications.filter((n) => n.status === 'read').length;
  const archivedCount = notifications.filter((n) => n.status === 'archived').length;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notificationId ? { ...n, status: 'read' as NotificationStatus } : n
      )
    );
    toast({ title: 'Marked as read' });
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.status === 'unread' ? { ...n, status: 'read' as NotificationStatus } : n
      )
    );
    toast({ title: 'All notifications marked as read' });
  };

  const handleArchive = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === notificationId ? { ...n, status: 'archived' as NotificationStatus } : n
      )
    );
    toast({ title: 'Archived' });
  };

  const handleDelete = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    toast({ title: 'Deleted' });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all archived notifications?')) {
      setNotifications((prev) => prev.filter((n) => n.status !== 'archived'));
      toast({ title: 'All archived notifications deleted' });
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">Stay updated with all your account activity</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" className="gap-2">
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{unreadCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Read</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{readCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Archived</p>
              <p className="text-3xl font-bold mt-2 text-gray-600">{archivedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as NotificationStatus | 'ALL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={(val) => setFilterType(val as NotificationType | 'ALL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {archivedCount > 0 && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleClearAll}
                >
                  Clear Archived
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <Card
              key={notif._id}
              className={`cursor-pointer transition-colors ${
                notif.status === 'unread' ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 mt-1">
                    {notif.icon || <Bell className="h-5 w-5 text-muted-foreground" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{notif.title}</h3>
                      <Badge className={getTypeColor(notif.type)}>
                        {getTypeLabel(notif.type)}
                      </Badge>
                      {notif.status === 'unread' && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(notif.createdAt)}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {notif.status === 'unread' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notif._id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}

                    {notif.status !== 'archived' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(notif._id)}
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notif._id)}
                      title="Delete"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No notifications found</p>
              {searchTerm && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination Info */}
      {filteredNotifications.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </div>
      )}
    </div>
  );
}
