import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { RootLayout } from '@/components/layout/root-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { DashboardPage } from '@/pages/dashboard';
import { PropertyDetailsPage } from '@/pages/property-details';
import { PropertyAvailabilityPage } from '@/pages/host/property-availability';
import { HostPropertiesPage } from '@/pages/host/properties';
import { CreatePropertyPage } from '@/pages/host/properties-create';
import { EditPropertyPage } from '@/pages/host/properties-edit';
import { SearchPage } from '@/pages/search';
import { MyBookingsPage } from '@/pages/my-bookings';
import { BookingDetailsPage } from '@/pages/booking-details';
import { CheckoutPage } from '@/pages/checkout';
import { OrderHistoryPage } from '@/pages/order-history';
import { HostEarningsPage } from '@/pages/host/earnings';
import { IdentityVerificationPage } from '@/pages/identity-verification';
import { SupportTicketsPage } from '@/pages/support-tickets';
import { TicketDetailsPage } from '@/pages/support-ticket-details';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="staysphere-ui-theme">
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route element={<RootLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings/:bookingId"
                  element={
                    <ProtectedRoute>
                      <BookingDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <OrderHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/verify"
                  element={
                    <ProtectedRoute>
                      <IdentityVerificationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/support/tickets"
                  element={
                    <ProtectedRoute>
                      <SupportTicketsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/support/tickets/:ticketId"
                  element={
                    <ProtectedRoute>
                      <TicketDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <div className="container py-12">
                        <h1 className="text-3xl font-bold">Wishlist</h1>
                        <p className="text-muted-foreground mt-4">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* Host Routes */}
                <Route
                  path="/host/properties"
                  element={
                    <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
                      <HostPropertiesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/properties/:propertyId/edit"
                  element={
                    <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
                      <EditPropertyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/properties/create"
                  element={
                    <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
                      <CreatePropertyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/earnings"
                  element={
                    <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
                      <HostEarningsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/*"
                  element={
                    <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
                      <div className="container py-12">
                        <h1 className="text-3xl font-bold">Host Dashboard</h1>
                        <p className="text-muted-foreground mt-4">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <div className="container py-12">
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-4">Coming soon...</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* Public Routes */}
                <Route path="/search" element={<SearchPage />} />
                <Route path="/properties/:propertyId" element={<PropertyDetailsPage />} />
                <Route path="/become-host" element={<div className="container py-12"><h1 className="text-3xl font-bold">Become a Host</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
                <Route path="/help" element={<div className="container py-12"><h1 className="text-3xl font-bold">Help Center</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
                <Route path="/terms" element={<div className="container py-12"><h1 className="text-3xl font-bold">Terms of Service</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
                <Route path="/privacy" element={<div className="container py-12"><h1 className="text-3xl font-bold">Privacy Policy</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />

                {/* Host Routes */}
                <Route
                  path="/host/properties/:propertyId/availability"
                  element={
                    <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
                      <PropertyAvailabilityPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="*" element={<div className="container py-12 text-center"><h1 className="text-3xl font-bold">404 - Page Not Found</h1><p className="text-muted-foreground mt-4">The page you're looking for doesn't exist.</p></div>} />
              </Route>
            </Routes>
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
