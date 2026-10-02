import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              Find your next place to stay
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover unique vacation rentals powered by AI assistance
            </p>

            {/* Search Bar */}
            <Card className="mt-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Destination
                    </label>
                    <Input placeholder="Where are you going?" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Check-in
                    </label>
                    <Input type="date" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Check-out
                    </label>
                    <Input type="date" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Guests
                    </label>
                    <Input type="number" placeholder="2" min="1" />
                  </div>
                </div>

                <Button className="w-full mt-6" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 container">
        <h2 className="text-3xl font-bold text-center mb-12">Why choose StaySphere AI?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-primary mb-4">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-muted-foreground">
                Find the perfect property with our intelligent search powered by AI
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-primary mb-4">
                <Users className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 AI Support</h3>
              <p className="text-muted-foreground">
                Get instant help with bookings, payments, and inquiries anytime
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-primary mb-4">
                <MapPin className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Properties</h3>
              <p className="text-muted-foreground">
                All properties are verified with secure identity verification
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl font-bold">Become a Host</h2>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            Share your space and earn extra income while meeting travelers from around the world
          </p>
          <Button variant="secondary" size="lg">
            Learn More
          </Button>
        </div>
      </section>
    </div>
  );
}
