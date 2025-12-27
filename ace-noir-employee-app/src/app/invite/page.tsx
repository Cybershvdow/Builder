'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

function InviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [inviteValid, setInviteValid] = useState(false)
  const [inviteData, setInviteData] = useState<{
    email: string
    role: string
  } | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const token = searchParams.get('token')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidating(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_invites')
          .select('*')
          .eq('token', token)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (error || !data) {
          toast.error('Invalid or expired invitation')
          setInviteValid(false)
        } else {
          setInviteValid(true)
          setInviteData({ email: data.email, role: data.role })
        }
      } catch (error) {
        toast.error('Error validating invitation')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData!.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: inviteData!.role,
          },
        },
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      // Update the invite as accepted
      await supabase
        .from('user_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('token', token)

      // Update profile with phone if provided
      if (authData.user && formData.phone) {
        await supabase
          .from('profiles')
          .update({ phone: formData.phone })
          .eq('id', authData.user.id)
      }

      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ace-cream">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-ace-black">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (!token || !inviteValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ace-cream p-4">
        <div className="card max-w-md w-full">
          <div className="card-body text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-ace-black mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-4">
              This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ace-cream to-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-ace-black rounded-2xl mb-4">
            <span className="text-ace-gold text-3xl font-bold">AN</span>
          </div>
          <h1 className="text-2xl font-bold text-ace-black">Welcome to Ace Noir</h1>
          <p className="text-gray-600">Complete your account setup</p>
        </div>

        {/* Form */}
        <div className="card">
          <div className="card-body">
            <div className="mb-6 p-4 bg-ace-gold/10 rounded-lg">
              <p className="text-sm text-ace-black">
                <span className="font-medium">Email:</span> {inviteData?.email}
              </p>
              <p className="text-sm text-ace-black">
                <span className="font-medium">Role:</span>{' '}
                <span className="capitalize">{inviteData?.role}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="form-label">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="form-input"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                  placeholder="(555) 123-4567"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="spinner w-5 h-5 mr-2"></div>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ace-cream">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <p className="text-ace-black">Loading...</p>
          </div>
        </div>
      }
    >
      <InviteForm />
    </Suspense>
  )
}
