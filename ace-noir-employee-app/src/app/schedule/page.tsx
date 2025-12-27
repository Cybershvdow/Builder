'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import { formatDate } from '@/lib/utils'
import type { ScheduleAssignment } from '@/types'
import toast from 'react-hot-toast'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns'

export default function SchedulePage() {
  const supabase = createClient()
  const { currentUser, users, facilities } = useStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduleAssignment | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  const fetchAssignments = useCallback(async () => {
    if (!currentUser) return

    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))

    try {
      let query = supabase
        .from('schedule_assignments')
        .select('*, user:profiles(*), facility:facilities(*)')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))
        .order('start_time')

      if (!isAdmin) {
        query = query.eq('user_id', currentUser.id)
      }

      const { data } = await query
      if (data) setAssignments(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching assignments:', error)
      setLoading(false)
    }
  }, [currentMonth, currentUser, isAdmin, supabase])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter((a) =>
      isSameDay(parseISO(a.date), date)
    )
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    if (isAdmin) {
      setShowAddModal(true)
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return

    try {
      const { error } = await supabase
        .from('schedule_assignments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAssignments(assignments.filter((a) => a.id !== id))
      setSelectedAssignment(null)
      toast.success('Assignment deleted')
    } catch (error) {
      toast.error('Failed to delete assignment')
    }
  }

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-ace-black">
        {format(currentMonth, 'MMMM yyyy')}
      </h2>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentMonth(new Date())}
          className="px-3 py-1 text-sm font-medium text-ace-gold hover:bg-ace-gold/10 rounded-lg"
        >
          Today
        </button>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day
        const dayAssignments = getAssignmentsForDate(currentDay)
        const isToday = isSameDay(currentDay, new Date())
        const isCurrentMonth = isSameMonth(currentDay, monthStart)

        days.push(
          <div
            key={currentDay.toString()}
            onClick={() => handleDateClick(currentDay)}
            className={`min-h-[100px] p-2 border border-gray-100 cursor-pointer transition-colors ${
              isCurrentMonth ? 'bg-white' : 'bg-gray-50'
            } ${isToday ? 'ring-2 ring-ace-gold ring-inset' : ''} hover:bg-gray-50`}
          >
            <span
              className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                isToday
                  ? 'bg-ace-gold text-ace-black font-bold'
                  : isCurrentMonth
                  ? 'text-ace-black'
                  : 'text-gray-400'
              }`}
            >
              {format(currentDay, 'd')}
            </span>
            <div className="mt-1 space-y-1">
              {dayAssignments.slice(0, 3).map((assignment) => (
                <div
                  key={assignment.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedAssignment(assignment)
                  }}
                  className={`text-xs p-1 rounded truncate cursor-pointer ${
                    assignment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : assignment.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-ace-gold/20 text-ace-black'
                  }`}
                >
                  {assignment.start_time.slice(0, 5)} - {assignment.facility?.name}
                </div>
              ))}
              {dayAssignments.length > 3 && (
                <div className="text-xs text-gray-500 pl-1">
                  +{dayAssignments.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }

    return <div>{rows}</div>
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
          <h1 className="text-2xl font-bold text-ace-black">Schedule</h1>
          <p className="text-gray-500">Manage job assignments and shifts</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedDate(new Date())
              setShowAddModal(true)
            }}
            className="btn-primary flex items-center justify-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Assignment
          </button>
        )}
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="card-body">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && selectedDate && (
        <AssignmentModal
          date={selectedDate}
          users={users}
          facilities={facilities}
          onClose={() => {
            setShowAddModal(false)
            setSelectedDate(null)
          }}
          onSave={(assignment) => {
            setAssignments([...assignments, assignment])
            setShowAddModal(false)
            setSelectedDate(null)
          }}
        />
      )}

      {/* Assignment Details Modal */}
      {selectedAssignment && (
        <AssignmentDetailsModal
          assignment={selectedAssignment}
          isAdmin={isAdmin}
          onClose={() => setSelectedAssignment(null)}
          onDelete={() => handleDeleteAssignment(selectedAssignment.id)}
          onUpdate={(updated) => {
            setAssignments(assignments.map((a) =>
              a.id === updated.id ? updated : a
            ))
            setSelectedAssignment(null)
          }}
        />
      )}
    </div>
  )
}

function AssignmentModal({
  date,
  users,
  facilities,
  onClose,
  onSave,
}: {
  date: Date
  users: { id: string; full_name: string }[]
  facilities: { id: string; name: string }[]
  onClose: () => void
  onSave: (assignment: ScheduleAssignment) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    user_id: '',
    facility_id: '',
    date: format(date, 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '17:00',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('schedule_assignments')
        .insert({
          ...formData,
          status: 'scheduled',
        })
        .select('*, user:profiles(*), facility:facilities(*)')
        .single()

      if (error) throw error

      toast.success('Assignment created!')
      onSave(data)
    } catch (error) {
      console.error('Error creating assignment:', error)
      toast.error('Failed to create assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ace-black flex items-center">
            <CalendarDaysIcon className="w-5 h-5 mr-2 text-ace-gold" />
            New Assignment - {formatDate(date)}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="user_id" className="form-label">Employee *</label>
            <select
              id="user_id"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select employee</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="facility_id" className="form-label">Facility *</label>
            <select
              id="facility_id"
              value={formData.facility_id}
              onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select facility</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="form-label">Start Time *</label>
              <input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label htmlFor="end_time" className="form-label">End Time *</label>
              <input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input"
              rows={2}
              placeholder="Any special instructions..."
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssignmentDetailsModal({
  assignment,
  isAdmin,
  onClose,
  onDelete,
  onUpdate,
}: {
  assignment: ScheduleAssignment
  isAdmin: boolean
  onClose: () => void
  onDelete: () => void
  onUpdate: (assignment: ScheduleAssignment) => void
}) {
  const supabase = createClient()

  const handleStatusChange = async (status: string) => {
    try {
      const { data, error } = await supabase
        .from('schedule_assignments')
        .update({ status })
        .eq('id', assignment.id)
        .select('*, user:profiles(*), facility:facilities(*)')
        .single()

      if (error) throw error

      toast.success('Status updated')
      onUpdate(data)
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ace-black">Assignment Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium text-ace-black">{formatDate(assignment.date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Time</p>
            <p className="font-medium text-ace-black">
              {assignment.start_time} - {assignment.end_time}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Employee</p>
            <p className="font-medium text-ace-black">{assignment.user?.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Facility</p>
            <p className="font-medium text-ace-gold">{assignment.facility?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`badge ${
              assignment.status === 'completed' ? 'badge-green' :
              assignment.status === 'cancelled' ? 'badge-red' :
              'badge-blue'
            }`}>
              {assignment.status}
            </span>
          </div>
          {assignment.notes && (
            <div>
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-ace-black">{assignment.notes}</p>
            </div>
          )}

          {isAdmin && (
            <div className="pt-4 space-y-3 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="flex-1 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="flex-1 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  Cancel
                </button>
              </div>
              <button
                onClick={onDelete}
                className="w-full py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                Delete Assignment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
