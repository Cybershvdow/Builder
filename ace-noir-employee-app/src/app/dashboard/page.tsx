'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import { formatDate, formatHours, formatCurrency } from '@/lib/utils'
import type { TimeEntry, ScheduleAssignment } from '@/types'
import {
  ClockIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const supabase = createClient()
  const { currentUser, facilities } = useStore()
  const [stats, setStats] = useState({
    totalHoursThisPeriod: 0,
    totalEarningsThisPeriod: 0,
    activeEmployees: 0,
    upcomingShifts: 0,
  })
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [todaySchedule, setTodaySchedule] = useState<ScheduleAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return

      try {
        const today = new Date().toISOString().split('T')[0]

        // Fetch recent time entries
        let entriesQuery = supabase
          .from('time_entries')
          .select('*, user:profiles(*), facility:facilities(*)')
          .order('clock_in', { ascending: false })
          .limit(5)

        if (!isAdmin) {
          entriesQuery = entriesQuery.eq('user_id', currentUser.id)
        }

        const { data: entries } = await entriesQuery
        if (entries) setRecentEntries(entries)

        // Fetch today's schedule
        let scheduleQuery = supabase
          .from('schedule_assignments')
          .select('*, user:profiles(*), facility:facilities(*)')
          .eq('date', today)
          .eq('status', 'scheduled')

        if (!isAdmin) {
          scheduleQuery = scheduleQuery.eq('user_id', currentUser.id)
        }

        const { data: schedule } = await scheduleQuery
        if (schedule) setTodaySchedule(schedule)

        // Calculate stats
        const periodStart = new Date()
        periodStart.setDate(periodStart.getDate() - 14)

        let hoursQuery = supabase
          .from('time_entries')
          .select('total_hours')
          .gte('clock_in', periodStart.toISOString())
          .not('total_hours', 'is', null)

        if (!isAdmin) {
          hoursQuery = hoursQuery.eq('user_id', currentUser.id)
        }

        const { data: hoursData } = await hoursQuery
        const totalHours = hoursData?.reduce((sum, e) => sum + (e.total_hours || 0), 0) || 0

        // Get active employees count (admin only)
        let activeCount = 1
        if (isAdmin) {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
          activeCount = count || 0
        }

        // Get upcoming shifts count
        const { count: shiftsCount } = await supabase
          .from('schedule_assignments')
          .select('*', { count: 'exact', head: true })
          .gte('date', today)
          .eq('status', 'scheduled')
          .eq('user_id', isAdmin ? currentUser.id : currentUser.id)

        setStats({
          totalHoursThisPeriod: totalHours,
          totalEarningsThisPeriod: totalHours * (currentUser.hourly_rate || 15),
          activeEmployees: activeCount,
          upcomingShifts: shiftsCount || 0,
        })

        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentUser, isAdmin, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Hours This Period"
          value={formatHours(stats.totalHoursThisPeriod)}
          icon={ClockIcon}
          color="gold"
        />
        <StatCard
          title="Est. Earnings"
          value={formatCurrency(stats.totalEarningsThisPeriod)}
          icon={CurrencyDollarIcon}
          color="green"
        />
        {isAdmin && (
          <StatCard
            title="Active Employees"
            value={stats.activeEmployees.toString()}
            icon={UserGroupIcon}
            color="blue"
          />
        )}
        <StatCard
          title="Upcoming Shifts"
          value={stats.upcomingShifts.toString()}
          icon={CalendarDaysIcon}
          color="purple"
        />
        {!isAdmin && (
          <StatCard
            title="Facilities"
            value={facilities.length.toString()}
            icon={BuildingOfficeIcon}
            color="gray"
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-ace-black">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/time-tracking"
              className="flex flex-col items-center p-4 bg-ace-gold/10 rounded-lg hover:bg-ace-gold/20 transition-colors"
            >
              <ClockIcon className="w-8 h-8 text-ace-gold mb-2" />
              <span className="text-sm font-medium text-ace-black">Clock In/Out</span>
            </Link>
            <Link
              href="/schedule"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <CalendarDaysIcon className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-ace-black">View Schedule</span>
            </Link>
            <Link
              href="/timesheets"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <CurrencyDollarIcon className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-ace-black">Timesheets</span>
            </Link>
            <Link
              href="/messages"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-ace-black">Messages</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ace-black">Today&apos;s Schedule</h3>
            <Link href="/schedule" className="text-sm text-ace-gold hover:text-ace-gold-dark">
              View All
            </Link>
          </div>
          <div className="card-body">
            {todaySchedule.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No scheduled shifts for today</p>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-ace-black">
                        {assignment.facility?.name}
                      </p>
                      {isAdmin && (
                        <p className="text-sm text-gray-500">
                          {assignment.user?.full_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ace-gold">
                        {assignment.start_time} - {assignment.end_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Time Entries */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ace-black">Recent Time Entries</h3>
            <Link href="/timesheets" className="text-sm text-ace-gold hover:text-ace-gold-dark">
              View All
            </Link>
          </div>
          <div className="card-body">
            {recentEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent time entries</p>
            ) : (
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-ace-black">
                        {formatDate(entry.clock_in, 'MMM d, yyyy')}
                      </p>
                      {isAdmin && (
                        <p className="text-sm text-gray-500">
                          {entry.user?.full_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {entry.facility?.name || 'No facility'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ace-gold">
                        {entry.total_hours ? formatHours(entry.total_hours) : 'Active'}
                      </p>
                      <span className={`badge ${
                        entry.status === 'active' ? 'badge-blue' :
                        entry.status === 'completed' ? 'badge-green' :
                        entry.status === 'approved' ? 'badge-gold' : 'badge-gray'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  icon: React.ElementType
  color: 'gold' | 'green' | 'blue' | 'purple' | 'gray'
}) {
  const colorClasses = {
    gold: 'bg-ace-gold/10 text-ace-gold',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="card">
      <div className="card-body flex items-center">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-ace-black">{value}</p>
        </div>
      </div>
    </div>
  )
}
