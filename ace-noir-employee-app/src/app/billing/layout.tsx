'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  ChartBarIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

const billingNav = [
  { name: 'Overview', href: '/billing', icon: ChartBarIcon },
  { name: 'Invoices', href: '/billing/invoices', icon: DocumentTextIcon },
  { name: 'Receipts', href: '/billing/receipts', icon: ReceiptPercentIcon },
  { name: 'Clients', href: '/billing/clients', icon: UserGroupIcon },
]

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div>
      {/* Sub-navigation for billing */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto py-2" aria-label="Billing navigation">
            {billingNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-ace-gold text-ace-black'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-ace-black'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  )
}
