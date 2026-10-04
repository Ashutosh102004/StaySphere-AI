import { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Trash2, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type PropertyStatus = 'published' | 'unpublished' | 'hidden';

interface Property {
  _id: string;
  title: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  status: PropertyStatus;
  hostName: string;
  hostEmail: string;
  createdAt: string;
}

const MOCK_PROPERTIES: Property[] = [
  {
    _id: '1',
    title: 'Downtown Modern Apartment',
    description: 'Beautiful modern apartment in the heart of the city',
    location: {
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
    },
    pricePerNight: 120,
    rating: 4.8,
    reviewCount: 24,
    status: 'published',
    hostName: 'John Doe',
    hostEmail: 'john@example.com',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: '2',
    title: 'Beachfront Villa',
    description: 'Luxury beachfront property with ocean views',
    location: {
      address: '456 Beach Ave',
      city: 'Miami',
      state: 'FL',
    },
    pricePerNight: 280,
    rating: 4.9,
    reviewCount: 18,
    status: 'published',
    hostName: 'Sarah Johnson',
    hostEmail: 'sarah@example.com',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: '3',
    title: 'Mountain Cabin',
    description: 'Cozy cabin perfect for families',
    location: {
      address: '789 Mountain Rd',
      city: 'Aspen',
      state: 'CO',
    },
    pricePerNight: 95,
    rating: 4.6,
    reviewCount: 12,
    status: 'unpublished',
    hostName: 'Mike Chen',
    hostEmail: 'mike@example.com',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    _id: '4',
    title: 'Luxury Penthouse',
    description: 'High-end penthouse with premium amenities - FLAGGED FOR REVIEW',
    location: {
      address: '999 Luxury Tower',
      city: 'Los Angeles',
      state: 'CA',
    },
    pricePerNight: 450,
    rating: 0,
    reviewCount: 0,
    status: 'hidden',
    hostName: 'Emma Wilson',
    hostEmail: 'emma@example.com',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
];

const getStatusConfig = (status: PropertyStatus) => {
  const configs = {
    published: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-100 text-green-800', label: 'Published' },
    unpublished: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Unpublished',
    },
    hidden: { icon: <EyeOff className="h-4 w-4" />, color: 'bg-red-100 text-red-800', label: 'Hidden' },
  };
  return configs[status];
};

export function AdminPropertiesPage() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [filterStatus, setFilterStatus] = useState<PropertyStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filteredProperties = properties.filter((prop) => {
    const matchStatus = filterStatus === 'ALL' || prop.status === filterStatus;
    const matchSearch = prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleApprove = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p._id === propertyId ? { ...p, status: 'published' as PropertyStatus } : p
      )
    );
    toast({ title: 'Success', description: 'Property approved and published' });
    setIsDetailDialogOpen(false);
  };

  const handleReject = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p._id === propertyId ? { ...p, status: 'hidden' as PropertyStatus } : p
      )
    );
    toast({ title: 'Success', description: 'Property rejected and hidden' });
    setIsDetailDialogOpen(false);
  };

  const handleHide = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p._id === propertyId ? { ...p, status: 'hidden' as PropertyStatus } : p
      )
    );
    toast({ title: 'Success', description: 'Property hidden from listings' });
  };

  const handleUnhide = (propertyId: string) => {
    setProperties((prev) =>
      prev.map((p) =>
        p._id === propertyId ? { ...p, status: 'published' as PropertyStatus } : p
      )
    );
    toast({ title: 'Success', description: 'Property restored to listings' });
  };

  const handleDelete = (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      setProperties((prev) => prev.filter((p) => p._id !== propertyId));
      toast({ title: 'Success', description: 'Property deleted successfully' });
      setIsDetailDialogOpen(false);
    }
  };

  const statusCounts = {
    published: properties.filter((p) => p.status === 'published').length,
    unpublished: properties.filter((p) => p.status === 'unpublished').length,
    hidden: properties.filter((p) => p.status === 'hidden').length,
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Property Moderation</h1>
        <p className="text-muted-foreground mt-2">Review and manage property listings</p>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Published</p>
              <p className="text-3xl font-bold text-green-600">{statusCounts.published}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Unpublished</p>
              <p className="text-3xl font-bold text-yellow-600">{statusCounts.unpublished}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hidden</p>
              <p className="text-3xl font-bold text-red-600">{statusCounts.hidden}</p>
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
                placeholder="Search by title or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Status</Label>
              <Select
                value={filterStatus}
                onValueChange={(val) => setFilterStatus(val as PropertyStatus | 'ALL')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Properties</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="unpublished">Unpublished</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Export Properties
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <div className="space-y-4">
        {filteredProperties.map((property) => {
          const statusConfig = getStatusConfig(property.status);
          return (
            <Card key={property._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      {property.location.city}, {property.location.state}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{property.description}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      {statusConfig.icon}
                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rating & Host</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        {property.rating > 0 ? (
                          <>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{property.rating}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">No reviews</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{property.hostName}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Dialog open={isDetailDialogOpen && selectedProperty?._id === property._id} onOpenChange={setIsDetailDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProperty(property)}
                          className="w-full"
                        >
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>{selectedProperty?.title}</DialogTitle>
                          <DialogDescription>
                            Property moderation and management
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Description</Label>
                            <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedProperty?.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Location</Label>
                              <p className="text-sm font-medium mt-1">
                                {selectedProperty?.location.city}, {selectedProperty?.location.state}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Price</Label>
                              <p className="text-sm font-medium mt-1">${selectedProperty?.pricePerNight}/night</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Host</Label>
                              <p className="text-sm font-medium mt-1">{selectedProperty?.hostName}</p>
                              <p className="text-xs text-muted-foreground">{selectedProperty?.hostEmail}</p>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Status</Label>
                              <Badge className={getStatusConfig(selectedProperty?.status || 'published').color} className="mt-2">
                                {getStatusConfig(selectedProperty?.status || 'published').label}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {selectedProperty?.status === 'unpublished' && (
                              <>
                                <Button
                                  onClick={() => handleApprove(selectedProperty._id)}
                                  className="w-full bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve & Publish
                                </Button>
                                <Button
                                  onClick={() => handleReject(selectedProperty._id)}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Reject & Hide
                                </Button>
                              </>
                            )}

                            {selectedProperty?.status === 'published' && (
                              <Button
                                onClick={() => handleHide(selectedProperty._id)}
                                variant="destructive"
                                className="w-full"
                              >
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide from Listings
                              </Button>
                            )}

                            {selectedProperty?.status === 'hidden' && (
                              <Button
                                onClick={() => handleUnhide(selectedProperty._id)}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Restore to Listings
                              </Button>
                            )}

                            <Button
                              onClick={() => handleDelete(selectedProperty?._id || '')}
                              variant="ghost"
                              className="w-full text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Property
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProperties.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No properties found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
