'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useStore } from '@/store/useStore'
import type { Invoice, Receipt, BillingStats } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { INVOICE_STATUS_CONFIG, PAYMENT_METHOD_LABELS } from '@/lib/cleaning-services'
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  ChevronRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export default function BillingDashboard() {
  const { clients, setClients, invoices, setInvoices, receipts, setReceipts } = useStore()
  const [stats, setStats] = useState<BillingStats>({
    total_invoiced: 0,
    total_paid: 0,
    total_outstanding: 0,
    invoices_count: 0,
    receipts_count: 0,
    clients_count: 0,
  })

  // Load data from localStorage
  useEffect(() => {
    const savedClients = localStorage.getItem('billing_clients')
    const savedInvoices = localStorage.getItem('billing_invoices')
    const savedReceipts = localStorage.getItem('billing_receipts')
    if (savedClients) setClients(JSON.parse(savedClients))
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices))
    if (savedReceipts) setReceipts(JSON.parse(savedReceipts))
  }, [setClients, setInvoices, setReceipts])

  // Calculate stats
  useEffect(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
    const totalPaid = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0)
    const totalOutstanding = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0)

    setStats({
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_outstanding: totalOutstanding,
      invoices_count: invoices.length,
      receipts_count: receipts.length,
      clients_count: clients.length,
    })
  }, [invoices, receipts, clients])

  // Get recent invoices and receipts
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const recentReceipts = [...receipts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Get overdue invoices
  const overdueInvoices = invoices.filter((inv) => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return false
    const dueDate = new Date(inv.due_date)
    return dueDate < new Date()
  })

  // Get pending invoices (sent but not paid)
  const pendingInvoices = invoices.filter((inv) => inv.status === 'sent')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ace-black">Billing Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage invoices, receipts, and track payments</p>
        </div>
        <div className="flex gap-2">
          <Link href="/billing/invoices" className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            New Invoice
          </Link>
          <Link href="/billing/receipts" className="btn-outline flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            New Receipt
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-ace-gold/20 rounded-lg flex items-center justify-center">
                <CurrencyDollarIcon className="w-6 h-6 text-ace-gold-dark" />
              </div>
              <span className="flex items-center text-sm text-green-600">
                <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                Total
              </span>
            </div>
            <h3 className="text-2xl font-bold text-ace-black">{formatCurrency(stats.total_invoiced)}</h3>
            <p className="text-sm text-gray-500 mt-1">Total Invoiced</p>
          </div>
        </div>

        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <span className="badge badge-green">Collected</span>
            </div>
            <h3 className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_paid)}</h3>
            <p className="text-sm text-gray-500 mt-1">Total Paid</p>
          </div>
        </div>

        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-orange-600" />
              </div>
              <span className="badge badge-gold">Pending</span>
            </div>
            <h3 className="text-2xl font-bold text-orange-600">{formatCurrency(stats.total_outstanding)}</h3>
            <p className="text-sm text-gray-500 mt-1">Outstanding</p>
          </div>
        </div>

        <div className="card">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="badge badge-blue">Active</span>
            </div>
            <h3 className="text-2xl font-bold text-ace-black">{stats.clients_count}</h3>
            <p className="text-sm text-gray-500 mt-1">Clients</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link href="/billing/invoices" className="card hover:shadow-md transition-shadow">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="w-8 h-8 text-ace-gold" />
              <div>
                <p className="text-2xl font-bold text-ace-black">{stats.invoices_count}</p>
                <p className="text-sm text-gray-500">Invoices</p>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/billing/receipts" className="card hover:shadow-md transition-shadow">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ReceiptPercentIcon className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-ace-black">{stats.receipts_count}</p>
                <p className="text-sm text-gray-500">Receipts</p>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link href="/billing/clients" className="card hover:shadow-md transition-shadow">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-ace-black">{stats.clients_count}</p>
                <p className="text-sm text-gray-500">Clients</p>
              </div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Alerts */}
      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-slide-in">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Overdue Invoices</h3>
              <p className="text-sm text-red-600 mb-2">
                You have {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''} totaling{' '}
                {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.total, 0))}
              </p>
              <div className="flex flex-wrap gap-2">
                {overdueInvoices.slice(0, 3).map((inv) => {
                  const client = clients.find((c) => c.id === inv.client_id)
                  return (
                    <Link
                      key={inv.id}
                      href="/billing/invoices"
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                      {inv.invoice_number} - {client?.company_name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-ace-black">Recent Invoices</h2>
            <Link href="/billing/invoices" className="text-sm text-ace-gold hover:text-ace-gold-dark">
              View All
            </Link>
          </div>
          <div className="divide-y">
            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">No invoices yet</p>
                <Link href="/billing/invoices" className="text-sm text-ace-gold hover:text-ace-gold-dark">
                  Create your first invoice
                </Link>
              </div>
            ) : (
              recentInvoices.map((invoice) => {
                const client = clients.find((c) => c.id === invoice.client_id)
                const statusConfig = INVOICE_STATUS_CONFIG[invoice.status]
                return (
                  <div key={invoice.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ace-black">{invoice.invoice_number}</span>
                          <span className={`badge ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{client?.company_name || 'Unknown'}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-ace-black">{formatCurrency(invoice.total)}</p>
                        <p className="text-xs text-gray-400">{formatDate(invoice.issue_date)}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Receipts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold text-ace-black">Recent Receipts</h2>
            <Link href="/billing/receipts" className="text-sm text-ace-gold hover:text-ace-gold-dark">
              View All
            </Link>
          </div>
          <div className="divide-y">
            {recentReceipts.length === 0 ? (
              <div className="p-8 text-center">
                <ReceiptPercentIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-3">No receipts yet</p>
                <Link href="/billing/receipts" className="text-sm text-ace-gold hover:text-ace-gold-dark">
                  Create your first receipt
                </Link>
              </div>
            ) : (
              recentReceipts.map((receipt) => {
                const client = clients.find((c) => c.id === receipt.client_id)
                return (
                  <div key={receipt.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-ace-black">{receipt.receipt_number}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{client?.company_name || 'Unknown'}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-green-600">{formatCurrency(receipt.amount)}</p>
                        <p className="text-xs text-gray-400">
                          {PAYMENT_METHOD_LABELS[receipt.payment_method]}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Pending Invoices */}
      {pendingInvoices.length > 0 && (
        <div className="card mt-6">
          <div className="card-header">
            <h2 className="font-semibold text-ace-black flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-orange-500" />
              Awaiting Payment ({pendingInvoices.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingInvoices.map((invoice) => {
                  const client = clients.find((c) => c.id === invoice.client_id)
                  const isOverdue = new Date(invoice.due_date) < new Date()
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-ace-black">{invoice.invoice_number}</td>
                      <td className="px-4 py-3 text-gray-600">{client?.company_name || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {formatDate(invoice.due_date)}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ace-black">
                        {formatCurrency(invoice.total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State for New Users */}
      {stats.invoices_count === 0 && stats.clients_count === 0 && (
        <div className="card mt-6">
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-ace-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-10 h-10 text-ace-gold" />
            </div>
            <h2 className="text-xl font-bold text-ace-black mb-2">Welcome to Billing!</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start by adding your clients, then create invoices for your cleaning services.
              Track payments and generate professional receipts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/billing/clients" className="btn-primary">
                <PlusIcon className="w-5 h-5 mr-2 inline" />
                Add Your First Client
              </Link>
              <Link href="/billing/invoices" className="btn-outline">
                <DocumentTextIcon className="w-5 h-5 mr-2 inline" />
                Create an Invoice
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
