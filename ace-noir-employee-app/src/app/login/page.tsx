'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.session) {
        toast.success('Welcome back!')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ace-cream to-white p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-ace-black rounded-2xl mb-4">
            <span className="text-ace-gold text-3xl font-bold">AN</span>
          </div>
          <h1 className="text-2xl font-bold text-ace-black">Ace Noir</h1>
          <p className="text-gray-600">Employee Portal</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-ace-black mb-6">Sign In</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <Link href="/forgot-password" className="text-ace-gold hover:text-ace-gold-dark">
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Have an invite?{' '}
          <Link href="/invite" className="text-ace-gold hover:text-ace-gold-dark font-medium">
            Accept Invitation
          </Link>
        </p>
      </div>
    </div>
  )
}
