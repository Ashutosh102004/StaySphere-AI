import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Home, MapPin, DollarSign, Users, Bed, Bath } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useProperty } from '@/hooks/use-property';
import { getApiErrorMessage } from '@/lib/api-error';

type PropertyType = 'HOUSE' | 'APARTMENT' | 'CONDO' | 'VILLA' | 'BED_AND_BREAKFAST' | 'HOSTEL' | 'HOTEL';

interface PropertyFormData {
  title: string;
  description: string;
  propertyType: PropertyType;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  amenities: string[];
  images: string[];
  cancellationPolicy: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
}

const PROPERTY_TYPES: PropertyType[] = ['HOUSE', 'APARTMENT', 'CONDO', 'VILLA', 'BED_AND_BREAKFAST', 'HOSTEL', 'HOTEL'];
const COMMON_AMENITIES = [
  'WiFi',
  'Air Conditioning',
  'Heating',
  'Kitchen',
  'Washer',
  'Dryer',
  'Parking',
  'Pool',
  'Hot Tub',
  'Gym',
  'TV',
  'Workspace',
];

export function EditPropertyPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { usePropertyById, useUpdateProperty } = useProperty();
  const [imageUrl, setImageUrl] = useState('');
  const [amenity, setAmenity] = useState('');

  const { data: property, isLoading, error } = usePropertyById(propertyId || '');
  const updatePropertyMutation = useUpdateProperty();

  const [form, setForm] = useState<PropertyFormData>({
    title: '',
    description: '',
    propertyType: 'HOUSE',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      coordinates: {
        latitude: 0,
        longitude: 0,
      },
    },
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    pricePerNight: 100,
    amenities: [],
    images: [],
    cancellationPolicy: 'MODERATE',
  });

  useEffect(() => {
    if (property) {
      setForm(property);
    }
  }, [property]);

  const handleInputChange = <K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an image URL',
        variant: 'destructive',
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, imageUrl],
    }));
    setImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleAddAmenity = () => {
    if (!amenity.trim()) return;

    if (form.amenities.includes(amenity)) {
      toast({
        title: 'Error',
        description: 'This amenity is already added',
        variant: 'destructive',
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      amenities: [...prev.amenities, amenity],
    }));
    setAmenity('');
  };

  const handleToggleAmenity = (am: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(am)
        ? prev.amenities.filter((a) => a !== am)
        : [...prev.amenities, am],
    }));
  };

  const handleRemoveAmenity = (index: number) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a property title',
        variant: 'destructive',
      });
      return;
    }

    if (!form.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a property description',
        variant: 'destructive',
      });
      return;
    }

    if (form.images.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one image',
        variant: 'destructive',
      });
      return;
    }

    if (!form.location.city.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a city',
        variant: 'destructive',
      });
      return;
    }

    if (!propertyId) return;

    updatePropertyMutation.mutate(
      { id: propertyId, ...form },
      {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Property updated successfully',
          });
          navigate('/host/properties');
        },
        onError: (error: unknown) => {
          toast({
            title: 'Error',
            description: getApiErrorMessage(error, 'Failed to update property'),
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Loading property...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading property. Please try again.</p>
            <Button onClick={() => navigate('/host/properties')} className="mt-4">
              Back to Properties
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/host/properties')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Property</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Cozy Apartment in Downtown"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Describe your property, amenities, house rules, etc."
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <select
                  id="propertyType"
                  value={form.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value as PropertyType)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  value={form.location.address}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={form.location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={form.location.state}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={form.location.country}
                  onChange={(e) => handleLocationChange('country', e.target.value)}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Details & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms" className="flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    Bedrooms
                  </Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="1"
                    value={form.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 1)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms" className="flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    Bathrooms
                  </Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="1"
                    value={form.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 1)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="maxGuests" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Max Guests
                </Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  value={form.maxGuests}
                  onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value) || 1)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="pricePerNight" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price Per Night
                </Label>
                <Input
                  id="pricePerNight"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.pricePerNight}
                  onChange={(e) => handleInputChange('pricePerNight', parseFloat(e.target.value) || 100)}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Images & Amenities */}
        <div className="lg:col-span-1 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddImage()}
                  />
                  <Button onClick={handleAddImage} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {form.images.map((img, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                    <img src={img} alt="" className="h-10 w-10 rounded object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveImage(idx)}
                      className="gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {form.images.length === 0 && (
                <p className="text-sm text-muted-foreground">No images added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amenity">Add Amenity</Label>
                <div className="flex gap-2">
                  <Input
                    id="amenity"
                    placeholder="e.g., Pool"
                    value={amenity}
                    onChange={(e) => setAmenity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAmenity()}
                  />
                  <Button onClick={handleAddAmenity} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Common</p>
                <div className="grid grid-cols-2 gap-1">
                  {COMMON_AMENITIES.map((am) => (
                    <label key={am} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(am)}
                        onChange={() => handleToggleAmenity(am)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs">{am}</span>
                    </label>
                  ))}
                </div>
              </div>

              {form.amenities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Selected ({form.amenities.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {form.amenities.map((am, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs"
                      >
                        {am}
                        <button
                          onClick={() => handleRemoveAmenity(idx)}
                          className="hover:opacity-70 transition-opacity ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="mt-8 flex gap-4">
        <Button variant="outline" onClick={() => navigate('/host/properties')} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={updatePropertyMutation.isPending} className="flex-1">
          {updatePropertyMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
