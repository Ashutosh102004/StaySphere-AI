import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Home, MapPin, DollarSign, Users, Bed, Bath } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useProperty } from '@/hooks/use-property';

type PropertyType = 'HOUSE' | 'APARTMENT' | 'CONDO' | 'VILLA' | 'BED_AND_BREAKFAST' | 'HOSTEL' | 'HOTEL';
type Step = 1 | 2 | 3 | 4;

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
  images: Array<{
    url: string;
    altText?: string;
  }>;
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

export function CreatePropertyPage() {
  const navigate = useNavigate();
  const { useCreateProperty } = useProperty();
  const [step, setStep] = useState<Step>(1);
  const [imageUrl, setImageUrl] = useState('');
  const [amenity, setAmenity] = useState('');

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
  });

  const createPropertyMutation = useCreateProperty();

  const handleInputChange = (field: string, value: any) => {
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
      images: [
        ...prev.images,
        {
          url: imageUrl,
          altText: `Property image ${prev.images.length + 1}`,
        },
      ],
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

    createPropertyMutation.mutate(form, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Property created successfully',
        });
        navigate('/host/properties');
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to create property',
          variant: 'destructive',
        });
      },
    });
  };

  const isStep1Valid = form.title.trim() && form.description.trim();
  const isStep2Valid = form.location.address.trim() && form.location.city.trim();
  const isStep3Valid = form.bedrooms > 0 && form.bathrooms > 0 && form.maxGuests > 0 && form.pricePerNight > 0;
  const isStep4Valid = form.images.length > 0 && form.amenities.length > 0;

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/host/properties')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create Property</h1>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 flex items-center gap-4">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
            {s < 4 && <Separator className="w-8" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
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
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => navigate('/host/properties')} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setStep(2)} disabled={!isStep1Valid} className="flex-1">
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
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

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!isStep2Valid} className="flex-1">
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Details & Pricing */}
      {step === 3 && (
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

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!isStep3Valid} className="flex-1">
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Images & Amenities */}
      {step === 4 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                      <div className="flex-1 truncate">
                        <img src={img.url} alt="" className="h-12 w-12 rounded object-cover" />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveImage(idx)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
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
                      placeholder="e.g., Pool, WiFi, Parking"
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
                  <p className="text-sm font-medium">Common Amenities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {COMMON_AMENITIES.map((am) => (
                      <label key={am} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.amenities.includes(am)}
                          onChange={() => handleToggleAmenity(am)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{am}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {form.amenities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected ({form.amenities.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {form.amenities.map((am, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm"
                        >
                          {am}
                          <button
                            onClick={() => handleRemoveAmenity(idx)}
                            className="hover:opacity-70 transition-opacity"
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

          {/* Submit Buttons */}
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isStep4Valid || createPropertyMutation.isPending}
              className="flex-1"
            >
              {createPropertyMutation.isPending ? 'Creating...' : 'Create Property'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
