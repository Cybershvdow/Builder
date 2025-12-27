'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import { formatDate, formatTime, formatHours, formatCurrency } from '@/lib/utils'
import type { TimeEntry, PayPeriod, User } from '@/types'
import toast from 'react-hot-toast'
import {
  DocumentArrowDownIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  FunnelIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'

export default function TimesheetsPage() {
  const supabase = createClient()
  const { currentUser, users } = useStore()
  const [loading, setLoading] = useState(true)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return

      try {
        // Fetch pay periods
        const { data: periods } = await supabase
          .from('pay_periods')
          .select('*')
          .order('start_date', { ascending: false })

        if (periods && periods.length > 0) {
          setPayPeriods(periods)
          setSelectedPeriod(periods[0].id)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser, supabase])

  useEffect(() => {
    const fetchEntries = async () => {
      if (!selectedPeriod || !currentUser) return

      const period = payPeriods.find((p) => p.id === selectedPeriod)
      if (!period) return

      try {
        let query = supabase
          .from('time_entries')
          .select('*, user:profiles(*), facility:facilities(*)')
          .gte('clock_in', `${period.start_date}T00:00:00`)
          .lte('clock_in', `${period.end_date}T23:59:59`)
          .order('clock_in', { ascending: false })

        if (!isAdmin) {
          query = query.eq('user_id', currentUser.id)
        } else if (selectedUser) {
          query = query.eq('user_id', selectedUser)
        }

        const { data } = await query
        if (data) setTimeEntries(data)
      } catch (error) {
        console.error('Error fetching entries:', error)
      }
    }

    fetchEntries()
  }, [selectedPeriod, selectedUser, currentUser, isAdmin, payPeriods, supabase])

  const totalHours = timeEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0)
  const selectedUserData = isAdmin && selectedUser
    ? users.find((u) => u.id === selectedUser)
    : currentUser
  const totalPay = totalHours * (selectedUserData?.hourly_rate || 15)

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setShowExportMenu(false)

    try {
      const response = await fetch('/api/export-timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          entries: timeEntries,
          period: payPeriods.find((p) => p.id === selectedPeriod),
          user: selectedUserData,
          totalHours,
          totalPay,
        }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timesheet-${format === 'excel' ? 'xlsx' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Timesheet exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export timesheet')
    }
  }

  const handleApprove = async (entry: TimeEntry) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ status: 'approved' })
        .eq('id', entry.id)

      if (error) throw error

      setTimeEntries(timeEntries.map((e) =>
        e.id === entry.id ? { ...e, status: 'approved' } : e
      ))
      toast.success('Entry approved')
    } catch (error) {
      toast.error('Failed to approve entry')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ace-black">Timesheets</h1>
          <p className="text-gray-500">View and manage time entries</p>
        </div>
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-primary flex items-center"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="period" className="form-label flex items-center">
                <CalendarDaysIcon className="w-4 h-4 mr-1" />
                Pay Period
              </label>
              <select
                id="period"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="form-input"
              >
                {payPeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                  </option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <div className="flex-1">
                <label htmlFor="user" className="form-label flex items-center">
                  <FunnelIcon className="w-4 h-4 mr-1" />
                  Filter by Employee
                </label>
                <select
                  id="user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Employees</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-gray-500">Total Hours</p>
            <p className="text-3xl font-bold text-ace-black">{formatHours(totalHours)}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-gray-500">Hourly Rate</p>
            <p className="text-3xl font-bold text-ace-gold">
              {formatCurrency(selectedUserData?.hourly_rate || 15)}/hr
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-sm text-gray-500">Estimated Pay</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(totalPay)}</p>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Date
                </th>
                {isAdmin && !selectedUser && (
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Facility
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No time entries for this period
                  </td>
                </tr>
              ) : (
                timeEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-ace-black">
                      {formatDate(entry.clock_in)}
                    </td>
                    {isAdmin && !selectedUser && (
                      <td className="px-6 py-4 text-ace-black">
                        {entry.user?.full_name}
                      </td>
                    )}
                    <td className="px-6 py-4 text-ace-black">
                      {formatTime(entry.clock_in)}
                    </td>
                    <td className="px-6 py-4 text-ace-black">
                      {entry.clock_out ? formatTime(entry.clock_out) : '-'}
                    </td>
                    <td className="px-6 py-4 text-ace-black">
                      {entry.facility?.name || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-ace-gold">
                      {entry.total_hours ? formatHours(entry.total_hours) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        entry.status === 'approved' ? 'badge-green' :
                        entry.status === 'completed' ? 'badge-blue' :
                        entry.status === 'active' ? 'badge-gold' :
                        'badge-gray'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="p-2 text-gray-500 hover:text-ace-gold hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          {entry.status === 'completed' && (
                            <button
                              onClick={() => handleApprove(entry)}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={(updated) => {
            setTimeEntries(timeEntries.map((e) =>
              e.id === updated.id ? updated : e
            ))
            setEditingEntry(null)
          }}
        />
      )}
    </div>
  )
}

function EditEntryModal({
  entry,
  onClose,
  onSave,
}: {
  entry: TimeEntry
  onClose: () => void
  onSave: (entry: TimeEntry) => void
}) {
  const supabase = createClient()
  const { currentUser } = useStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clock_in: entry.clock_in.slice(0, 16),
    clock_out: entry.clock_out?.slice(0, 16) || '',
    edit_reason: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.edit_reason.trim()) {
      toast.error('Please provide a reason for the edit')
      return
    }

    setLoading(true)

    try {
      const clockIn = new Date(formData.clock_in)
      const clockOut = formData.clock_out ? new Date(formData.clock_out) : null
      const totalHours = clockOut
        ? (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
        : null

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          clock_in: clockIn.toISOString(),
          clock_out: clockOut?.toISOString() || null,
          total_hours: totalHours ? Math.round(totalHours * 100) / 100 : null,
          status: clockOut ? 'edited' : 'active',
          edited_by: currentUser?.id,
          edit_reason: formData.edit_reason,
        })
        .eq('id', entry.id)
        .select('*, user:profiles(*), facility:facilities(*)')
        .single()

      if (error) throw error

      toast.success('Time entry updated')
      onSave(data)
    } catch (error) {
      console.error('Error updating entry:', error)
      toast.error('Failed to update entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ace-black">Edit Time Entry</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="clock_in" className="form-label">Clock In *</label>
            <input
              id="clock_in"
              type="datetime-local"
              value={formData.clock_in}
              onChange={(e) => setFormData({ ...formData, clock_in: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="clock_out" className="form-label">Clock Out</label>
            <input
              id="clock_out"
              type="datetime-local"
              value={formData.clock_out}
              onChange={(e) => setFormData({ ...formData, clock_out: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="edit_reason" className="form-label">Reason for Edit *</label>
            <textarea
              id="edit_reason"
              value={formData.edit_reason}
              onChange={(e) => setFormData({ ...formData, edit_reason: e.target.value })}
              className="form-input"
              rows={3}
              placeholder="Please explain why this entry is being modified..."
              required
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
