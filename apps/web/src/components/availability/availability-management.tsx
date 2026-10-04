import { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAvailability } from '@/hooks/use-availability';
import { Calendar as CalendarComponent } from './calendar';

interface AvailabilityManagementProps {
  propertyId: string;
}

export function AvailabilityManagement({ propertyId }: AvailabilityManagementProps) {
  const [activeTab, setActiveTab] = useState<'availability' | 'pricing' | 'requirements'>('availability');
  const [selectedDates, setSelectedDates] = useState<{ start?: Date; end?: Date }>({});
  const [blockType, setBlockType] = useState<'block' | 'unblock'>('block');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [minStay, setMinStay] = useState<string>('');
  const [maxStay, setMaxStay] = useState<string>('');
  const [leadDays, setLeadDays] = useState<string>('');

  const availability = useAvailability(propertyId);
  const { data: availabilities, isLoading: loadingAvailabilities } = availability.useAvailabilities();
  const blockDatesMutation = blockType === 'block'
    ? availability.useBlockDates()
    : availability.useUnblockDates();
  const setPricingMutation = availability.useSetPricing();
  const setStayRequirementsMutation = availability.useSetStayRequirements();
  const setLeadTimeMutation = availability.useSetLeadTime();

  const handleDateClick = (date: Date) => {
    if (!selectedDates.start) {
      setSelectedDates({ start: date });
    } else if (!selectedDates.end) {
      if (date < selectedDates.start) {
        setSelectedDates({ start: date, end: selectedDates.start });
      } else {
        setSelectedDates({ ...selectedDates, end: date });
      }
    } else {
      setSelectedDates({ start: date });
    }
  };

  const handleBlockDates = () => {
    if (!selectedDates.start || !selectedDates.end) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }
    blockDatesMutation.mutate({
      propertyId,
      startDate: selectedDates.start,
      endDate: selectedDates.end,
    });
    setSelectedDates({});
  };

  const handleSetPricing = () => {
    if (!selectedDates.start || !selectedDates.end) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }
    if (!customPrice || isNaN(parseFloat(customPrice))) {
      toast({
        title: 'Error',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }
    setPricingMutation.mutate({
      propertyId,
      startDate: selectedDates.start,
      endDate: selectedDates.end,
      customPrice: parseFloat(customPrice),
    });
    setSelectedDates({});
    setCustomPrice('');
  };

  const handleSetStayRequirements = () => {
    if (!selectedDates.start || !selectedDates.end) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }
    if (!minStay || !maxStay || isNaN(parseInt(minStay)) || isNaN(parseInt(maxStay))) {
      toast({
        title: 'Error',
        description: 'Please enter valid min and max stay values',
        variant: 'destructive',
      });
      return;
    }
    setStayRequirementsMutation.mutate({
      propertyId,
      startDate: selectedDates.start,
      endDate: selectedDates.end,
      minStay: parseInt(minStay),
      maxStay: parseInt(maxStay),
    });
    setSelectedDates({});
    setMinStay('');
    setMaxStay('');
  };

  const handleSetLeadTime = () => {
    if (!selectedDates.start || !selectedDates.end) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }
    if (!leadDays || isNaN(parseInt(leadDays))) {
      toast({
        title: 'Error',
        description: 'Please enter a valid number of lead days',
        variant: 'destructive',
      });
      return;
    }
    setLeadTimeMutation.mutate({
      propertyId,
      startDate: selectedDates.start,
      endDate: selectedDates.end,
      leadDays: parseInt(leadDays),
    });
    setSelectedDates({});
    setLeadDays('');
  };

  const isDateBlocked = (date: Date) => {
    return availabilities?.some(
      (a: any) =>
        !a.available &&
        date >= new Date(a.startDate) &&
        date < new Date(a.endDate)
    ) ?? false;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability Management
          </CardTitle>
          <CardDescription>
            Manage your property's availability, pricing, and booking requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'availability'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Block Dates
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'pricing'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Pricing
            </button>
            <button
              onClick={() => setActiveTab('requirements')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'requirements'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Requirements
            </button>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <CalendarComponent
                value={selectedDates.start}
                disabled={(date) => date < new Date()}
                blocked={isDateBlocked}
                showMultiSelect={true}
                onChange={handleDateClick}
              />
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {activeTab === 'availability' && (
                <>
                  <div>
                    <Label>Block Type</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant={blockType === 'block' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBlockType('block')}
                      >
                        Block Dates
                      </Button>
                      <Button
                        variant={blockType === 'unblock' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBlockType('unblock')}
                      >
                        Unblock Dates
                      </Button>
                    </div>
                  </div>

                  {selectedDates.start && selectedDates.end && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        Selected: {selectedDates.start.toLocaleDateString()} to{' '}
                        {selectedDates.end.toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleBlockDates}
                    disabled={!selectedDates.start || !selectedDates.end || blockDatesMutation.isPending}
                    className="w-full"
                  >
                    {blockDatesMutation.isPending ? 'Updating...' : `${blockType === 'block' ? 'Block' : 'Unblock'} Dates`}
                  </Button>
                </>
              )}

              {activeTab === 'pricing' && (
                <>
                  <div>
                    <Label htmlFor="price">Custom Price per Night</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Enter price per night"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      min="0"
                      step="1"
                      className="mt-2"
                    />
                  </div>

                  {selectedDates.start && selectedDates.end && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        Selected: {selectedDates.start.toLocaleDateString()} to{' '}
                        {selectedDates.end.toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSetPricing}
                    disabled={!selectedDates.start || !selectedDates.end || !customPrice || setPricingMutation.isPending}
                    className="w-full"
                  >
                    {setPricingMutation.isPending ? 'Setting...' : 'Set Pricing'}
                  </Button>
                </>
              )}

              {activeTab === 'requirements' && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="min-stay">Minimum Stay (nights)</Label>
                      <Input
                        id="min-stay"
                        type="number"
                        placeholder="Minimum nights"
                        value={minStay}
                        onChange={(e) => setMinStay(e.target.value)}
                        min="1"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-stay">Maximum Stay (nights)</Label>
                      <Input
                        id="max-stay"
                        type="number"
                        placeholder="Maximum nights"
                        value={maxStay}
                        onChange={(e) => setMaxStay(e.target.value)}
                        min="1"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lead-days">Lead Time (days)</Label>
                      <Input
                        id="lead-days"
                        type="number"
                        placeholder="Days in advance to book"
                        value={leadDays}
                        onChange={(e) => setLeadDays(e.target.value)}
                        min="0"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {selectedDates.start && selectedDates.end && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        Selected: {selectedDates.start.toLocaleDateString()} to{' '}
                        {selectedDates.end.toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={handleSetStayRequirements}
                      disabled={!selectedDates.start || !selectedDates.end || !minStay || !maxStay || setStayRequirementsMutation.isPending}
                      className="w-full"
                    >
                      {setStayRequirementsMutation.isPending ? 'Setting...' : 'Set Stay Requirements'}
                    </Button>
                    <Button
                      onClick={handleSetLeadTime}
                      disabled={!selectedDates.start || !selectedDates.end || !leadDays || setLeadTimeMutation.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {setLeadTimeMutation.isPending ? 'Setting...' : 'Set Lead Time'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Current Blocking */}
          {loadingAvailabilities ? (
            <div className="text-center py-8 text-muted-foreground">Loading availability...</div>
          ) : availabilities && availabilities.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-3">Current Blocked Dates</h4>
              <div className="space-y-2">
                {availabilities
                  .filter((a: any) => !a.available)
                  .map((a: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <span>
                        {new Date(a.startDate).toLocaleDateString()} - {new Date(a.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
