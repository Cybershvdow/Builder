'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import toast from 'react-hot-toast'
import {
  UserCircleIcon,
  KeyIcon,
  BellIcon,
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const supabase = createClient()
  const { currentUser, setCurrentUser } = useStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  const [profileData, setProfileData] = useState({
    full_name: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone || null,
        })
        .eq('id', currentUser.id)
        .select()
        .single()

      if (error) throw error

      setCurrentUser(data)
      toast.success('Profile updated!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      toast.success('Password updated!')
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'password', name: 'Password', icon: KeyIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ace-black">Settings</h1>
        <p className="text-gray-500">Manage your account preferences</p>
      </div>

      <div className="card overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-ace-gold text-ace-gold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-ace-gold rounded-full flex items-center justify-center">
                  <span className="text-ace-black text-2xl font-bold">
                    {currentUser?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ace-black">
                    {currentUser?.full_name}
                  </h3>
                  <p className="text-gray-500">{currentUser?.email}</p>
                  <span className="badge badge-gold capitalize mt-1">
                    {currentUser?.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="form-label">Full Name</label>
                  <input
                    id="full_name"
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="form-label">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="form-input"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-ace-black mb-2">Account Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 text-ace-black">{currentUser?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <span className="ml-2 text-ace-black capitalize">{currentUser?.role}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Hourly Rate:</span>
                    <span className="ml-2 text-ace-black">${currentUser?.hourly_rate?.toFixed(2) || '15.00'}/hr</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 ${currentUser?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {currentUser?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
              <div>
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <p className="text-gray-500">
                Notification preferences will be available in a future update.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-ace-black">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ace-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ace-gold"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-ace-black">Schedule Reminders</p>
                    <p className="text-sm text-gray-500">Get reminded about upcoming shifts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ace-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ace-gold"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-ace-black">Message Notifications</p>
                    <p className="text-sm text-gray-500">Get notified about new messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ace-gold/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ace-gold"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
