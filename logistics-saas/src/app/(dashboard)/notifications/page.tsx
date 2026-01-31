'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  MapPin,
  Truck,
  Users,
  Settings,
  Check,
  Trash2,
  Filter,
  RefreshCw,
} from 'lucide-react';

type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'SYSTEM';
type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
type NotificationType = 'LOAD_NEW' | 'LOAD_ACCEPTED' | 'LOAD_DENIED' | 'DRIVER_GPS' | 'SYSTEM' | 'ALERT';

interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  metadata?: {
    loadId?: string;
    driverId?: string;
    origin?: string;
    destination?: string;
    rate?: string;
  };
  createdAt: string;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'LOAD_NEW',
    channel: 'EMAIL',
    title: 'New Load Offer',
    message: 'CH Robinson sent a new load offer: Chicago, IL to Dallas, TX - $2,450',
    status: 'UNREAD',
    metadata: { loadId: 'LD001', origin: 'Chicago, IL', destination: 'Dallas, TX', rate: '$2,450' },
    createdAt: '2026-01-31T10:30:00Z',
  },
  {
    id: '2',
    type: 'LOAD_NEW',
    channel: 'SMS',
    title: 'Phone Load Offer',
    message: 'AI Receptionist captured a new load from caller (555) 123-4567',
    status: 'UNREAD',
    metadata: { loadId: 'LD002' },
    createdAt: '2026-01-31T09:45:00Z',
  },
  {
    id: '3',
    type: 'DRIVER_GPS',
    channel: 'SYSTEM',
    title: 'Driver Started Tracking',
    message: 'Mike Johnson enabled GPS tracking for today\'s route',
    status: 'READ',
    metadata: { driverId: 'DR001' },
    createdAt: '2026-01-31T08:00:00Z',
  },
  {
    id: '4',
    type: 'LOAD_ACCEPTED',
    channel: 'SYSTEM',
    title: 'Load Accepted',
    message: 'You accepted load from TQL - Auto-reply sent to broker',
    status: 'READ',
    metadata: { loadId: 'LD003' },
    createdAt: '2026-01-30T16:30:00Z',
  },
  {
    id: '5',
    type: 'ALERT',
    channel: 'SYSTEM',
    title: 'Integration Alert',
    message: 'Email forwarding verification required - action needed',
    status: 'UNREAD',
    createdAt: '2026-01-30T14:00:00Z',
  },
  {
    id: '6',
    type: 'LOAD_DENIED',
    channel: 'SYSTEM',
    title: 'Load Denied',
    message: 'Load from Landstar was declined - Low rate notification sent',
    status: 'READ',
    metadata: { loadId: 'LD004' },
    createdAt: '2026-01-30T11:15:00Z',
  },
  {
    id: '7',
    type: 'SYSTEM',
    channel: 'SYSTEM',
    title: 'New Team Member',
    message: 'Sarah Johnson joined your team as Dispatcher',
    status: 'READ',
    createdAt: '2026-01-29T09:00:00Z',
  },
  {
    id: '8',
    type: 'DRIVER_GPS',
    channel: 'SYSTEM',
    title: 'Driver Completed Route',
    message: 'Tom Brown completed tracking - 347 miles logged',
    status: 'READ',
    metadata: { driverId: 'DR002' },
    createdAt: '2026-01-28T18:30:00Z',
  },
];

const typeIcons: Record<NotificationType, React.ReactNode> = {
  LOAD_NEW: <Package className="w-5 h-5 text-cyan-400" />,
  LOAD_ACCEPTED: <CheckCircle2 className="w-5 h-5 text-green-400" />,
  LOAD_DENIED: <XCircle className="w-5 h-5 text-red-400" />,
  DRIVER_GPS: <MapPin className="w-5 h-5 text-blue-400" />,
  SYSTEM: <Settings className="w-5 h-5 text-gray-400" />,
  ALERT: <AlertTriangle className="w-5 h-5 text-amber-400" />,
};

