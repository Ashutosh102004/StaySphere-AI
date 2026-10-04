import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Sparkles, Home, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  _id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const MOCK_INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content:
      'Hello! 👋 I\'m your StaySphere AI Assistant. I\'m here to help you find the perfect vacation rental, answer questions about bookings, and provide personalized property recommendations. What can I help you with today?',
    timestamp: new Date().toISOString(),
  },
];

const SUGGESTED_QUESTIONS = [
  'Find me beachfront properties in Miami',
  'What properties have the best ratings?',
  'Show me pet-friendly rentals under $150/night',
  'Recommend properties for a weekend getaway',
  'Help me plan a group vacation for 8 people',
];

export function AIChatPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(MOCK_INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: String(messages.length + 1),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: String(messages.length + 2),
        role: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('beachfront') || input.includes('beach')) {
      return 'I found some amazing beachfront properties for you! 🏖️\n\n• Beachfront Villa (Miami) - $280/night - ⭐ 4.9 (18 reviews)\n• Oceanview Cottage (San Diego) - $195/night - ⭐ 4.7 (22 reviews)\n• Tropical Paradise (Hawaii) - $350/night - ⭐ 5.0 (8 reviews)\n\nWould you like more details about any of these properties?';
    } else if (input.includes('pet') || input.includes('dog') || input.includes('cat')) {
      return 'Here are pet-friendly properties within your budget:\n\n• Downtown Pet-Friendly Studio - $120/night - ⭐ 4.5\n• Countryside Cottage (pets welcome) - $95/night - ⭐ 4.6\n• Modern Loft (dog-friendly) - $140/night - ⭐ 4.8\n\nAll of these allow pets. Do you need any specific amenities?';
    } else if (input.includes('group') || input.includes('people')) {
      return 'For a group of 8 people, I recommend these spacious properties:\n\n• Mountain Resort (sleeps 10) - $400/night - ⭐ 4.9\n• Lakeside Manor (sleeps 12) - $350/night - ⭐ 4.8\n• Villa Grande (sleeps 8) - $300/night - ⭐ 4.7\n\nThese have multiple bedrooms and common areas perfect for groups. Interested in any?';
    } else if (input.includes('recommend') || input.includes('suggest')) {
      return "I'd love to help! To give you the best recommendations, could you tell me:\n\n1. What's your preferred location?\n2. What's your budget range?\n3. Are you traveling with family, friends, or solo?\n4. Any specific amenities you need?\n\nLet me know and I'll find perfect matches for you!";
    } else if (input.includes('rating') || input.includes('best')) {
      return 'Our highest-rated properties are:\n\n1. Tropical Paradise (Hawaii) - ⭐ 5.0 - $350/night\n2. Beachfront Villa (Miami) - ⭐ 4.9 - $280/night\n3. Mountain Resort - ⭐ 4.9 - $400/night\n\nThese have excellent reviews from guests. Want to book one?';
    } else {
      return "Thanks for your question! I can help you with:\n\n✓ Finding properties by location, price, or amenities\n✓ Getting personalized recommendations\n✓ Answering questions about bookings and cancellations\n✓ Providing property details and guest reviews\n\nWhat would you like to explore?";
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container max-w-4xl py-8 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Assistant</h1>
        </div>
        <p className="text-muted-foreground">Get personalized property recommendations and answers</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                    message.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
                  }`}
                >
                  {message.role === 'user' ? 'You' : 'AI'}
                </div>
                <div
                  className={`flex-1 ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col max-w-lg`}
                >
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-muted rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(message.timestamp)}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-600 text-white text-sm font-semibold flex-shrink-0">
                  AI
                </div>
                <div className="p-3 rounded-lg bg-muted rounded-bl-none">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>
        </Card>

        {/* Suggested Questions (shown when chat is empty or new) */}
        {messages.length <= 1 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Quick suggestions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTED_QUESTIONS.map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  <span className="text-xs">{question}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Ask me anything about properties, bookings, or recommendations..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
