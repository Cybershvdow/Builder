'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import type { User, UserInvite } from '@/types'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  EnvelopeIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

export default function UsersPage() {
  const router = useRouter()
  const supabase = createClient()
  const { currentUser, users, setUsers } = useStore()
  const [loading, setLoading] = useState(true)
  const [pendingInvites, setPendingInvites] = useState<UserInvite[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      router.push('/dashboard')
      return
    }

    const fetchData = async () => {
      try {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name')

        if (usersData) setUsers(usersData)

        const { data: invites } = await supabase
          .from('user_invites')
          .select('*')
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (invites) setPendingInvites(invites)

        setLoading(false)
      } catch (error) {
        console.error('Error fetching users:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser, router, supabase, setUsers])

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleActive = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)

      if (error) throw error

      setUsers(users.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)))
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`)
    } catch (error) {
      toast.error('Failed to update user status')
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
          <h1 className="text-2xl font-bold text-ace-black">Users</h1>
          <p className="text-gray-500">Manage employees and send invitations</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center justify-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Invite User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-ace-black flex items-center">
              <EnvelopeIcon className="w-5 h-5 mr-2 text-ace-gold" />
              Pending Invitations ({pendingInvites.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-ace-black">{invite.email}</p>
                  <p className="text-sm text-gray-500 capitalize">Role: {invite.role}</p>
                </div>
                <span className="badge badge-gold">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-ace-gold rounded-full flex items-center justify-center">
                        <span className="text-ace-black font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-ace-black">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-ace-black">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-ace-black">${user.hourly_rate?.toFixed(2) || '15.00'}/hr</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.is_active ? 'badge-green' : 'badge-red'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setShowEditModal(true)
                            }}
                            className="p-2 text-gray-500 hover:text-ace-gold hover:bg-gray-100 rounded-lg"
                            title="Edit user"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`p-2 rounded-lg ${
                              user.is_active
                                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? (
                              <XMarkIcon className="w-5 h-5" />
                            ) : (
                              <CheckIcon className="w-5 h-5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={(invite) => {
            setPendingInvites([invite, ...pendingInvites])
            setShowInviteModal(false)
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSuccess={(updatedUser) => {
            setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
            setShowEditModal(false)
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}

function InviteModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (invite: UserInvite) => void
}) {
  const supabase = createClient()
  const { currentUser } = useStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
    hourlyRate: '15.00',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data, error } = await supabase
        .from('user_invites')
        .insert({
          email: formData.email,
          role: formData.role,
          invited_by: currentUser?.id,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Send invite email via API
      await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          token,
          role: formData.role,
        }),
      })

      toast.success('Invitation sent successfully!')
      onSuccess(data)
    } catch (error) {
      console.error('Error sending invite:', error)
      toast.error('Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ace-black">Invite New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="email" className="form-label">Email Address *</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              placeholder="employee@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="form-label">Role *</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'employee' })}
              className="form-input"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="hourlyRate" className="form-label">Hourly Rate ($)</label>
            <input
              id="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              className="form-input"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User
  onClose: () => void
  onSuccess: (user: User) => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    phone: user.phone || '',
    role: user.role,
    hourly_rate: user.hourly_rate?.toString() || '15.00',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          role: formData.role,
          hourly_rate: parseFloat(formData.hourly_rate),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      toast.success('User updated successfully!')
      onSuccess(data)
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ace-black">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="full_name" className="form-label">Full Name *</label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="form-label">Phone</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="form-input"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label htmlFor="role" className="form-label">Role *</label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'employee' })}
              className="form-input"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="hourly_rate" className="form-label">Hourly Rate ($)</label>
            <input
              id="hourly_rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              className="form-input"
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
