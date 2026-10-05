import { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type VerificationStep = 'info' | 'document' | 'selfie' | 'review' | 'complete';
type DocumentType = 'PASSPORT' | 'NATIONAL_ID' | 'DRIVING_LICENSE';
type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'REVIEW_REQUIRED' | 'EXPIRED';

interface VerificationData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentType: DocumentType | '';
  documentFront: File | null;
  documentBack: File | null;
  selfieImage: File | null;
}

interface VerificationStatusData {
  status: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  events: Array<{
    status: string;
    timestamp: string;
    details?: string;
  }>;
}

const DOCUMENT_TYPES = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
];

const STEPS = [
  { id: 'info', title: 'Personal Info', description: 'Enter your details' },
  { id: 'document', title: 'Document Upload', description: 'Upload ID documents' },
  { id: 'selfie', title: 'Selfie', description: 'Take a selfie photo' },
  { id: 'review', title: 'Review', description: 'Verify your information' },
];

const STATUS_CONFIG: Record<VerificationStatus, { icon: React.ReactNode; color: string; text: string }> = {
  NOT_STARTED: { icon: <Clock className="h-5 w-5" />, color: 'bg-gray-100 text-gray-800', text: 'Not Started' },
  PENDING: { icon: <Clock className="h-5 w-5" />, color: 'bg-yellow-100 text-yellow-800', text: 'Under Review' },
  VERIFIED: { icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-green-100 text-green-800', text: 'Verified' },
  FAILED: { icon: <AlertCircle className="h-5 w-5" />, color: 'bg-red-100 text-red-800', text: 'Failed' },
  REVIEW_REQUIRED: { icon: <AlertCircle className="h-5 w-5" />, color: 'bg-orange-100 text-orange-800', text: 'Review Required' },
  EXPIRED: { icon: <AlertCircle className="h-5 w-5" />, color: 'bg-red-100 text-red-800', text: 'Expired' },
};

const MOCK_VERIFICATION_STATUS: VerificationStatusData = {
  status: 'PENDING',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  events: [
    {
      status: 'INITIATED',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      details: 'Verification initiated',
    },
    {
      status: 'DOCUMENT_SUBMITTED',
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      details: 'Document submitted for review',
    },
  ],
};

export function IdentityVerificationPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<VerificationStep>('info');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusData>(MOCK_VERIFICATION_STATUS);
  const [data, setData] = useState<VerificationData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    documentType: '',
    documentFront: null,
    documentBack: null,
    selfieImage: null,
  });

  const handleInputChange = (field: keyof VerificationData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'documentFront' | 'documentBack' | 'selfieImage', file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'File size must be less than 5MB', variant: 'destructive' });
      return;
    }
    setData((prev) => ({ ...prev, [field]: file }));
  };

  const isInfoValid = data.firstName && data.lastName && data.dateOfBirth && data.documentType;
  const isDocumentValid = data.documentFront && data.documentType;
  const isSelfieValid = data.selfieImage;

  const handleNext = () => {
    if (currentStep === 'info' && !isInfoValid) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    if (currentStep === 'document' && !isDocumentValid) {
      toast({ title: 'Error', description: 'Please upload required documents', variant: 'destructive' });
      return;
    }
    if (currentStep === 'selfie' && !isSelfieValid) {
      toast({ title: 'Error', description: 'Please upload a selfie photo', variant: 'destructive' });
      return;
    }

    if (currentStep === 'info') setCurrentStep('document');
    else if (currentStep === 'document') setCurrentStep('selfie');
    else if (currentStep === 'selfie') setCurrentStep('review');
  };

  const handleSubmit = async () => {
    toast({ title: 'Success', description: 'Identity verification submitted for review' });
    setCurrentStep('complete');
    setVerificationStatus((prev) => ({
      ...prev,
      status: 'PENDING',
      events: [
        ...prev.events,
        {
          status: 'SUBMITTED',
          timestamp: new Date().toISOString(),
          details: 'Verification submitted for review',
        },
      ],
    }));
  };

  const handleBack = () => {
    if (currentStep === 'document') setCurrentStep('info');
    else if (currentStep === 'selfie') setCurrentStep('document');
    else if (currentStep === 'review') setCurrentStep('selfie');
  };

  const statusConfig = STATUS_CONFIG[verificationStatus.status];

  if (currentStep === 'complete') {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardContent className="pt-12 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Verification Submitted</h1>
            <p className="text-muted-foreground mb-6">Your identity verification has been submitted for review.</p>
            <p className="text-sm text-muted-foreground mb-8">
              We typically review verifications within 24-48 hours. You'll receive an email notification once the
              review is complete.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Identity Verification</h1>
        <p className="text-muted-foreground mt-2">Complete verification to unlock full platform features</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Verification Status */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {statusConfig.icon}
                <Badge className={statusConfig.color}>{statusConfig.text}</Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Started: {new Date(verificationStatus.createdAt).toLocaleDateString()}</p>
                <p>Last updated: {new Date(verificationStatus.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentStep === step.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => {
                    if (
                      (step.id === 'document' && isInfoValid) ||
                      (step.id === 'selfie' && isDocumentValid) ||
                      (step.id === 'review' && isSelfieValid) ||
                      step.id === 'info'
                    ) {
                      setCurrentStep(step.id as VerificationStep);
                    }
                  }}
                >
                  <p className="font-medium text-sm">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{STEPS.find((s) => s.id === currentStep)?.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Personal Info */}
              {currentStep === 'info' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={data.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={data.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={data.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="documentType">Document Type *</Label>
                    <Select value={data.documentType} onValueChange={(val) => handleInputChange('documentType', val)}>
                      <SelectTrigger id="documentType" className="mt-2">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((doc) => (
                          <SelectItem key={doc.value} value={doc.value}>
                            {doc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      Your information will be securely verified against official documents. We use industry-leading
                      encryption to protect your data.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Document Upload */}
              {currentStep === 'document' && (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Front of {data.documentType} *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('documentFront', e.target.files?.[0] || null)}
                        className="hidden"
                        id="documentFront"
                      />
                      <label htmlFor="documentFront" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                        {data.documentFront && <p className="text-sm text-green-600 mt-2">✓ {data.documentFront.name}</p>}
                      </label>
                    </div>
                  </div>

                  {data.documentType !== 'PASSPORT' && (
                    <div>
                      <Label className="mb-2 block">Back of {data.documentType}</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange('documentBack', e.target.files?.[0] || null)}
                          className="hidden"
                          id="documentBack"
                        />
                        <label htmlFor="documentBack" className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                          {data.documentBack && <p className="text-sm text-green-600 mt-2">✓ {data.documentBack.name}</p>}
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      • Ensure the document is clear and fully visible • Check that all text is readable • No glare or
                      shadows
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Selfie */}
              {currentStep === 'selfie' && (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Selfie Photo *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('selfieImage', e.target.files?.[0] || null)}
                        className="hidden"
                        id="selfieImage"
                      />
                      <label htmlFor="selfieImage" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                        {data.selfieImage && <p className="text-sm text-green-600 mt-2">✓ {data.selfieImage.name}</p>}
                      </label>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                    <p className="text-sm font-medium text-blue-900">Selfie Requirements:</p>
                    <ul className="text-sm text-blue-900 list-disc list-inside space-y-1">
                      <li>Face should be clearly visible and centered</li>
                      <li>Good lighting - no shadows on face</li>
                      <li>Neutral background recommended</li>
                      <li>No filters or heavy makeup</li>
                      <li>Face must match your document photo</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 'review' && (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">
                        {data.firstName} {data.lastName}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{new Date(data.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Document Type</p>
                      <p className="font-medium">{data.documentType}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                      <div className="space-y-1 mt-2">
                        <p className="text-sm">✓ Front side</p>
                        {data.documentBack && <p className="text-sm">✓ Back side</p>}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Selfie Photo</p>
                      <p className="text-sm">✓ Uploaded</p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-900">
                      Your information is ready for review. Please ensure all details are correct before submitting. You
                      can go back to make changes.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 'info'}
                  className="gap-2"
                >
                  Back
                </Button>

                {currentStep !== 'review' && (
                  <Button onClick={handleNext} disabled={false} className="gap-2">
                    Next
                  </Button>
                )}

                {currentStep === 'review' && (
                  <Button onClick={handleSubmit} className="gap-2 bg-green-600 hover:bg-green-700">
                    Submit Verification
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
