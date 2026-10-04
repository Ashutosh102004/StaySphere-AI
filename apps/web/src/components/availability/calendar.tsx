import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarProps {
  value?: Date;
  onChange?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
  blocked?: (date: Date) => boolean;
  onMonthChange?: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  showMultiSelect?: boolean;
}

export function Calendar({
  value,
  onChange,
  disabled,
  blocked,
  onMonthChange,
  minDate,
  maxDate,
  showMultiSelect = false,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedRange, setSelectedRange] = useState<{
    start?: Date;
    end?: Date;
  }>({});

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  }, [currentMonth]);

  const days = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    return days;
  }, [daysInMonth, firstDayOfMonth, currentMonth]);

  const handlePrevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
    onMonthChange?.(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
    onMonthChange?.(next);
  };

  const handleDayClick = (date: Date) => {
    if (showMultiSelect) {
      if (!selectedRange.start) {
        setSelectedRange({ start: date });
      } else if (!selectedRange.end) {
        if (date < selectedRange.start) {
          setSelectedRange({ start: date, end: selectedRange.start });
        } else {
          setSelectedRange({ ...selectedRange, end: date });
        }
        onChange?.(date);
      } else {
        setSelectedRange({ start: date });
      }
    } else {
      onChange?.(date);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const isDateRangeStart = (date: Date) => {
    if (!selectedRange.start) return false;
    return date.toDateString() === selectedRange.start.toDateString();
  };

  const isDateRangeEnd = (date: Date) => {
    if (!selectedRange.end) return false;
    return date.toDateString() === selectedRange.end.toDateString();
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return disabled?.(date) ?? false;
  };

  const isDateBlocked = (date: Date) => {
    return blocked?.(date) ?? false;
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{monthYear}</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground">
              {day}
            </div>
          ))}

          {days.map((date, idx) => (
            <div key={idx} className="h-8">
              {date ? (
                <button
                  onClick={() => handleDayClick(date)}
                  disabled={isDateDisabled(date)}
                  className={cn(
                    'h-8 w-8 rounded text-sm font-medium',
                    'border border-transparent',
                    'transition-colors',
                    isDateBlocked(date) && 'bg-red-100 text-red-800 cursor-not-allowed hover:bg-red-100',
                    isDateDisabled(date) && !isDateBlocked(date) && 'text-muted-foreground cursor-not-allowed hover:bg-transparent',
                    !isDateDisabled(date) && !isDateBlocked(date) && 'hover:bg-accent',
                    isDateRangeStart(date) && 'bg-primary text-primary-foreground border-primary',
                    isDateRangeEnd(date) && 'bg-primary text-primary-foreground border-primary',
                    isDateInRange(date) && !isDateRangeStart(date) && !isDateRangeEnd(date) && 'bg-primary/20 text-primary',
                    value && date.toDateString() === value.toDateString() && !showMultiSelect && 'bg-primary text-primary-foreground border-primary'
                  )}
                >
                  {date.getDate()}
                </button>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>

        {showMultiSelect && selectedRange.start && selectedRange.end && (
          <div className="pt-2 border-t text-sm text-muted-foreground">
            {selectedRange.start.toLocaleDateString()} - {selectedRange.end.toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
