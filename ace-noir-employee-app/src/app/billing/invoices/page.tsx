'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import type { Invoice, InvoiceLineItem, Client, PaymentTerms } from '@/types'
import { formatCurrency, formatDate, generateToken } from '@/lib/utils'
import {
  CLEANING_SERVICES,
  SERVICE_CATEGORIES,
  PAYMENT_TERMS_LABELS,
  INVOICE_STATUS_CONFIG,
  generateInvoiceNumber,
  calculateDueDate,
} from '@/lib/cleaning-services'
import {
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function InvoicesPage() {
  const { clients, setClients, invoices, setInvoices, addInvoice, updateInvoice, deleteInvoice } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('net_30')
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('Payment is due within the terms specified. Late payments may be subject to a 1.5% monthly finance charge.')

  // Load data from localStorage
  useEffect(() => {
    const savedClients = localStorage.getItem('billing_clients')
    const savedInvoices = localStorage.getItem('billing_invoices')
    if (savedClients) setClients(JSON.parse(savedClients))
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices))
  }, [setClients, setInvoices])

  // Save invoices to localStorage
  useEffect(() => {
    if (invoices.length > 0) {
      localStorage.setItem('billing_invoices', JSON.stringify(invoices))
    }
  }, [invoices])

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const resetForm = () => {
    setSelectedClientId('')
    setIssueDate(new Date().toISOString().split('T')[0])
    setPaymentTerms('net_30')
    setLineItems([])
    setTaxRate(0)
    setNotes('')
    setTerms('Payment is due within the terms specified. Late payments may be subject to a 1.5% monthly finance charge.')
    setEditingInvoice(null)
  }

  const openModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice)
      setSelectedClientId(invoice.client_id)
      setIssueDate(invoice.issue_date)
      setPaymentTerms(invoice.payment_terms)
      setLineItems(invoice.line_items)
      setTaxRate(invoice.tax_rate)
      setNotes(invoice.notes || '')
      setTerms(invoice.terms || '')
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const addLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: generateToken(8),
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const addServiceItem = (serviceId: string) => {
    const service = CLEANING_SERVICES.find((s) => s.id === serviceId)
    if (!service) return

    const newItem: InvoiceLineItem = {
      id: generateToken(8),
      service_id: service.id,
      description: `${service.name} - ${service.description}`,
      quantity: 1,
      unit_price: service.default_rate,
      total: service.default_rate,
    }
    setLineItems([...lineItems, newItem])
  }

  const updateLineItem = (id: string, field: string, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unit_price') {
            updated.total = Number(updated.quantity) * Number(updated.unit_price)
          }
          return updated
        }
        return item
      })
    )
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId) {
      toast.error('Please select a client')
      return
    }

    if (lineItems.length === 0) {
      toast.error('Please add at least one line item')
      return
    }

    const now = new Date().toISOString()
    const dueDate = calculateDueDate(new Date(issueDate), paymentTerms)

    if (editingInvoice) {
      const updated: Invoice = {
        ...editingInvoice,
        client_id: selectedClientId,
        client: selectedClient,
        issue_date: issueDate,
        due_date: dueDate.toISOString().split('T')[0],
        payment_terms: paymentTerms,
        line_items: lineItems,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes,
        terms,
        updated_at: now,
      }
      updateInvoice(updated)
      toast.success('Invoice updated')
    } else {
      const newInvoice: Invoice = {
        id: generateToken(16),
        invoice_number: generateInvoiceNumber(),
        client_id: selectedClientId,
        client: selectedClient,
        status: 'draft',
        issue_date: issueDate,
        due_date: dueDate.toISOString().split('T')[0],
        payment_terms: paymentTerms,
        line_items: lineItems,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes,
        terms,
        created_at: now,
        updated_at: now,
      }
      addInvoice(newInvoice)
      toast.success('Invoice created')
    }

    setShowModal(false)
    resetForm()
  }

  const handleStatusChange = (invoice: Invoice, newStatus: Invoice['status']) => {
    const updated = { ...invoice, status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'paid') {
      updated.paid_date = new Date().toISOString().split('T')[0]
      updated.paid_amount = invoice.total
    }
    updateInvoice(updated)
    // Update localStorage
    const updatedInvoices = invoices.map((i) => (i.id === invoice.id ? updated : i))
    localStorage.setItem('billing_invoices', JSON.stringify(updatedInvoices))
    toast.success(`Invoice marked as ${newStatus}`)
  }

  const handleDelete = (invoice: Invoice) => {
    if (confirm(`Delete invoice ${invoice.invoice_number}?`)) {
      deleteInvoice(invoice.id)
      const updatedInvoices = invoices.filter((i) => i.id !== invoice.id)
      localStorage.setItem('billing_invoices', JSON.stringify(updatedInvoices))
      toast.success('Invoice deleted')
    }
  }

  const exportToPDF = (invoice: Invoice) => {
    const doc = new jsPDF()
    const client = clients.find((c) => c.id === invoice.client_id)

    // Header
    doc.setFillColor(26, 26, 26)
    doc.rect(0, 0, 220, 40, 'F')

    doc.setTextColor(201, 168, 108)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 20, 25)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text(invoice.invoice_number, 20, 33)

    // Company info (right side of header)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Ace Noir Cleaning Services', 190, 15, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Professional Janitorial Services', 190, 22, { align: 'right' })
    doc.text('acenoircleaning@example.com', 190, 28, { align: 'right' })
    doc.text('(555) 123-4567', 190, 34, { align: 'right' })

    // Reset text color
    doc.setTextColor(0, 0, 0)

    // Bill To section
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', 20, 55)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    if (client) {
      doc.text(client.company_name, 20, 62)
      doc.text(client.contact_name, 20, 68)
      doc.text(client.address, 20, 74)
      doc.text(`${client.city}, ${client.state} ${client.zip_code}`, 20, 80)
      doc.text(client.email, 20, 86)
    }

    // Invoice details (right side)
    doc.setFontSize(10)
    doc.text('Issue Date:', 130, 55)
    doc.text(formatDate(invoice.issue_date), 170, 55)
    doc.text('Due Date:', 130, 62)
    doc.text(formatDate(invoice.due_date), 170, 62)
    doc.text('Terms:', 130, 69)
    doc.text(PAYMENT_TERMS_LABELS[invoice.payment_terms], 170, 69)

    // Status badge
    const statusConfig = INVOICE_STATUS_CONFIG[invoice.status]
    doc.setFillColor(invoice.status === 'paid' ? 34 : invoice.status === 'overdue' ? 220 : 100,
                     invoice.status === 'paid' ? 197 : invoice.status === 'overdue' ? 38 : 100,
                     invoice.status === 'paid' ? 94 : invoice.status === 'overdue' ? 38 : 100)
    doc.roundedRect(130, 73, 30, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    doc.text(statusConfig.label.toUpperCase(), 145, 78.5, { align: 'center' })
    doc.setTextColor(0, 0, 0)

    // Line items table
    const tableData = invoice.line_items.map((item) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total),
    ])

    autoTable(doc, {
      startY: 95,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [26, 26, 26],
        textColor: [201, 168, 108],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
    })

    // Get the final Y position after the table
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // Totals
    doc.setFontSize(10)
    doc.text('Subtotal:', 140, finalY)
    doc.text(formatCurrency(invoice.subtotal), 190, finalY, { align: 'right' })

    if (invoice.tax_rate > 0) {
      doc.text(`Tax (${invoice.tax_rate}%):`, 140, finalY + 7)
      doc.text(formatCurrency(invoice.tax_amount), 190, finalY + 7, { align: 'right' })
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total:', 140, finalY + (invoice.tax_rate > 0 ? 17 : 10))
    doc.text(formatCurrency(invoice.total), 190, finalY + (invoice.tax_rate > 0 ? 17 : 10), { align: 'right' })

    // Notes and terms
    if (invoice.notes || invoice.terms) {
      const notesY = finalY + (invoice.tax_rate > 0 ? 30 : 23)

      if (invoice.notes) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text('Notes:', 20, notesY)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const splitNotes = doc.splitTextToSize(invoice.notes, 80)
        doc.text(splitNotes, 20, notesY + 5)
      }

      if (invoice.terms) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text('Terms & Conditions:', 110, notesY)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        const splitTerms = doc.splitTextToSize(invoice.terms, 80)
        doc.text(splitTerms, 110, notesY + 5)
      }
    }

    // Footer
    doc.setFillColor(26, 26, 26)
    doc.rect(0, 280, 220, 20, 'F')
    doc.setTextColor(201, 168, 108)
    doc.setFontSize(9)
    doc.text('Thank you for your business!', 105, 290, { align: 'center' })

    doc.save(`${invoice.invoice_number}.pdf`)
    toast.success('Invoice exported to PDF')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ace-black">Invoices</h1>
          <p className="text-gray-600 mt-1">Create and manage invoices for your clients</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input w-full sm:w-48"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="card">
          <div className="p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first invoice to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button onClick={() => openModal()} className="btn-primary">
                Create Your First Invoice
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Issue Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice) => {
                  const client = clients.find((c) => c.id === invoice.client_id)
                  const statusConfig = INVOICE_STATUS_CONFIG[invoice.status]
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-ace-black">{invoice.invoice_number}</td>
                      <td className="px-4 py-3 text-gray-600">{client?.company_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(invoice.issue_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(invoice.due_date)}</td>
                      <td className="px-4 py-3 font-semibold text-ace-black">{formatCurrency(invoice.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statusConfig.color}`}>{statusConfig.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setPreviewInvoice(invoice)
                              setShowPreview(true)
                            }}
                            className="p-1.5 text-gray-400 hover:text-ace-gold rounded"
                            title="Preview"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(invoice)}
                            className="p-1.5 text-gray-400 hover:text-ace-gold rounded"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportToPDF(invoice)}
                            className="p-1.5 text-gray-400 hover:text-ace-gold rounded"
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() => handleStatusChange(invoice, 'sent')}
                              className="p-1.5 text-gray-400 hover:text-blue-500 rounded"
                              title="Mark as Sent"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          )}
                          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <button
                              onClick={() => handleStatusChange(invoice, 'paid')}
                              className="p-1.5 text-gray-400 hover:text-green-500 rounded"
                              title="Mark as Paid"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(invoice)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">
                {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-6">
              {/* Client & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Client *</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)}
                    className="form-input"
                  >
                    {Object.entries(PAYMENT_TERMS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Add Services */}
              <div>
                <label className="form-label">Quick Add Service</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SERVICE_CATEGORIES).map(([category, label]) => (
                    <div key={category} className="relative group">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-ace-gold/20 rounded-lg transition-colors"
                      >
                        {label}
                      </button>
                      <div className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 hidden group-hover:block min-w-[250px]">
                        {CLEANING_SERVICES.filter((s) => s.category === category).map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => addServiceItem(service.id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex justify-between items-center"
                          >
                            <span>{service.name}</span>
                            <span className="text-gray-500">{formatCurrency(service.default_rate)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Line Items</label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-sm text-ace-gold hover:text-ace-gold-dark flex items-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Custom Item
                  </button>
                </div>

                {lineItems.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No items added yet. Use quick add or add a custom item.</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Description</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 w-20">Qty</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 w-28">Rate</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 w-28">Total</th>
                          <th className="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lineItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Description"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-sm text-right"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {formatCurrency(item.total)}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeLineItem(item.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tax Rate (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border rounded text-sm text-right"
                    />
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax Amount</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span className="text-ace-gold-dark">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="form-input"
                    rows={3}
                    placeholder="Additional notes for the client..."
                  />
                </div>
                <div>
                  <label className="form-label">Terms & Conditions</label>
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="form-input"
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showPreview && previewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Invoice Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportToPDF(previewInvoice)}
                  className="btn-outline text-sm py-1.5 flex items-center gap-1"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download PDF
                </button>
                <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Invoice Header */}
              <div className="bg-ace-black text-white p-6 rounded-lg mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-ace-gold">INVOICE</h1>
                    <p className="text-gray-400">{previewInvoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="font-bold">Ace Noir Cleaning Services</h2>
                    <p className="text-sm text-gray-400">Professional Janitorial Services</p>
                  </div>
                </div>
              </div>

              {/* Bill To & Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-500 text-sm mb-2">BILL TO</h3>
                  {(() => {
                    const client = clients.find((c) => c.id === previewInvoice.client_id)
                    return client ? (
                      <div className="text-sm">
                        <p className="font-semibold">{client.company_name}</p>
                        <p>{client.contact_name}</p>
                        <p>{client.address}</p>
                        <p>{client.city}, {client.state} {client.zip_code}</p>
                        <p>{client.email}</p>
                      </div>
                    ) : null
                  })()}
                </div>
                <div className="text-right">
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Issue Date:</span> {formatDate(previewInvoice.issue_date)}</p>
                    <p><span className="text-gray-500">Due Date:</span> {formatDate(previewInvoice.due_date)}</p>
                    <p><span className="text-gray-500">Terms:</span> {PAYMENT_TERMS_LABELS[previewInvoice.payment_terms]}</p>
                    <p className="mt-2">
                      <span className={`badge ${INVOICE_STATUS_CONFIG[previewInvoice.status].color}`}>
                        {INVOICE_STATUS_CONFIG[previewInvoice.status].label}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-ace-black">
                    <th className="py-2 text-left text-sm font-semibold">Description</th>
                    <th className="py-2 text-center text-sm font-semibold w-16">Qty</th>
                    <th className="py-2 text-right text-sm font-semibold w-24">Rate</th>
                    <th className="py-2 text-right text-sm font-semibold w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.line_items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 text-sm">{item.description}</td>
                      <td className="py-3 text-sm text-center">{item.quantity}</td>
                      <td className="py-3 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-6">
                <div className="w-64">
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(previewInvoice.subtotal)}</span>
                  </div>
                  {previewInvoice.tax_rate > 0 && (
                    <div className="flex justify-between py-1 text-sm">
                      <span className="text-gray-600">Tax ({previewInvoice.tax_rate}%)</span>
                      <span>{formatCurrency(previewInvoice.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t-2 border-ace-black font-bold">
                    <span>Total</span>
                    <span className="text-ace-gold-dark">{formatCurrency(previewInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              {(previewInvoice.notes || previewInvoice.terms) && (
                <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                  {previewInvoice.notes && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-600">{previewInvoice.notes}</p>
                    </div>
                  )}
                  {previewInvoice.terms && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-500 mb-1">Terms & Conditions</h4>
                      <p className="text-sm text-gray-600">{previewInvoice.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
