'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ScrollText,
  Search,
  Download,
  Filter,
  User,
  LogIn,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Settings,
  UserPlus,
  UserMinus,
  Key,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOAD_ACCEPTED'
  | 'LOAD_DENIED'
  | 'DRIVER_ADDED'
  | 'DRIVER_REMOVED'
  | 'GPS_ENABLED'
  | 'GPS_DISABLED'
  | 'USER_INVITED'
  | 'USER_REMOVED'
  | 'SETTINGS_UPDATED'
  | 'INTEGRATION_ADDED'
  | 'INTEGRATION_REMOVED'
  | 'EXPORT_GENERATED';

interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userEmail: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'LOGIN',
    userId: 'U001',
    userName: 'John Smith',
    userEmail: 'john@acmetrucking.com',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120 / Windows',
    createdAt: '2026-01-31T10:30:00Z',
  },
  {
    id: '2',
    action: 'LOAD_ACCEPTED',
    userId: 'U001',
    userName: 'John Smith',
    userEmail: 'john@acmetrucking.com',
    entityType: 'LoadOffer',
    entityId: 'LD001',
    entityName: 'Chicago to Dallas - $2,450',
    metadata: { broker: 'CH Robinson', rate: 2450 },
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120 / Windows',
    createdAt: '2026-01-31T10:25:00Z',
  },
  {
    id: '3',
    action: 'GPS_ENABLED',
    userId: 'U003',
    userName: 'Mike Davis',
    userEmail: 'mike@acmetrucking.com',
    entityType: 'Driver',
    entityId: 'DR001',
    entityName: 'Mike Davis',
    ipAddress: '10.0.0.55',
    userAgent: 'Mobile Safari / iOS 18',
    createdAt: '2026-01-31T08:00:00Z',
  },
  {
    id: '4',
    action: 'USER_INVITED',
    userId: 'U001',
    userName: 'John Smith',
    userEmail: 'john@acmetrucking.com',
    entityType: 'User',
    entityId: 'U005',
    entityName: 'Emily Wilson',
    metadata: { role: 'DISPATCHER', email: 'emily@acmetrucking.com' },
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120 / Windows',
    createdAt: '2026-01-30T15:30:00Z',
  },
  {
    id: '5',
    action: 'LOAD_DENIED',
    userId: 'U002',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@acmetrucking.com',
    entityType: 'LoadOffer',
    entityId: 'LD002',
    entityName: 'Atlanta to Miami - $1,200',
    metadata: { broker: 'Landstar', rate: 1200, reason: 'Rate too low' },
    ipAddress: '192.168.1.101',
    userAgent: 'Firefox 121 / macOS',
    createdAt: '2026-01-30T14:15:00Z',
  },
  {
    id: '6',
    action: 'SETTINGS_UPDATED',
    userId: 'U001',
    userName: 'John Smith',
    userEmail: 'john@acmetrucking.com',
    entityType: 'Settings',
    metadata: { section: 'Company Info', changes: ['phone', 'address'] },
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120 / Windows',
    createdAt: '2026-01-30T11:00:00Z',
  },
  {
    id: '7',
    action: 'DRIVER_ADDED',
    userId: 'U002',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@acmetrucking.com',
    entityType: 'Driver',
    entityId: 'DR003',
    entityName: 'Tom Brown',
    metadata: { phone: '555-123-4567', truckId: 'TRK-003' },
    ipAddress: '192.168.1.101',
    userAgent: 'Firefox 121 / macOS',
    createdAt: '2026-01-29T16:45:00Z',
  },
  {
    id: '8',
    action: 'EXPORT_GENERATED',
    userId: 'U001',
    userName: 'John Smith',
    userEmail: 'john@acmetrucking.com',
    entityType: 'Export',
    metadata: { type: 'mileage', format: 'csv', dateRange: 'January 2026' },
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120 / Windows',
    createdAt: '2026-01-29T10:00:00Z',
  },
  {
    id: '9',
    action: 'INTEGRATION_ADDED',
    userId: 'U001',
    userName: 'John Smith',
    userEmail: 'john@acmetrucking.com',
    entityType: 'Integration',
    entityName: 'SendGrid Email',
    metadata: { provider: 'SENDGRID' },
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome 120 / Windows',
    createdAt: '2026-01-28T09:30:00Z',
  },
  {
    id: '10',
    action: 'GPS_DISABLED',
    userId: 'U003',
    userName: 'Mike Davis',
    userEmail: 'mike@acmetrucking.com',
    entityType: 'Driver',
    entityId: 'DR001',
    entityName: 'Mike Davis',
    metadata: { totalMiles: 347, duration: '8h 30m' },
    ipAddress: '10.0.0.55',
    userAgent: 'Mobile Safari / iOS 18',
    createdAt: '2026-01-28T18:30:00Z',
  },
];

const actionConfig: Record<
  AuditAction,
  { label: string; icon: React.ReactNode; color: string }
