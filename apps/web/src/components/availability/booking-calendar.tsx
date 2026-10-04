import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Calendar } from './calendar';

interface BookingCalendarProps {
  propertyId: string;
  basePrice?: number;
  onDatesSelected?: (dates: { checkIn: Date; checkOut: Date }) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export function BookingCalendar({ propertyId, basePrice = 100, onDatesSelected }: BookingCalendarProps) {
  const [selectedRange, setSelectedRange] = useState<{ start?: Date; end?: Date }>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Query availability for next 3 months
  const { data: availability, isLoading: loadingAvailability } = useQuery({
    queryKey: ['availability-query', propertyId],
    queryFn: async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      try {
        const response = await axios.get(
          `${API_URL}/availability/properties/${propertyId}/query`,
          {
            params: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
          }
        );
        return response.data.data;
      } catch (error) {
        console.error('Failed to load availability:', error);
        return null;
      }
    },
  });

  // Get pricing information
  const { data: availabilities } = useQuery({
    queryKey: ['availabilities-pricing', propertyId],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_URL}/availability/properties/${propertyId}/availabilities`, {
          params: { page: 1, limit: 100 },
        });
        return response.data.data.availabilities;
      } catch (error) {
        console.error('Failed to load pricing:', error);
        return [];
      }
    },
  });

  const handleDateClick = (date: Date) => {
    if (!selectedRange.start) {
      setSelectedRange({ start: date });
      setValidationError(null);
    } else if (!selectedRange.end) {
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else if (date.getTime() === selectedRange.start.getTime()) {
        setSelectedRange({});
      } else {
        setSelectedRange({ ...selectedRange, end: date });
      }
    } else {
      setSelectedRange({ start: date });
    }
  };

  const handleReserve = async () => {
    if (!selectedRange.start || !selectedRange.end) {
      setValidationError('Please select both check-in and check-out dates');
      return;
    }

    setValidationError(null);
    onDatesSelected?.({
      checkIn: selectedRange.start,
      checkOut: selectedRange.end,
    });

    toast({
      title: 'Dates Selected',
      description: `${selectedRange.start.toLocaleDateString()} to ${selectedRange.end.toLocaleDateString()}`,
    });
  };

  const isDateBlocked = (date: Date) => {
    if (!availability?.periods) return false;
    return availability.periods.some(
      (p: any) =>
        !p.available &&
        date >= new Date(p.startDate) &&
        date < new Date(p.endDate)
    );
  };

  const getEffectivePrice = (date: Date) => {
    if (!availabilities) return basePrice;
    const period = availabilities.find(
      (p: any) =>
        p.customPrice &&
        date >= new Date(p.startDate) &&
        date < new Date(p.endDate)
    );
    return period?.customPrice || basePrice;
  };

  const calculateTotalPrice = () => {
    if (!selectedRange.start || !selectedRange.end) return 0;

    let total = 0;
    const current = new Date(selectedRange.start);

    while (current < selectedRange.end) {
      const price = getEffectivePrice(current);
      total += price;
      current.setDate(current.getDate() + 1);
    }

    return total;
  };

  const nights = selectedRange.start && selectedRange.end
    ? Math.ceil((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loadingAvailability) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading availability...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Dates</CardTitle>
          <CardDescription>
            Click on dates to select your check-in and check-out
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Calendar
            value={selectedRange.start}
            onChange={handleDateClick}
            disabled={(date) => date < new Date()}
            blocked={isDateBlocked}
            showMultiSelect={true}
            minDate={new Date()}
          />

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {selectedRange.start && selectedRange.end && (
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Check-in</span>
                <span className="text-sm">{selectedRange.start.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Check-out</span>
                <span className="text-sm">{selectedRange.end.toLocaleDateString()}</span>
              </div>
              <div className="border-t border-blue-200 pt-3 flex items-center justify-between">
                <span className="text-sm font-medium">{nights} nights</span>
                <span className="text-lg font-bold text-primary">${calculateTotalPrice()}</span>
              </div>
              <Button onClick={handleReserve} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Continue to Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-primary" />
              <span>Selected dates</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-red-100 border border-red-300" />
              <span>Blocked/Unavailable</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded border border-gray-300 bg-white" />
              <span>Available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
