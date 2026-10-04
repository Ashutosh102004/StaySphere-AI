import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, AlertCircle, CheckCircle, CreditCard, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useBooking } from '@/hooks/use-booking';

interface CheckoutData {
  bookingId: string;
  propertyTitle: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  pricePerNight: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  guestCount: number;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'review' | 'payment' | 'confirmation'>('review');
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderId: string;
    transactionId: string;
    bookingId: string;
  } | null>(null);

  // Load checkout data from location state
  useEffect(() => {
    if (location.state?.checkoutData) {
      setCheckoutData(location.state.checkoutData);
    } else {
      // Redirect if no checkout data
      toast({
        title: 'Error',
        description: 'No booking data found. Please start from search.',
        variant: 'destructive',
      });
      navigate('/search');
    }
  }, [location.state, navigate]);

  const handleGuestInfoChange = (field: string, value: string) => {
    setGuestInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePaymentInfoChange = (field: string, value: string) => {
    let formatted = value;

    if (field === 'cardNumber') {
      formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    } else if (field === 'expiryDate') {
      formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{0,2})/, '$1/$2');
    } else if (field === 'cvv') {
      formatted = value.replace(/\D/g, '').slice(0, 4);
    }

    setPaymentInfo((prev) => ({
      ...prev,
      [field]: formatted,
    }));
  };

  const validateGuestInfo = () => {
    if (!guestInfo.firstName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter first name',
        variant: 'destructive',
      });
      return false;
    }
    if (!guestInfo.lastName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter last name',
        variant: 'destructive',
      });
      return false;
    }
    if (!guestInfo.email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter email',
        variant: 'destructive',
      });
      return false;
    }
    if (!guestInfo.phone.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter phone number',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validatePaymentInfo = () => {
    const cardNumber = paymentInfo.cardNumber.replace(/\s/g, '');
    if (cardNumber.length < 15) {
      toast({
        title: 'Error',
        description: 'Please enter a valid card number',
        variant: 'destructive',
      });
      return false;
    }
    if (!paymentInfo.cardName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter name on card',
        variant: 'destructive',
      });
      return false;
    }
    if (paymentInfo.expiryDate.length < 5) {
      toast({
        title: 'Error',
        description: 'Please enter expiry date (MM/YY)',
        variant: 'destructive',
      });
      return false;
    }
    if (paymentInfo.cvv.length < 3) {
      toast({
        title: 'Error',
        description: 'Please enter valid CVV',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleProcessPayment = async () => {
    if (!validatePaymentInfo() || !checkoutData) return;

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setOrderConfirmation({
        orderId: `ORD-${Date.now()}`,
        transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        bookingId: checkoutData.bookingId,
      });
      setStep('confirmation');
      setIsProcessing(false);

      toast({
        title: 'Success',
        description: 'Payment processed successfully!',
      });
    }, 2000);
  };

  if (!checkoutData) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          disabled={step === 'confirmation'}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {step === 'review' && (
            <>
              {/* Property Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{checkoutData.propertyTitle}</h3>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="font-semibold">
                        {new Date(checkoutData.checkInDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p className="font-semibold">
                        {new Date(checkoutData.checkOutDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{checkoutData.nights} nights</span>
                    <span className="text-muted-foreground">{checkoutData.guestCount} guests</span>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Guest Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={guestInfo.firstName}
                        onChange={(e) => handleGuestInfoChange('firstName', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={guestInfo.lastName}
                        onChange={(e) => handleGuestInfoChange('lastName', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={guestInfo.email}
                      onChange={(e) => handleGuestInfoChange('email', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={guestInfo.phone}
                      onChange={(e) => handleGuestInfoChange('phone', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <textarea
                      id="specialRequests"
                      placeholder="Any special requests for the host?"
                      value={guestInfo.specialRequests}
                      onChange={(e) => handleGuestInfoChange('specialRequests', e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-2"
                    />
                  </div>

                  <Button onClick={() => setStep('payment')} className="w-full">
                    Continue to Payment
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {step === 'payment' && (
            <>
              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => handlePaymentInfoChange('cardNumber', e.target.value)}
                      maxLength={19}
                      className="mt-2 font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={paymentInfo.cardName}
                      onChange={(e) => handlePaymentInfoChange('cardName', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={paymentInfo.expiryDate}
                        onChange={(e) => handlePaymentInfoChange('expiryDate', e.target.value)}
                        maxLength={5}
                        className="mt-2 font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        placeholder="123"
                        value={paymentInfo.cvv}
                        onChange={(e) => handlePaymentInfoChange('cvv', e.target.value)}
                        maxLength={4}
                        className="mt-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Your payment information is encrypted and secure. We never store your full card details.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep('review')}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleProcessPayment}
                      disabled={isProcessing}
                      className="w-full"
                    >
                      {isProcessing ? 'Processing...' : 'Pay Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {step === 'confirmation' && orderConfirmation && (
            <>
              {/* Order Confirmation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Payment Confirmed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono font-semibold">{orderConfirmation.orderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-mono font-semibold">{orderConfirmation.transactionId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Booking ID</p>
                      <p className="font-mono font-semibold">{orderConfirmation.bookingId}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">What's Next?</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Confirmation email sent to {guestInfo.email}</li>
                      <li>• Host has 24 hours to confirm your booking</li>
                      <li>• You'll receive another confirmation once host approves</li>
                      <li>• Check-in instructions will be provided 24 hours before arrival</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/bookings')}
                      className="w-full"
                    >
                      View Booking
                    </Button>
                    <Button
                      onClick={() => navigate('/search')}
                      className="w-full"
                    >
                      Continue Browsing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar - Price Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  ${checkoutData.pricePerNight} × {checkoutData.nights} nights
                </span>
                <span className="font-semibold">${checkoutData.subtotal}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-semibold">${checkoutData.serviceFee}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold">${checkoutData.total}</span>
              </div>

              {step === 'review' && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    You won't be charged until the host confirms your booking.
                  </p>
                </div>
              )}

              {step === 'payment' && (
                <div className="pt-2 border-t flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Clicking "Pay Now" will process your payment. Refunds are subject to the host's cancellation policy.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
