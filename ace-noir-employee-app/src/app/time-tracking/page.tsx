'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import { formatDateTime, formatHours, getCurrentPosition, reverseGeocode } from '@/lib/utils'
import type { TimeEntry } from '@/types'
import toast from 'react-hot-toast'
import {
  ClockIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

export default function TimeTrackingPage() {
  const supabase = createClient()
  const { currentUser, facilities, activeTimeEntry, setActiveTimeEntry } = useStore()
  const [loading, setLoading] = useState(true)
  const [clockingIn, setClockingIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState('')
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [locationStatus, setLocationStatus] = useState<'idle' | 'getting' | 'success' | 'error'>('idle')
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)

  useEffect(() => {
    const fetchActiveEntry = async () => {
      if (!currentUser) return

      try {
        // Check for active time entry
        const { data: activeEntry } = await supabase
          .from('time_entries')
          .select('*, facility:facilities(*)')
          .eq('user_id', currentUser.id)
          .eq('status', 'active')
          .single()

        if (activeEntry) {
          setActiveTimeEntry(activeEntry)
        }

        // Fetch recent entries
        const { data: recent } = await supabase
          .from('time_entries')
          .select('*, facility:facilities(*)')
          .eq('user_id', currentUser.id)
          .order('clock_in', { ascending: false })
          .limit(10)

        if (recent) setRecentEntries(recent)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching time entries:', error)
        setLoading(false)
      }
    }

    fetchActiveEntry()
  }, [currentUser, supabase, setActiveTimeEntry])

  const getLocation = async () => {
    setLocationStatus('getting')
    try {
      const position = await getCurrentPosition()
      const { latitude, longitude } = position.coords
      const address = await reverseGeocode(latitude, longitude)

      setCurrentLocation({
        lat: latitude,
        lng: longitude,
        address,
      })
      setLocationStatus('success')
      return { latitude, longitude, address }
    } catch (error) {
      console.error('Error getting location:', error)
      setLocationStatus('error')
      toast.error('Could not get your location. Please enable GPS.')
      return null
    }
  }

  const handleClockIn = async () => {
    if (!currentUser) return

    setClockingIn(true)

    const location = await getLocation()
    if (!location) {
      setClockingIn(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: currentUser.id,
          facility_id: selectedFacility || null,
          clock_in: new Date().toISOString(),
          clock_in_latitude: location.latitude,
          clock_in_longitude: location.longitude,
          clock_in_address: location.address,
          status: 'active',
        })
        .select('*, facility:facilities(*)')
        .single()

      if (error) throw error

      setActiveTimeEntry(data)
      setRecentEntries([data, ...recentEntries])
      toast.success('Clocked in successfully!')
    } catch (error) {
      console.error('Error clocking in:', error)
      toast.error('Failed to clock in')
    } finally {
      setClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    if (!currentUser || !activeTimeEntry) return

    setClockingOut(true)

    const location = await getLocation()
    if (!location) {
      setClockingOut(false)
      return
    }

    try {
      const clockOut = new Date()
      const clockIn = new Date(activeTimeEntry.clock_in)
      const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          clock_out: clockOut.toISOString(),
          clock_out_latitude: location.latitude,
          clock_out_longitude: location.longitude,
          clock_out_address: location.address,
          total_hours: Math.round(totalHours * 100) / 100,
          status: 'completed',
        })
        .eq('id', activeTimeEntry.id)
        .select('*, facility:facilities(*)')
        .single()

      if (error) throw error

      setActiveTimeEntry(null)
      setRecentEntries(recentEntries.map((e) => (e.id === data.id ? data : e)))
      toast.success(`Clocked out! Total: ${formatHours(data.total_hours)}`)
    } catch (error) {
      console.error('Error clocking out:', error)
      toast.error('Failed to clock out')
    } finally {
      setClockingOut(false)
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Clock In/Out Card */}
      <div className="card">
        <div className="card-body">
          <div className="text-center">
            {/* Status */}
            <div className="mb-6">
              {activeTimeEntry ? (
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Currently Clocked In
                </div>
              ) : (
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-full">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Not Clocked In
                </div>
              )}
            </div>

            {/* Active Entry Info */}
            {activeTimeEntry && (
              <div className="mb-6 p-4 bg-ace-gold/10 rounded-lg">
                <p className="text-sm text-gray-600">Started at</p>
                <p className="text-xl font-semibold text-ace-black">
                  {formatDateTime(activeTimeEntry.clock_in)}
                </p>
                {activeTimeEntry.facility && (
                  <p className="text-sm text-ace-gold mt-2 flex items-center justify-center">
                    <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                    {activeTimeEntry.facility.name}
                  </p>
                )}
                {activeTimeEntry.clock_in_address && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center justify-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {activeTimeEntry.clock_in_address}
                  </p>
                )}
              </div>
            )}

            {/* Facility Selection (only when clocking in) */}
            {!activeTimeEntry && (
              <div className="mb-6 max-w-xs mx-auto">
                <label htmlFor="facility" className="form-label text-left">
                  Select Facility (Optional)
                </label>
                <select
                  id="facility"
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="form-input"
                >
                  <option value="">No facility selected</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Location Status */}
            <div className="mb-6">
              {locationStatus === 'getting' && (
                <div className="flex items-center justify-center text-blue-600">
                  <div className="spinner w-4 h-4 mr-2"></div>
                  Getting your location...
                </div>
              )}
              {locationStatus === 'success' && currentLocation && (
                <div className="flex items-center justify-center text-green-600">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Location verified
                </div>
              )}
              {locationStatus === 'error' && (
                <div className="flex items-center justify-center text-red-600">
                  <ExclamationCircleIcon className="w-5 h-5 mr-2" />
                  Location required for time tracking
                </div>
              )}
            </div>

            {/* Clock Button */}
            {activeTimeEntry ? (
              <button
                onClick={handleClockOut}
                disabled={clockingOut}
                className="w-48 h-48 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center mx-auto"
              >
                {clockingOut ? (
                  <>
                    <div className="spinner w-8 h-8 mb-2 border-white border-t-transparent"></div>
                    <span>Clocking Out...</span>
                  </>
                ) : (
                  <>
                    <ClockIcon className="w-12 h-12 mb-2" />
                    <span>CLOCK OUT</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleClockIn}
                disabled={clockingIn}
                className="w-48 h-48 rounded-full bg-ace-gold hover:bg-ace-gold-dark text-ace-black font-bold text-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center mx-auto"
              >
                {clockingIn ? (
                  <>
                    <div className="spinner w-8 h-8 mb-2"></div>
                    <span>Clocking In...</span>
                  </>
                ) : (
                  <>
                    <ClockIcon className="w-12 h-12 mb-2" />
                    <span>CLOCK IN</span>
                  </>
                )}
              </button>
            )}

            <p className="mt-4 text-sm text-gray-500">
              GPS location will be recorded when you clock in/out
            </p>
          </div>
        </div>
      </div>

      {/* Recent Time Entries */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-ace-black">Recent Time Entries</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recentEntries.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No time entries yet. Clock in to get started!
            </div>
          ) : (
            recentEntries.map((entry) => (
              <div key={entry.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-ace-black">
                      {formatDateTime(entry.clock_in)}
                    </p>
                    {entry.facility && (
                      <p className="text-sm text-ace-gold flex items-center mt-1">
                        <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                        {entry.facility.name}
                      </p>
                    )}
                    {entry.clock_in_address && (
                      <p className="text-xs text-gray-500 flex items-center mt-1">
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        {entry.clock_in_address.substring(0, 50)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {entry.total_hours ? (
                      <>
                        <p className="font-semibold text-ace-gold">
                          {formatHours(entry.total_hours)}
                        </p>
                        <span className={`badge ${
                          entry.status === 'approved' ? 'badge-green' :
                          entry.status === 'completed' ? 'badge-blue' :
                          'badge-gray'
                        }`}>
                          {entry.status}
                        </span>
                      </>
                    ) : (
                      <span className="badge badge-green">Active</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
