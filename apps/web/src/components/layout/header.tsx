import { Link } from 'react-router-dom';
import { Home, User, Heart, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <Home className="h-6 w-6" />
            <span className="text-xl font-bold">StaySphere AI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/search" className="text-sm font-medium transition-colors hover:text-primary">
              Search
            </Link>
            <Link to="/become-host" className="text-sm font-medium transition-colors hover:text-primary">
              Become a Host
            </Link>
            <Link to="/help" className="text-sm font-medium transition-colors hover:text-primary">
              Help
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/wishlist">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link to="/bookings">
                <Calendar className="h-4 w-4 mr-2" />
                Trips
              </Link>
            </Button>
          </div>

          <Button variant="default" size="sm" asChild>
            <Link to="/login">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