> = {
  LOGIN: { label: 'Login', icon: <LogIn className="w-4 h-4" />, color: 'text-blue-400' },
  LOGOUT: { label: 'Logout', icon: <LogIn className="w-4 h-4 rotate-180" />, color: 'text-gray-400' },
  LOAD_ACCEPTED: { label: 'Load Accepted', icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-400' },
  LOAD_DENIED: { label: 'Load Denied', icon: <XCircle className="w-4 h-4" />, color: 'text-red-400' },
  DRIVER_ADDED: { label: 'Driver Added', icon: <Truck className="w-4 h-4" />, color: 'text-cyan-400' },
  DRIVER_REMOVED: { label: 'Driver Removed', icon: <Truck className="w-4 h-4" />, color: 'text-red-400' },
  GPS_ENABLED: { label: 'GPS Enabled', icon: <MapPin className="w-4 h-4" />, color: 'text-green-400' },
  GPS_DISABLED: { label: 'GPS Disabled', icon: <MapPin className="w-4 h-4" />, color: 'text-amber-400' },
  USER_INVITED: { label: 'User Invited', icon: <UserPlus className="w-4 h-4" />, color: 'text-cyan-400' },
  USER_REMOVED: { label: 'User Removed', icon: <UserMinus className="w-4 h-4" />, color: 'text-red-400' },
  SETTINGS_UPDATED: { label: 'Settings Updated', icon: <Settings className="w-4 h-4" />, color: 'text-purple-400' },
  INTEGRATION_ADDED: { label: 'Integration Added', icon: <Key className="w-4 h-4" />, color: 'text-cyan-400' },
  INTEGRATION_REMOVED: { label: 'Integration Removed', icon: <Key className="w-4 h-4" />, color: 'text-red-400' },
  EXPORT_GENERATED: { label: 'Export Generated', icon: <Download className="w-4 h-4" />, color: 'text-blue-400' },
};

export default function AuditLogsPage() {
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(logs.map((l) => l.userId))).map((id) => {
    const log = logs.find((l) => l.userId === id)!;
    return { id, name: log.userName, email: log.userEmail };
  });

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesUser = userFilter === 'all' || log.userId === userFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.createdAt);
      const now = new Date();
      const daysAgo = dateFilter === '24h' ? 1 : dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
      const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      matchesDate = logDate > cutoff;
    }

    return matchesSearch && matchesAction && matchesUser && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / perPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Stats
  const todayLogs = logs.filter((l) => {
    const logDate = new Date(l.createdAt);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });

  function formatDateTime(dateStr: string): { date: string; time: string } {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  }

  function handleExport() {
    // In production, this would generate and download a CSV
    const csv = [
      ['Timestamp', 'Action', 'User', 'Email', 'Entity', 'IP Address', 'User Agent'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.createdAt,
          log.action,
          log.userName,
          log.userEmail,
          log.entityName || '-',
          log.ipAddress,
          log.userAgent,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400">Track all activities and changes in your organization</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                <ScrollText className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{logs.length}</p>
                <p className="text-xs text-gray-500">Total Events</p>
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
                <p className="text-2xl font-bold text-white">{todayLogs.length}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter((l) => l.action === 'LOAD_ACCEPTED').length}
                </p>
                <p className="text-xs text-gray-500">Loads Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{uniqueUsers.length}</p>
                <p className="text-xs text-gray-500">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by user, email, or entity..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOAD_ACCEPTED">Load Accepted</SelectItem>
                  <SelectItem value="LOAD_DENIED">Load Denied</SelectItem>
                  <SelectItem value="GPS_ENABLED">GPS Enabled</SelectItem>
                  <SelectItem value="GPS_DISABLED">GPS Disabled</SelectItem>
                  <SelectItem value="USER_INVITED">User Invited</SelectItem>
                  <SelectItem value="SETTINGS_UPDATED">Settings Updated</SelectItem>
                  <SelectItem value="EXPORT_GENERATED">Export Generated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[160px]">
                  <User className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Showing {paginatedLogs.length} of {filteredLogs.length} events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedLogs.length === 0 ? (
            <div className="text-center py-12">
              <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No audit logs found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedLogs.map((log) => {
                const config = actionConfig[log.action];
                const { date, time } = formatDateTime(log.createdAt);

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    {/* Action Icon */}
                    <div
                      className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center ${config.color}`}
                    >
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`${config.color} bg-gray-800`}
                            >
                              {config.label}
                            </Badge>
                            {log.entityName && (
                              <span className="text-sm text-gray-300">
                                {log.entityName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <span className="font-medium text-gray-400">{log.userName}</span>
                            <span>({log.userEmail})</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-gray-400">{date}</p>
                          <p className="text-xs text-gray-500">{time}</p>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                          {log.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                          {log.userAgent}
                        </span>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <Button variant="ghost" size="sm" className="h-5 px-2 text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <ScrollText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Audit Log Retention</h4>
              <p className="text-sm text-gray-400 mt-1">
                Audit logs are retained for 90 days on the Free plan. Upgrade to Professional for 1-year retention,
                or Enterprise for unlimited retention with SIEM integration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
