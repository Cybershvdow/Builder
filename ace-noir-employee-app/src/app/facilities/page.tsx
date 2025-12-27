'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import type { Facility } from '@/types'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

export default function FacilitiesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { currentUser, facilities, setFacilities } = useStore()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null)

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push('/dashboard')
      return
    }

    const fetchFacilities = async () => {
      try {
        const { data } = await supabase
          .from('facilities')
          .select('*')
          .order('name')

        if (data) setFacilities(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching facilities:', error)
        setLoading(false)
      }
    }

    fetchFacilities()
  }, [currentUser, isAdmin, router, supabase, setFacilities])

  const filteredFacilities = facilities.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async (facility: Facility) => {
    if (!confirm(`Are you sure you want to delete "${facility.name}"?`)) return

    try {
      const { error } = await supabase
        .from('facilities')
        .delete()
        .eq('id', facility.id)

      if (error) throw error

      setFacilities(facilities.filter((f) => f.id !== facility.id))
      toast.success('Facility deleted')
    } catch (error) {
      toast.error('Failed to delete facility')
    }
  }

  const handleToggleActive = async (facility: Facility) => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({ is_active: !facility.is_active })
        .eq('id', facility.id)

      if (error) throw error

      setFacilities(
        facilities.map((f) =>
          f.id === facility.id ? { ...f, is_active: !f.is_active } : f
        )
      )
      toast.success(`Facility ${facility.is_active ? 'deactivated' : 'activated'}`)
    } catch (error) {
      toast.error('Failed to update facility')
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
          <h1 className="text-2xl font-bold text-ace-black">Facilities</h1>
          <p className="text-gray-500">Manage your cleaning locations</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Facility
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFacilities.map((facility) => (
          <div key={facility.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-ace-gold/10 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-ace-gold" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-ace-black">{facility.name}</h3>
                    <span className={`badge ${facility.is_active ? 'badge-green' : 'badge-red'}`}>
                      {facility.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingFacility(facility)}
                    className="p-2 text-gray-400 hover:text-ace-gold hover:bg-gray-100 rounded-lg"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(facility)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-start text-sm">
                  <MapPinIcon className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-gray-600">
                    <p>{facility.address}</p>
                    <p>{facility.city}, {facility.state} {facility.zip_code}</p>
                  </div>
                </div>
                {facility.contact_phone && (
                  <div className="flex items-center text-sm">
                    <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{facility.contact_phone}</span>
                  </div>
                )}
                {facility.contact_name && (
                  <p className="text-sm text-gray-500">
                    Contact: {facility.contact_name}
                  </p>
                )}
              </div>

              {facility.notes && (
                <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                  {facility.notes}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleToggleActive(facility)}
                  className={`text-sm font-medium ${
                    facility.is_active
                      ? 'text-red-600 hover:text-red-700'
                      : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  {facility.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFacilities.length === 0 && (
        <div className="card">
          <div className="card-body text-center py-12">
            <BuildingOfficeIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No facilities found</p>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingFacility) && (
        <FacilityModal
          facility={editingFacility}
          onClose={() => {
            setShowAddModal(false)
            setEditingFacility(null)
          }}
          onSave={(saved) => {
            if (editingFacility) {
              setFacilities(facilities.map((f) => (f.id === saved.id ? saved : f)))
            } else {
              setFacilities([...facilities, saved])
            }
            setShowAddModal(false)
            setEditingFacility(null)
          }}
        />
      )}
    </div>
  )
}

function FacilityModal({
  facility,
  onClose,
  onSave,
}: {
  facility: Facility | null
  onClose: () => void
  onSave: (facility: Facility) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: facility?.name || '',
    address: facility?.address || '',
    city: facility?.city || '',
    state: facility?.state || 'CA',
    zip_code: facility?.zip_code || '',
    contact_name: facility?.contact_name || '',
    contact_phone: facility?.contact_phone || '',
    notes: facility?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (facility) {
        // Update
        const { data, error } = await supabase
          .from('facilities')
          .update(formData)
          .eq('id', facility.id)
          .select()
          .single()

        if (error) throw error
        toast.success('Facility updated!')
        onSave(data)
      } else {
        // Create
        const { data, error } = await supabase
          .from('facilities')
          .insert({ ...formData, is_active: true })
          .select()
          .single()

        if (error) throw error
        toast.success('Facility added!')
        onSave(data)
      }
    } catch (error) {
      console.error('Error saving facility:', error)
      toast.error('Failed to save facility')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full animate-slide-in max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-ace-black">
            {facility ? 'Edit Facility' : 'Add Facility'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="form-label">Facility Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="e.g., Downtown Office Building"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="form-label">Street Address *</label>
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input"
              placeholder="123 Main St"
              required
            />
          </div>

          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-3">
              <label htmlFor="city" className="form-label">City *</label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="form-input"
                placeholder="Los Angeles"
                required
              />
            </div>
            <div className="col-span-1">
              <label htmlFor="state" className="form-label">State *</label>
              <input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="form-input"
                placeholder="CA"
                maxLength={2}
                required
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="zip_code" className="form-label">ZIP Code *</label>
              <input
                id="zip_code"
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className="form-input"
                placeholder="90001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_name" className="form-label">Contact Name</label>
              <input
                id="contact_name"
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="form-input"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label htmlFor="contact_phone" className="form-label">Contact Phone</label>
              <input
                id="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="form-input"
                placeholder="(555) 123-4567"
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
              rows={3}
              placeholder="Access codes, special instructions, etc."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : facility ? 'Update Facility' : 'Add Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
