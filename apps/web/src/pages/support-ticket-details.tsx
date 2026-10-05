import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface Message {
  _id: string;
  userId: string;
  userName: string;
  userRole: 'user' | 'staff';
  message: string;
  timestamp: string;
  isStaff: boolean;
}

interface TicketDetails {
  _id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { firstName: string; lastName: string; email: string };
  messages: Message[];
}

const MOCK_TICKET: TicketDetails = {
  _id: '1',
  subject: 'Payment not received',
  description: 'I completed a booking but the confirmation email never arrived.',
  status: 'OPEN',
  priority: 'HIGH',
  category: 'Payments',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  updatedAt: new Date(Date.now() - 3600000).toISOString(),
  assignedTo: {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@support.com',
  },
  messages: [
    {
      _id: '1',
      userId: 'user123',
      userName: 'John Doe',
      userRole: 'user',
      message: 'I completed a booking but the confirmation email never arrived.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isStaff: false,
    },
    {
      _id: '2',
      userId: 'staff123',
      userName: 'Sarah Johnson',
      userRole: 'staff',
      message:
        'Thank you for reaching out! I understand your concern. Let me look into your booking details and check the payment status.',
      timestamp: new Date(Date.now() - 72000000).toISOString(),
      isStaff: true,
    },
    {
      _id: '3',
      userId: 'user123',
      userName: 'John Doe',
      userRole: 'user',
      message: 'Thank you for checking. My booking ID is BK-12345. Can you confirm the payment was received?',
      timestamp: new Date(Date.now() - 64800000).toISOString(),
      isStaff: false,
    },
    {
      _id: '4',
      userId: 'staff123',
      userName: 'Sarah Johnson',
      userRole: 'staff',
      message:
        'I can confirm that the payment of $850 was successfully received and processed. The confirmation email should have been sent. Let me resend it to your email address right now.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isStaff: true,
    },
  ],
};

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

export function TicketDetailsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketDetails>(MOCK_TICKET);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_TICKET.messages);

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast({ title: 'Error', description: 'Message cannot be empty', variant: 'destructive' });
      return;
    }

    const message: Message = {
      _id: String(messages.length + 1),
      userId: 'user123',
      userName: 'You',
      userRole: 'user',
      message: newMessage,
      timestamp: new Date().toISOString(),
      isStaff: false,
    };

    setMessages([...messages, message]);
    setNewMessage('');
    toast({ title: 'Success', description: 'Message sent' });
  };

  const handleStatusChange = (newStatus: TicketStatus) => {
    setTicket((prev) => ({ ...prev, status: newStatus }));
    toast({ title: 'Success', description: `Ticket status updated to ${newStatus}` });
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    setTicket((prev) => ({ ...prev, priority: newPriority }));
    toast({ title: 'Success', description: `Ticket priority updated to ${newPriority}` });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusConfig = getStatusConfig(ticket.status);

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/support/tickets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Ticket #{ticket._id}</h1>
          <p className="text-muted-foreground mt-1">Created {formatDate(ticket.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>{ticket.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-base">{ticket.description}</p>
              </div>
              {ticket.category && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Category</p>
                  <Badge variant="outline">{ticket.category}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversation ({messages.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {messages.map((message) => (
                  <div key={message._id} className={`flex gap-4 ${message.isStaff ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                        message.isStaff ? 'bg-blue-600' : 'bg-gray-400'
                      }`}
                    >
                      {message.userName.charAt(0)}
                    </div>
                    <div className={`flex-1 ${message.isStaff ? 'items-start' : 'items-end'} flex flex-col`}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold">{message.userName}</p>
                        {message.isStaff && <Badge className="bg-blue-600">Staff</Badge>}
                      </div>
                      <div
                        className={`p-3 rounded-lg max-w-sm ${
                          message.isStaff ? 'bg-blue-50 border border-blue-200' : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} size="icon" className="gap-2">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                {statusConfig.icon}
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              </div>
              <Select value={ticket.status} onValueChange={(val) => handleStatusChange(val as TicketStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge className={getPriorityConfig(ticket.priority)}>{ticket.priority}</Badge>
              <Select value={ticket.priority} onValueChange={(val) => handlePriorityChange(val as TicketPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Assigned To */}
          {ticket.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assigned To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-semibold">
                    {ticket.assignedTo.firstName} {ticket.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{ticket.assignedTo.email}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(ticket.createdAt)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(ticket.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
