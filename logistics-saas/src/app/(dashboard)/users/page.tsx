'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Clock,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  Send,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type UserRole = 'OWNER' | 'ADMIN' | 'DISPATCHER' | 'DRIVER';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  avatarUrl?: string;
}

// Mock data - replace with API call
const mockUsers: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@acmetrucking.com',
    role: 'OWNER',
    isActive: true,
    lastLoginAt: '2026-01-31T10:30:00Z',
    createdAt: '2025-06-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@acmetrucking.com',
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: '2026-01-30T15:45:00Z',
    createdAt: '2025-08-20T00:00:00Z',
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike@acmetrucking.com',
    role: 'DISPATCHER',
    isActive: true,
    lastLoginAt: '2026-01-31T08:00:00Z',
    createdAt: '2025-09-10T00:00:00Z',
  },
  {
    id: '4',
    name: 'Emily Wilson',
    email: 'emily@acmetrucking.com',
    role: 'DISPATCHER',
    isActive: true,
    lastLoginAt: '2026-01-29T12:00:00Z',
    createdAt: '2025-10-05T00:00:00Z',
  },
  {
    id: '5',
    name: 'Tom Brown',
    email: 'tom@acmetrucking.com',
    role: 'DRIVER',
    isActive: false,
    lastLoginAt: '2026-01-15T09:00:00Z',
    createdAt: '2025-11-01T00:00:00Z',
  },
];

const roleColors: Record<UserRole, string> = {
  OWNER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  DISPATCHER: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  DRIVER: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const roleDescriptions: Record<UserRole, string> = {
  OWNER: 'Full access to all features and billing',
  ADMIN: 'Can manage users, drivers, and settings',
  DISPATCHER: 'Can manage loads and communicate with drivers',
  DRIVER: 'Can view assigned loads and update GPS',
};

export default function UsersPage() {
  const [users, setUsers] = useState<TeamMember[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('DISPATCHER');
  const [inviteName, setInviteName] = useState('');

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === 'OWNER' || u.role === 'ADMIN').length,
    recentlyActive: users.filter((u) => {
      if (!u.lastLoginAt) return false;
      const lastLogin = new Date(u.lastLoginAt);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastLogin > dayAgo;
    }).length,
  };

  function formatLastLogin(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  function handleInviteUser() {
    // In production, this would call the API
    const newUser: TeamMember = {
      id: String(Date.now()),
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };
    setUsers([...users, newUser]);
    setIsInviteOpen(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('DISPATCHER');
  }

  function handleToggleStatus(userId: string) {
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
  }

  function handleDeleteUser(userId: string) {
    setUsers(users.filter((u) => u.id !== userId));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="text-gray-400">Manage your team and their access levels</p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new team member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="inviteName">Name</Label>
                <Input
                  id="inviteName"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="john@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteRole">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                    <SelectItem value="DRIVER">Driver</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{roleDescriptions[inviteRole]}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleInviteUser} disabled={!inviteEmail}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.admins}</p>
                <p className="text-xs text-gray-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.recentlyActive}</p>
                <p className="text-xs text-gray-500">Active Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="OWNER">Owner</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="DISPATCHER">Dispatcher</SelectItem>
                <SelectItem value="DRIVER">Driver</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Click on a user to view details or use the menu for actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  user.isActive
                    ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    : 'bg-gray-900/50 border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium text-lg">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    {user.isActive && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{user.name}</p>
                      <span className={`px-2 py-0.5 rounded text-xs border ${roleColors[user.role]}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-400">
                      {user.isActive ? 'Last active' : 'Deactivated'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatLastLogin(user.lastLoginAt)}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleStatus(user.id)}>
                        {user.isActive ? (
                          <>
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      {user.role !== 'OWNER' && (
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
                <p className="text-sm text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roles Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Permissions</CardTitle>
          <CardDescription>Understanding access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(roleDescriptions) as [UserRole, string][]).map(([role, desc]) => (
              <div key={role} className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs border ${roleColors[role]}`}>
                    {role}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
