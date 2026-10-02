import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground mt-2">Manage your account and bookings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email Verified</p>
              <p className="font-medium">{user?.emailVerified ? 'Yes' : 'No'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You have no upcoming trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wishlist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Your wishlist is empty</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
