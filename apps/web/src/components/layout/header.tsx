import { Link } from 'react-router-dom';
import { Home, User, Heart, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth-context-value';

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

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

          {isAuthenticated ? (
            <>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/bookings">My Trips</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist">Wishlist</Link>
                  </DropdownMenuItem>
                  {(user?.role === 'HOST' || user?.role === 'ADMIN') && (
                    <DropdownMenuItem asChild>
                      <Link to="/host">Host Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/login">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
