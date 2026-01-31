'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';
import {
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  MapPin,
  Gauge,
  Mail,
  Phone,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DashboardStats {
  totalLoads: number;
  newLoads: number;
  acceptedLoads: number;
  deniedLoads: number;
  activeDrivers: number;
  totalMilesThisMonth: number;
}

interface RecentLoad {
  id: string;
  status: string;
  sourceType: string;
  senderName: string | null;
  senderCompany: string | null;
  subject: string | null;
  receivedAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLoads, setRecentLoads] = useState<RecentLoad[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDashboardData() {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
        setRecentLoads(data.data.recentLoads);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'New Loads',
      value: stats?.newLoads ?? 0,
      icon: Package,
      color: 'cyan',
      href: '/loads?status=NEW',
    },
    {
      title: 'Accepted (Month)',
      value: stats?.acceptedLoads ?? 0,
      icon: CheckCircle,
      color: 'green',
      href: '/loads?status=ACCEPTED',
    },
    {
      title: 'Denied (Month)',
      value: stats?.deniedLoads ?? 0,
      icon: XCircle,
      color: 'red',
      href: '/loads?status=DENIED',
    },
    {
      title: 'Active Drivers',
      value: stats?.activeDrivers ?? 0,
      icon: MapPin,
      color: 'blue',
      href: '/tracking',
    },
    {
      title: 'Miles (Month)',
      value: stats?.totalMilesThisMonth?.toFixed(0) ?? 0,
      icon: Gauge,
      color: 'purple',
      href: '/drivers',
    },
    {
      title: 'Total Loads',
      value: stats?.totalLoads ?? 0,
      icon: TrendingUp,
      color: 'amber',
      href: '/loads',
    },
  ];

  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/25',
    green: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
    red: 'from-red-500 to-red-600 shadow-red-500/25',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/25',
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case 'NEW':
        return <Badge variant="new">New</Badge>;
      case 'ACCEPTED':
        return <Badge variant="accepted">Accepted</Badge>;
      case 'DENIED':
        return <Badge variant="denied">Denied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function getSourceIcon(sourceType: string) {
    switch (sourceType) {
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-cyan-400" />;
      case 'PHONE':
        return <Phone className="w-4 h-4 text-blue-400" />;
      default:
        return <Package className="w-4 h-4 text-gray-400" />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">Overview of your logistics operations</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDashboardData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:border-gray-700 transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[stat.color]} shadow-lg flex items-center justify-center`}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.title}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Loads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Load Offers</CardTitle>
              <CardDescription>Latest incoming load offers</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/loads">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLoads.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No load offers yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  Set up email forwarding to start receiving loads
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLoads.map((load) => (
                  <Link
                    key={load.id}
                    href={`/loads/${load.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      {getSourceIcon(load.sourceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {load.subject || load.senderCompany || load.senderName || 'Untitled'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {load.senderName || 'Unknown'} • {formatRelativeTime(load.receivedAt)}
                      </p>
                    </div>
                    {getStatusBadge(load.status)}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/loads?status=NEW"
              className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Review New Loads</p>
                <p className="text-xs text-gray-500">
                  {stats?.newLoads || 0} loads waiting for review
                </p>
              </div>
            </Link>

            <Link
              href="/tracking"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Track Drivers</p>
                <p className="text-xs text-gray-500">
                  {stats?.activeDrivers || 0} drivers currently active
                </p>
              </div>
            </Link>

            <Link
              href="/drivers"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Gauge className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Export Mileage</p>
                <p className="text-xs text-gray-500">
                  Download mileage reports for taxes
                </p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Setup Integrations</p>
                <p className="text-xs text-gray-500">
                  Configure email and phone ingestion
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
