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
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Truck,
  MapPin,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Target,
} from 'lucide-react';

interface MetricCard {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

interface ChartBar {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

// Mock data for analytics
const overviewMetrics: MetricCard[] = [
  {
    label: 'Total Loads',
    value: '127',
    change: 12.5,
    changeLabel: 'vs last month',
    icon: <Package className="w-5 h-5 text-cyan-400" />,
    trend: 'up',
  },
  {
    label: 'Revenue',
    value: '$284,500',
    change: 8.3,
    changeLabel: 'vs last month',
    icon: <DollarSign className="w-5 h-5 text-green-400" />,
    trend: 'up',
  },
  {
    label: 'Acceptance Rate',
    value: '73%',
    change: -2.1,
    changeLabel: 'vs last month',
    icon: <Target className="w-5 h-5 text-amber-400" />,
    trend: 'down',
  },
  {
    label: 'Total Miles',
    value: '45,832',
    change: 15.7,
    changeLabel: 'vs last month',
    icon: <MapPin className="w-5 h-5 text-blue-400" />,
    trend: 'up',
  },
];

const sourceBreakdown: ChartBar[] = [
  { label: 'Email', value: 78, maxValue: 100, color: 'bg-cyan-500' },
  { label: 'Phone', value: 32, maxValue: 100, color: 'bg-blue-500' },
  { label: 'Manual', value: 12, maxValue: 100, color: 'bg-purple-500' },
  { label: 'API', value: 5, maxValue: 100, color: 'bg-amber-500' },
];

const statusBreakdown: ChartBar[] = [
  { label: 'Accepted', value: 93, maxValue: 127, color: 'bg-green-500' },
  { label: 'Denied', value: 24, maxValue: 127, color: 'bg-red-500' },
  { label: 'Pending', value: 7, maxValue: 127, color: 'bg-amber-500' },
  { label: 'Expired', value: 3, maxValue: 127, color: 'bg-gray-500' },
];

const weeklyLoads = [
  { day: 'Mon', loads: 18, revenue: 38500 },
  { day: 'Tue', loads: 22, revenue: 47200 },
  { day: 'Wed', loads: 15, revenue: 32100 },
  { day: 'Thu', loads: 28, revenue: 59800 },
  { day: 'Fri', loads: 31, revenue: 66400 },
  { day: 'Sat', loads: 8, revenue: 17100 },
  { day: 'Sun', loads: 5, revenue: 10700 },
];

const topBrokers = [
  { name: 'CH Robinson', loads: 34, revenue: 76500, acceptance: 85 },
  { name: 'TQL', loads: 28, revenue: 62300, acceptance: 71 },
  { name: 'Landstar', loads: 22, revenue: 48900, acceptance: 68 },
  { name: 'XPO Logistics', loads: 18, revenue: 40200, acceptance: 78 },
  { name: 'Echo Global', loads: 15, revenue: 33400, acceptance: 73 },
];

const driverStats = [
  { name: 'Mike Johnson', miles: 12450, loads: 32, efficiency: 94 },
  { name: 'Tom Brown', miles: 10890, loads: 28, efficiency: 91 },
  { name: 'James Wilson', miles: 9760, loads: 25, efficiency: 88 },
  { name: 'David Lee', miles: 8540, loads: 22, efficiency: 85 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const maxWeeklyLoads = Math.max(...weeklyLoads.map((d) => d.loads));
  const maxWeeklyRevenue = Math.max(...weeklyLoads.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400">Track performance and business metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="ytd">Year to date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                  {metric.icon}
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">{metric.value}</p>
                <p className="text-xs text-gray-500">{metric.changeLabel}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="loads">
            <Package className="w-4 h-4 mr-2" />
            Loads
          </TabsTrigger>
          <TabsTrigger value="drivers">
            <Truck className="w-4 h-4 mr-2" />
            Drivers
          </TabsTrigger>
          <TabsTrigger value="brokers">
            <DollarSign className="w-4 h-4 mr-2" />
            Brokers
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Loads Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Load Volume</CardTitle>
                <CardDescription>Number of loads by day this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-48 gap-2">
                  {weeklyLoads.map((day) => (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col justify-end h-40">
                        <div
                          className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all"
                          style={{ height: `${(day.loads / maxWeeklyLoads) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{day.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
                <CardDescription>Revenue generated by day this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-48 gap-2">
                  {weeklyLoads.map((day) => (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col justify-end h-40">
                        <div
                          className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all"
                          style={{ height: `${(day.revenue / maxWeeklyRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{day.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Load Source Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Load Sources</CardTitle>
                <CardDescription>Where your loads are coming from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sourceBreakdown.map((source) => (
                  <div key={source.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {source.label === 'Email' && <Mail className="w-4 h-4 text-cyan-400" />}
                        {source.label === 'Phone' && <Phone className="w-4 h-4 text-blue-400" />}
                        {source.label === 'Manual' && <Package className="w-4 h-4 text-purple-400" />}
                        {source.label === 'API' && <BarChart3 className="w-4 h-4 text-amber-400" />}
                        <span className="text-gray-300">{source.label}</span>
                      </div>
                      <span className="text-gray-400">{source.value} loads</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${source.color} rounded-full transition-all`}
                        style={{ width: `${(source.value / source.maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Load Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Load Status</CardTitle>
                <CardDescription>Current status of all loads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statusBreakdown.map((status) => (
                  <div key={status.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {status.label === 'Accepted' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {status.label === 'Denied' && <XCircle className="w-4 h-4 text-red-400" />}
                        {status.label === 'Pending' && <Clock className="w-4 h-4 text-amber-400" />}
                        {status.label === 'Expired' && <Clock className="w-4 h-4 text-gray-400" />}
                        <span className="text-gray-300">{status.label}</span>
                      </div>
                      <span className="text-gray-400">{status.value} loads</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${status.color} rounded-full transition-all`}
                        style={{ width: `${(status.value / status.maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Loads Tab */}
        <TabsContent value="loads" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-4xl font-bold text-white">93</p>
                <p className="text-gray-400 mt-1">Accepted Loads</p>
                <p className="text-sm text-green-400 mt-2">73% acceptance rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-4xl font-bold text-white">24</p>
                <p className="text-gray-400 mt-1">Denied Loads</p>
                <p className="text-sm text-red-400 mt-2">19% denial rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-4xl font-bold text-white">10</p>
                <p className="text-gray-400 mt-1">Pending / Expired</p>
                <p className="text-sm text-amber-400 mt-2">8% unresolved</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Analysis</CardTitle>
              <CardDescription>Average time to accept or deny load offers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg bg-gray-800/50">
                  <p className="text-3xl font-bold text-cyan-400">2.4h</p>
                  <p className="text-sm text-gray-400 mt-1">Avg Response Time</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-800/50">
                  <p className="text-3xl font-bold text-green-400">1.2h</p>
                  <p className="text-sm text-gray-400 mt-1">Fastest Response</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-800/50">
                  <p className="text-3xl font-bold text-amber-400">8.5h</p>
                  <p className="text-sm text-gray-400 mt-1">Slowest Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Driver Performance</CardTitle>
              <CardDescription>Miles, loads, and efficiency metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {driverStats.map((driver, index) => (
                  <div
                    key={driver.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{driver.name}</p>
                        <p className="text-sm text-gray-500">{driver.loads} loads completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="font-medium text-white">{driver.miles.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">miles</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            driver.efficiency >= 90
                              ? 'bg-green-500/20 text-green-400'
                              : driver.efficiency >= 80
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }
                        >
                          {driver.efficiency}% efficient
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Miles Logged</CardTitle>
                <CardDescription>GPS-tracked mileage this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-5xl font-bold text-white">45,832</p>
                  <p className="text-gray-400 mt-2">miles tracked</p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+15.7% from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Miles per Load</CardTitle>
                <CardDescription>Efficiency metric</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-5xl font-bold text-white">361</p>
                  <p className="text-gray-400 mt-2">miles per load</p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-amber-400">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm">-3.2% from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Brokers Tab */}
        <TabsContent value="brokers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Brokers</CardTitle>
              <CardDescription>Performance by broker relationship</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topBrokers.map((broker, index) => (
                  <div
                    key={broker.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                          index === 0
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                            : index === 2
                            ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                            : 'bg-gray-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{broker.name}</p>
                        <p className="text-sm text-gray-500">{broker.loads} loads</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="font-medium text-green-400">
                          ${broker.revenue.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">revenue</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            broker.acceptance >= 80
                              ? 'bg-green-500/20 text-green-400'
                              : broker.acceptance >= 70
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }
                        >
                          {broker.acceptance}% accepted
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Rate per Mile</CardTitle>
                <CardDescription>Across all brokers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-5xl font-bold text-white">$2.87</p>
                  <p className="text-gray-400 mt-2">per mile average</p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+$0.12 from last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Broker Relationships</CardTitle>
                <CardDescription>Active partnerships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-5xl font-bold text-white">23</p>
                  <p className="text-gray-400 mt-2">active brokers</p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-cyan-400">
                    <span className="text-sm">5 new this month</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
