import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AvailabilityManagement } from '@/components/availability';
import { useProperty } from '@/hooks/use-property';

export function PropertyAvailabilityPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { usePropertyById } = useProperty();
  const { data: property, isLoading, error } = usePropertyById(propertyId || '');

  if (!propertyId) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold">Property not found</h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Loading property...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading property. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">{property?.title}</h1>
        <p className="text-muted-foreground mt-2">{property?.location?.address}</p>
      </div>

      <AvailabilityManagement propertyId={propertyId} />
    </div>
  );
}
