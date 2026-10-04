import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, MapPin, DollarSign, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useProperty } from '@/hooks/use-property';

export function HostPropertiesPage() {
  const navigate = useNavigate();
  const { useMyProperties, useDeleteProperty, usePublishProperty, useUnpublishProperty } = useProperty();
  const [page, setPage] = useState(1);

  const { data: propertiesData, isLoading, error } = useMyProperties(page, 12);
  const deletePropertyMutation = useDeleteProperty();
  const publishPropertyMutation = usePublishProperty();
  const unpublishPropertyMutation = useUnpublishProperty();

  const properties = propertiesData?.properties || [];
  const total = propertiesData?.total || 0;
  const totalPages = propertiesData?.totalPages || 1;

  const handleDeleteProperty = (propertyId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deletePropertyMutation.mutate(propertyId, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Property deleted successfully',
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Failed to delete property',
            variant: 'destructive',
          });
        },
      });
    }
  };

  const handlePublishProperty = (propertyId: string) => {
    publishPropertyMutation.mutate(propertyId, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Property published successfully',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to publish property',
          variant: 'destructive',
        });
      },
    });
  };

  const handleUnpublishProperty = (propertyId: string) => {
    unpublishPropertyMutation.mutate(propertyId, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Property unpublished successfully',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to unpublish property',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Properties</h1>
          <p className="text-muted-foreground mt-2">Manage and monitor your listings</p>
        </div>
        <Button onClick={() => navigate('/host/properties/create')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Properties</p>
            <p className="text-3xl font-bold mt-2">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-3xl font-bold mt-2">
              {properties.filter((p: any) => p.published).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Drafts</p>
            <p className="text-3xl font-bold mt-2">
              {properties.filter((p: any) => !p.published).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="pt-6 space-y-4">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load properties. Please try again.</p>
          </CardContent>
        </Card>
      )}

      {/* No Properties */}
      {!isLoading && !error && properties.length === 0 && (
        <Card className="text-center py-12">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold">No properties yet</h2>
            <p className="text-muted-foreground">Start listing your first property to get started</p>
            <Button onClick={() => navigate('/host/properties/create')} className="mt-4">
              Create Your First Property
            </Button>
          </div>
        </Card>
      )}

      {/* Properties Grid */}
      {!isLoading && !error && properties.length > 0 && (
        <>
          <div className="space-y-4 mb-8">
            {properties.map((property: any) => (
              <Card key={property._id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Image */}
                  {property.images?.[0] && (
                    <div className="w-48 h-32 bg-muted flex-shrink-0">
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <CardContent className="flex-1 pt-6 pb-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{property.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>{property.location?.city}</span>
                          </div>
                        </div>
                        <Badge variant={property.published ? 'default' : 'secondary'}>
                          {property.published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>

                      <div className="flex gap-6 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{property.maxGuests} guests</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{property.bedrooms} beds</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${property.pricePerNight}/night</span>
                        </div>
                        {property.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{property.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/properties/${property._id}`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/host/properties/${property._id}/availability`)
                        }
                        className="gap-2"
                      >
                        Availability
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/host/properties/${property._id}/edit`)}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </Button>
                      {property.published ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnpublishProperty(property._id)}
                          disabled={unpublishPropertyMutation.isPending}
                          className="gap-2"
                        >
                          <EyeOff className="h-4 w-4" />
                          Unpublish
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublishProperty(property._id)}
                          disabled={publishPropertyMutation.isPending}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Publish
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteProperty(property._id, property.title)}
                        disabled={deletePropertyMutation.isPending}
                        className="gap-2 ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
