'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import type { Client } from '@/types'
import { cn, generateToken } from '@/lib/utils'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ClientsPage() {
  const { clients, setClients, addClient, updateClient, deleteClient } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    notes: '',
  })

  // Load clients from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('billing_clients')
    if (saved) {
      setClients(JSON.parse(saved))
    }
  }, [setClients])

  // Save to localStorage when clients change
  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('billing_clients', JSON.stringify(clients))
    }
  }, [clients])

  const filteredClients = clients.filter(
    (client) =>
      client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      notes: '',
    })
    setEditingClient(null)
  }

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setFormData({
        company_name: client.company_name,
        contact_name: client.contact_name,
        email: client.email,
        phone: client.phone || '',
        address: client.address,
        city: client.city,
        state: client.state,
        zip_code: client.zip_code,
        notes: client.notes || '',
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const now = new Date().toISOString()

      if (editingClient) {
        // Update existing client
        const updatedClient: Client = {
          ...editingClient,
          ...formData,
          updated_at: now,
        }
        updateClient(updatedClient)
        toast.success('Client updated successfully')
      } else {
        // Create new client
        const newClient: Client = {
          id: generateToken(16),
          ...formData,
          is_active: true,
          created_at: now,
          updated_at: now,
        }
        addClient(newClient)
        toast.success('Client added successfully')
      }

      closeModal()
    } catch {
      toast.error('Failed to save client')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (client: Client) => {
    if (confirm(`Are you sure you want to delete "${client.company_name}"?`)) {
      deleteClient(client.id)
      // Update localStorage
      const updatedClients = clients.filter((c) => c.id !== client.id)
      localStorage.setItem('billing_clients', JSON.stringify(updatedClients))
      toast.success('Client deleted')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ace-black">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client database</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="card mb-6">
        <div className="p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name, company, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="card">
          <div className="p-12 text-center">
            <BuildingOffice2Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Add your first client to start creating invoices'}
            </p>
            {!searchQuery && (
              <button onClick={() => openModal()} className="btn-primary">
                Add Your First Client
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="card hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-ace-gold/20 rounded-lg flex items-center justify-center">
                      <BuildingOffice2Icon className="w-6 h-6 text-ace-gold-dark" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ace-black">{client.company_name}</h3>
                      <p className="text-sm text-gray-500">{client.contact_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal(client)}
                      className="p-1.5 text-gray-400 hover:text-ace-gold rounded"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="line-clamp-2">
                      {client.address}, {client.city}, {client.state} {client.zip_code}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Client Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label">Company Name *</label>
                  <div className="relative">
                    <BuildingOffice2Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="form-input pl-10"
                      placeholder="ABC Cleaning Services"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">Contact Name *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="form-input pl-10"
                      placeholder="John Smith"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email *</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-input pl-10"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Phone</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="form-input pl-10"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="form-input"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="form-label">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="form-input"
                    placeholder="New York"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      className="form-input"
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="form-label">ZIP *</label>
                    <input
                      type="text"
                      required
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="form-input"
                      placeholder="10001"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="form-label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-input"
                    rows={3}
                    placeholder="Any additional notes about this client..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={closeModal} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner w-4 h-4" />
                      Saving...
                    </span>
                  ) : editingClient ? (
                    'Update Client'
                  ) : (
                    'Add Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
