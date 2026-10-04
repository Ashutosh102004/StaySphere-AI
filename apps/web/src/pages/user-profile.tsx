import { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Bell, Eye, Lock, LogOut, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinDate: string;
  role: 'GUEST' | 'HOST' | 'SUPPORT' | 'ADMIN';
  verified: boolean;
  emailVerified: boolean;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingUpdates: boolean;
  newMessages: boolean;
  promotions: boolean;
  reviews: boolean;
}

const MOCK_USER: UserProfile = {
  _id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  bio: 'Travel enthusiast and property investor',
  location: 'New York, NY',
  joinDate: new Date(Date.now() - 31536000000).toISOString(),
  role: 'HOST',
  verified: true,
  emailVerified: true,
};

const MOCK_NOTIFICATIONS: NotificationPreferences = {
  emailNotifications: true,
  smsNotifications: false,
  bookingUpdates: true,
  newMessages: true,
  promotions: false,
  reviews: true,
};

export function UserProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [notifications, setNotifications] = useState<NotificationPreferences>(MOCK_NOTIFICATIONS);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState(user);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleEditProfile = () => {
    setEditFormData(user);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!editFormData.firstName || !editFormData.lastName || !editFormData.email) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setUser(editFormData);
    setIsEditingProfile(false);
    toast({ title: 'Success', description: 'Profile updated successfully' });
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangePasswordOpen(false);
    toast({ title: 'Success', description: 'Password changed successfully' });
  };

  const handleNotificationChange = (key: keyof NotificationPreferences, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
    toast({ title: 'Success', description: 'Notification preferences updated' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleColor = (role: string) => {
    const colors = {
      GUEST: 'bg-blue-100 text-blue-800',
      HOST: 'bg-green-100 text-green-800',
      SUPPORT: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-red-100 text-red-800',
    };
    return colors[role as keyof typeof colors];
  };

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {!isEditingProfile && (
              <Button variant="outline" size="sm" onClick={handleEditProfile} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    className="w-full min-h-24 p-2 border rounded-md text-sm"
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveProfile} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </p>
                    <p className="text-lg font-semibold mt-1">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </p>
                    <p className="text-lg font-semibold mt-1">{user.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </p>
                    <p className="text-lg font-semibold mt-1">{user.phone || 'Not provided'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </p>
                    <p className="text-lg font-semibold mt-1">{user.location || 'Not provided'}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bio</p>
                  <p className="text-base">{user.bio || 'No bio added'}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </p>
                    <p className="text-sm font-semibold mt-1">{formatDate(user.joinDate)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Role
                    </p>
                    <Badge className={getRoleColor(user.role)} className="mt-1">
                      {user.role}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Verification
                    </p>
                    <div className="flex gap-2 mt-1">
                      {user.emailVerified && <Badge variant="outline" className="bg-green-50">Email ✓</Badge>}
                      {user.verified && <Badge variant="outline" className="bg-green-50">ID ✓</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>Enter your current password and choose a new one</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <Button onClick={handleChangePassword} className="w-full">
                    Change Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Separator />

            <div>
              <p className="font-medium mb-2">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security to your account</p>
              <Button variant="outline" disabled>
                Enable 2FA (Coming Soon)
              </Button>
            </div>

            <Separator />

            <div>
              <p className="font-medium mb-2">Active Sessions</p>
              <p className="text-sm text-muted-foreground mb-3">You are currently logged in on this device</p>
              <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4" />
                Logout All Other Sessions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(value) => handleNotificationChange('emailNotifications', value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via text message</p>
              </div>
              <Switch
                checked={notifications.smsNotifications}
                onCheckedChange={(value) => handleNotificationChange('smsNotifications', value)}
              />
            </div>

            <Separator />

            <p className="font-medium">Notification Types</p>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Booking Updates</p>
                <p className="text-xs text-muted-foreground">New bookings, confirmations, cancellations</p>
              </div>
              <Switch
                checked={notifications.bookingUpdates}
                onCheckedChange={(value) => handleNotificationChange('bookingUpdates', value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">New Messages</p>
                <p className="text-xs text-muted-foreground">Messages from guests and support</p>
              </div>
              <Switch
                checked={notifications.newMessages}
                onCheckedChange={(value) => handleNotificationChange('newMessages', value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Reviews & Ratings</p>
                <p className="text-xs text-muted-foreground">When guests leave reviews</p>
              </div>
              <Switch
                checked={notifications.reviews}
                onCheckedChange={(value) => handleNotificationChange('reviews', value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Promotions & Offers</p>
                <p className="text-xs text-muted-foreground">Special deals and promotions</p>
              </div>
              <Switch
                checked={notifications.promotions}
                onCheckedChange={(value) => handleNotificationChange('promotions', value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-100">
              Download My Data
            </Button>
            <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-100">
              Deactivate Account
            </Button>
            <Button variant="destructive" className="w-full gap-2">
              <LogOut className="h-4 w-4" />
              Delete Account Permanently
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