const channelIcons: Record<NotificationChannel, React.ReactNode> = {
  EMAIL: <Mail className="w-4 h-4" />,
  SMS: <Phone className="w-4 h-4" />,
  PUSH: <Bell className="w-4 h-4" />,
  SYSTEM: <Settings className="w-4 h-4" />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'unread' && n.status === 'UNREAD') ||
      (activeTab === 'archived' && n.status === 'ARCHIVED');
    const matchesType = typeFilter === 'all' || n.type === typeFilter;
    return matchesTab && matchesType && n.status !== 'ARCHIVED';
  });

  const archivedNotifications = notifications.filter((n) => n.status === 'ARCHIVED');

  // Stats
  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;
  const todayCount = notifications.filter((n) => {
    const created = new Date(n.createdAt);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  }).length;

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function markAsRead(id: string) {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, status: 'READ' as NotificationStatus } : n))
    );
  }

  function markAllAsRead() {
    setNotifications(
      notifications.map((n) => ({ ...n, status: n.status === 'UNREAD' ? 'READ' as NotificationStatus : n.status }))
    );
  }

  function archiveNotification(id: string) {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, status: 'ARCHIVED' as NotificationStatus } : n))
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                {unreadCount} new
              </Badge>
            )}
          </h1>
          <p className="text-gray-400">Stay updated on loads, drivers, and system events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{unreadCount}</p>
                <p className="text-xs text-gray-500">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{todayCount}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {notifications.filter((n) => n.type.startsWith('LOAD_')).length}
                </p>
                <p className="text-xs text-gray-500">Load Updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {notifications.filter((n) => n.type === 'ALERT' && n.status === 'UNREAD').length}
                </p>
                <p className="text-xs text-gray-500">Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {notifications.filter((n) => n.status !== 'ARCHIVED').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived
              <Badge variant="secondary" className="ml-2">
                {archivedNotifications.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="LOAD_NEW">New Loads</SelectItem>
                <SelectItem value="LOAD_ACCEPTED">Accepted</SelectItem>
                <SelectItem value="LOAD_DENIED">Denied</SelectItem>
                <SelectItem value="DRIVER_GPS">GPS Updates</SelectItem>
                <SelectItem value="ALERT">Alerts</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-0">
          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
            onArchive={archiveNotification}
            formatTime={formatTime}
            typeIcons={typeIcons}
            channelIcons={channelIcons}
          />
        </TabsContent>

        <TabsContent value="unread" className="space-y-0">
          <NotificationList
            notifications={filteredNotifications.filter((n) => n.status === 'UNREAD')}
            onMarkAsRead={markAsRead}
            onArchive={archiveNotification}
            formatTime={formatTime}
            typeIcons={typeIcons}
            channelIcons={channelIcons}
          />
        </TabsContent>

        <TabsContent value="archived" className="space-y-0">
          <NotificationList
            notifications={archivedNotifications}
            onMarkAsRead={markAsRead}
            onArchive={archiveNotification}
            formatTime={formatTime}
            typeIcons={typeIcons}
            channelIcons={channelIcons}
            isArchived
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  formatTime: (date: string) => string;
  typeIcons: Record<NotificationType, React.ReactNode>;
  channelIcons: Record<NotificationChannel, React.ReactNode>;
  isArchived?: boolean;
}

function NotificationList({
  notifications,
  onMarkAsRead,
  onArchive,
  formatTime,
  typeIcons,
  channelIcons,
  isArchived = false,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {isArchived ? 'No archived notifications' : 'No notifications to show'}
          </p>
          <p className="text-sm text-gray-500">
            {isArchived
              ? 'Archived items will appear here'
              : 'New activity will appear here'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-800">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex items-start gap-4 hover:bg-gray-800/50 transition-colors ${
                notification.status === 'UNREAD' ? 'bg-cyan-500/5' : ''
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                {typeIcons[notification.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{notification.title}</p>
                      {notification.status === 'UNREAD' && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 flex-shrink-0">
                    {channelIcons[notification.channel]}
                    <span className="text-xs">{formatTime(notification.createdAt)}</span>
                  </div>
                </div>

                {/* Metadata */}
                {notification.metadata && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {notification.metadata.origin && notification.metadata.destination && (
                      <Badge variant="secondary" className="text-xs">
                        <Truck className="w-3 h-3 mr-1" />
                        {notification.metadata.origin} → {notification.metadata.destination}
                      </Badge>
                    )}
                    {notification.metadata.rate && (
                      <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                        {notification.metadata.rate}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {notification.status === 'UNREAD' && !isArchived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark as Read
                    </Button>
                  )}
                  {!isArchived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(notification.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Archive
                    </Button>
                  )}
                  {notification.metadata?.loadId && (
                    <Button variant="ghost" size="sm">
                      View Load
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
