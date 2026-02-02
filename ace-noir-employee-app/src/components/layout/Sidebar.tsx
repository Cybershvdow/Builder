'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  HomeIcon,
  UsersIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Billing', href: '/billing', icon: BanknotesIcon },
  { name: 'Users', href: '/users', icon: UsersIcon, adminOnly: true },
  { name: 'Time Clock', href: '/time-tracking', icon: ClockIcon },
  { name: 'Timesheets', href: '/timesheets', icon: DocumentTextIcon },
  { name: 'Schedule', href: '/schedule', icon: CalendarDaysIcon },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Facilities', href: '/facilities', icon: BuildingOfficeIcon, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { currentUser, sidebarOpen, setSidebarOpen, unreadCount } = useStore()

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 bg-ace-black text-white rounded-lg lg:hidden"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-ace-black transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-ace-gold rounded-lg flex items-center justify-center">
                <span className="text-ace-black font-bold text-lg">AN</span>
              </div>
              <div>
                <h1 className="text-white font-semibold">Ace Noir</h1>
                <p className="text-xs text-gray-400">Employee Portal</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-ace-gold text-ace-black'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                  {item.name === 'Messages' && unreadCount > 0 && (
                    <span className="absolute right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          {currentUser && (
            <div className="px-3 py-4 border-t border-gray-800">
              <div className="flex items-center px-3 py-2">
                <div className="w-10 h-10 bg-ace-gold rounded-full flex items-center justify-center">
                  <span className="text-ace-black font-semibold">
                    {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {currentUser.full_name}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {currentUser.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
