import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { RootLayout } from '@/components/layout/root-layout';
import { HomePage } from '@/pages/home';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';

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
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Placeholder routes */}
              <Route path="/search" element={<div className="container py-12"><h1 className="text-3xl font-bold">Search Page</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
              <Route path="/wishlist" element={<div className="container py-12"><h1 className="text-3xl font-bold">Wishlist</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
              <Route path="/bookings" element={<div className="container py-12"><h1 className="text-3xl font-bold">My Trips</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
              <Route path="/become-host" element={<div className="container py-12"><h1 className="text-3xl font-bold">Become a Host</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
              <Route path="/help" element={<div className="container py-12"><h1 className="text-3xl font-bold">Help Center</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
              <Route path="/terms" element={<div className="container py-12"><h1 className="text-3xl font-bold">Terms of Service</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />
              <Route path="/privacy" element={<div className="container py-12"><h1 className="text-3xl font-bold">Privacy Policy</h1><p className="text-muted-foreground mt-4">Coming soon...</p></div>} />

              {/* 404 */}
              <Route path="*" element={<div className="container py-12 text-center"><h1 className="text-3xl font-bold">404 - Page Not Found</h1><p className="text-muted-foreground mt-4">The page you're looking for doesn't exist.</p></div>} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
