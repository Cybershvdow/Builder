'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const { setCurrentUser, setFacilities, setUsers } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/login')
          return
        }

        // Fetch current user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setCurrentUser(profile)
        }

        // Fetch facilities
        const { data: facilities } = await supabase
          .from('facilities')
          .select('*')
          .eq('is_active', true)
          .order('name')

        if (facilities) {
          setFacilities(facilities)
        }

        // Fetch all users (for admins/managers)
        if (profile?.role === 'admin' || profile?.role === 'manager') {
          const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name')

          if (users) {
            setUsers(users)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Error initializing app:', error)
        router.push('/login')
      }
    }

    initializeApp()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, setCurrentUser, setFacilities, setUsers])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-ace-black">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
