import { useState } from 'react';
import { Plus, Filter, AlertCircle, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

const MOCK_TICKETS: Ticket[] = [
  {
    _id: '1',
    subject: 'Payment not received',
    description: 'I completed a booking but the confirmation email never arrived.',
    status: 'OPEN',
    priority: 'HIGH',
    category: 'Payments',
    messageCount: 2,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: '2',
    subject: 'Cannot update property details',
    description: 'Getting an error when trying to edit my property listing.',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    category: 'Technical',
    messageCount: 3,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    _id: '3',
    subject: 'Refund request',
    description: 'I need to request a refund for my recent booking.',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    category: 'Refunds',
    messageCount: 5,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: '4',
    subject: 'Feature request: Calendar sync',
    description: 'Would love to sync my availability calendar with Google Calendar.',
    status: 'CLOSED',
    priority: 'LOW',
    category: 'Feature Request',
    messageCount: 1,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    _id: '5',
    subject: 'Urgent: Account security issue',
    description: 'I noticed suspicious login attempts on my account.',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    category: 'Security',
    messageCount: 4,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const getStatusConfig = (status: TicketStatus) => {
  const configs = {
    OPEN: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800', label: 'Open' },
    IN_PROGRESS: {
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'In Progress',
    },
    RESOLVED: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800',
      label: 'Resolved',
    },
    CLOSED: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800', label: 'Closed' },
  };
  return configs[status];
};

const getPriorityConfig = (priority: TicketPriority) => {
  const configs = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  };
  return configs[priority];
};

export function SupportTicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<TicketPriority | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: '', priority: 'MEDIUM' as TicketPriority });

  const filteredTickets = tickets.filter((ticket) => {
    const matchStatus = filterStatus === 'ALL' || ticket.status === filterStatus;
    const matchPriority = filterPriority === 'ALL' || ticket.priority === filterPriority;
    const matchSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.description) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    const ticket: Ticket = {
      _id: String(tickets.length + 1),
      subject: newTicket.subject,
      description: newTicket.description,
      category: newTicket.category,
      status: 'OPEN',
      priority: newTicket.priority,
      messageCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTickets([ticket, ...tickets]);
    setNewTicket({ subject: '', description: '', category: '', priority: 'MEDIUM' });
    setIsCreateDialogOpen(false);
    toast({ title: 'Success', description: 'Support ticket created successfully' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">Create and manage your support requests</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>Submit a new support request. We'll get back to you soon.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newTicket.category} onValueChange={(val) => setNewTicket((prev) => ({ ...prev, category: val }))}>
                  <SelectTrigger id="category" className="mt-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Payments">Payments</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Refunds">Refunds</SelectItem>
                    <SelectItem value="Booking">Booking</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTicket.priority} onValueChange={(val) => setNewTicket((prev) => ({ ...prev, priority: val as TicketPriority }))}>
                  <SelectTrigger id="priority" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  placeholder="Detailed description of your issue..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-24 p-2 border rounded-md text-sm"
                />
              </div>

              <Button onClick={handleCreateTicket} className="w-full">
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-3xl font-bold mt-2">{openCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold mt-2">{inProgressCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold mt-2">{resolvedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm mb-2 block">Search</Label>
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Status</Label>
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as TicketStatus | 'ALL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Priority</Label>
              <Select value={filterPriority} onValueChange={(val) => setFilterPriority(val as TicketPriority | 'ALL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No tickets found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => {
            const statusConfig = getStatusConfig(ticket.status);
            return (
              <Link key={ticket._id} to={`/support/tickets/${ticket._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{ticket.description}</p>
                        {ticket.category && <Badge variant="outline" className="mt-2">{ticket.category}</Badge>}
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          {statusConfig.icon}
                          <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Priority</p>
                        <Badge className={getPriorityConfig(ticket.priority)}>{ticket.priority}</Badge>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Activity</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <MessageSquare className="h-4 w-4" />
                            {ticket.messageCount} messages
                          </div>
                          <p className="text-xs text-muted-foreground">{formatDate(ticket.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
