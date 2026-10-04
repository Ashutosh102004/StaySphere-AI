import { useState } from 'react';
import { Trash2, Edit2, Shield, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'GUEST' | 'HOST' | 'SUPPORT' | 'ADMIN';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verified: boolean;
  emailVerified: boolean;
  createdAt: string;
}

const MOCK_USERS: User[] = [
  {
    _id: '1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'HOST',
    verified: true,
    emailVerified: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: '2',
    email: 'sarah@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'GUEST',
    verified: false,
    emailVerified: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    _id: '3',
    email: 'mike@support.com',
    firstName: 'Mike',
    lastName: 'Chen',
    role: 'SUPPORT',
    verified: true,
    emailVerified: true,
    createdAt: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    _id: '4',
    email: 'admin@staysphere.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    verified: true,
    emailVerified: true,
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
  },
  {
    _id: '5',
    email: 'emma@example.com',
    firstName: 'Emma',
    lastName: 'Wilson',
    role: 'HOST',
    verified: true,
    emailVerified: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const getRoleColor = (role: UserRole) => {
  const colors = {
    GUEST: 'bg-blue-100 text-blue-800',
    HOST: 'bg-green-100 text-green-800',
    SUPPORT: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-red-100 text-red-800',
  };
  return colors[role];
};

export function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [filterRole, setFilterRole] = useState<UserRole | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('GUEST');

  const filteredUsers = users.filter((user) => {
    const matchRole = filterRole === 'ALL' || user.role === filterRole;
    const matchSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const handleEditRole = (user: User) => {
    setEditingUser(user);
    setNewRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (!editingUser) return;

    setUsers((prev) =>
      prev.map((u) =>
        u._id === editingUser._id ? { ...u, role: newRole } : u
      )
    );

    toast({ title: 'Success', description: `User role updated to ${newRole}` });
    setIsEditDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      toast({ title: 'Success', description: 'User deleted successfully' });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const roleCounts = {
    GUEST: users.filter((u) => u.role === 'GUEST').length,
    HOST: users.filter((u) => u.role === 'HOST').length,
    SUPPORT: users.filter((u) => u.role === 'SUPPORT').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">Manage users and their roles</p>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Guests</p>
              <p className="text-3xl font-bold">{roleCounts.GUEST}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Hosts</p>
              <p className="text-3xl font-bold text-green-600">{roleCounts.HOST}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Support</p>
              <p className="text-3xl font-bold text-purple-600">{roleCounts.SUPPORT}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Admins</p>
              <p className="text-3xl font-bold text-red-600">{roleCounts.ADMIN}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm mb-2 block">Search</Label>
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Role</Label>
              <Select value={filterRole} onValueChange={(val) => setFilterRole(val as UserRole | 'ALL')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="GUEST">Guest</SelectItem>
                  <SelectItem value="HOST">Host</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Export Users
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredUsers.length} users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Joined</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {user.verified && (
                          <Badge variant="outline" className="bg-green-50">
                            Verified
                          </Badge>
                        )}
                        {user.emailVerified && (
                          <Badge variant="outline" className="bg-blue-50">
                            Email OK
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Dialog open={isEditDialogOpen && editingUser?._id === user._id} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditRole(user)}
                              className="gap-2"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User Role</DialogTitle>
                              <DialogDescription>
                                Change the role for {editingUser?.firstName} {editingUser?.lastName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="role">Role</Label>
                                <Select value={newRole} onValueChange={(val) => setNewRole(val as UserRole)}>
                                  <SelectTrigger id="role" className="mt-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="GUEST">Guest</SelectItem>
                                    <SelectItem value="HOST">Host</SelectItem>
                                    <SelectItem value="SUPPORT">Support</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <Button onClick={handleSaveRole} className="w-full">
                                Save Role
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id)}
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
