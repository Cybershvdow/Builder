'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import type { Receipt, InvoiceLineItem, PaymentMethod } from '@/types'
import { formatCurrency, formatDate, generateToken } from '@/lib/utils'
import {
  CLEANING_SERVICES,
  SERVICE_CATEGORIES,
  PAYMENT_METHOD_LABELS,
  generateReceiptNumber,
} from '@/lib/cleaning-services'
import {
  PlusIcon,
  TrashIcon,
  ReceiptPercentIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReceiptsPage() {
  const { clients, setClients, invoices, setInvoices, receipts, setReceipts, addReceipt, updateReceipt, deleteReceipt } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null)

  // Form state
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('check')
  const [amount, setAmount] = useState(0)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([])

  // Load data from localStorage
  useEffect(() => {
    const savedClients = localStorage.getItem('billing_clients')
    const savedInvoices = localStorage.getItem('billing_invoices')
    const savedReceipts = localStorage.getItem('billing_receipts')
    if (savedClients) setClients(JSON.parse(savedClients))
    if (savedInvoices) setInvoices(JSON.parse(savedInvoices))
    if (savedReceipts) setReceipts(JSON.parse(savedReceipts))
  }, [setClients, setInvoices, setReceipts])

  // Save receipts to localStorage
  useEffect(() => {
    if (receipts.length > 0) {
      localStorage.setItem('billing_receipts', JSON.stringify(receipts))
    }
  }, [receipts])

  // Get paid invoices for the selected client
  const clientInvoices = invoices.filter(
    (inv) => inv.client_id === selectedClientId && inv.status === 'paid'
  )

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId)

  // When invoice is selected, populate line items and amount
  useEffect(() => {
    if (selectedInvoice) {
      setLineItems(selectedInvoice.line_items)
      setAmount(selectedInvoice.total)
    }
  }, [selectedInvoice])

  const filteredReceipts = receipts.filter((receipt) => {
    const client = clients.find((c) => c.id === receipt.client_id)
    return (
      receipt.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const resetForm = () => {
    setSelectedClientId('')
    setSelectedInvoiceId('')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentMethod('check')
    setAmount(0)
    setReferenceNumber('')
    setNotes('')
    setLineItems([])
    setEditingReceipt(null)
  }

  const openModal = (receipt?: Receipt) => {
    if (receipt) {
      setEditingReceipt(receipt)
      setSelectedClientId(receipt.client_id)
      setSelectedInvoiceId(receipt.invoice_id || '')
      setPaymentDate(receipt.payment_date)
      setPaymentMethod(receipt.payment_method)
      setAmount(receipt.amount)
      setReferenceNumber(receipt.reference_number || '')
      setNotes(receipt.notes || '')
      setLineItems(receipt.line_items)
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

  // Calculate total from line items
  const calculatedTotal = lineItems.reduce((sum, item) => sum + item.total, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId) {
      toast.error('Please select a client')
      return
    }

    if (lineItems.length === 0 && !selectedInvoiceId) {
      toast.error('Please add at least one line item or select an invoice')
      return
    }

    const now = new Date().toISOString()
    const finalAmount = selectedInvoiceId ? amount : calculatedTotal

    if (editingReceipt) {
      const updated: Receipt = {
        ...editingReceipt,
        client_id: selectedClientId,
        client: selectedClient,
        invoice_id: selectedInvoiceId || undefined,
        invoice: selectedInvoice,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        amount: finalAmount,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        line_items: lineItems,
        updated_at: now,
      }
      updateReceipt(updated)
      toast.success('Receipt updated')
    } else {
      const newReceipt: Receipt = {
        id: generateToken(16),
        receipt_number: generateReceiptNumber(),
        client_id: selectedClientId,
        client: selectedClient,
        invoice_id: selectedInvoiceId || undefined,
        invoice: selectedInvoice,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        amount: finalAmount,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        line_items: lineItems,
        created_at: now,
        updated_at: now,
      }
      addReceipt(newReceipt)
      toast.success('Receipt created')
    }

    setShowModal(false)
    resetForm()
  }

  const handleDelete = (receipt: Receipt) => {
    if (confirm(`Delete receipt ${receipt.receipt_number}?`)) {
      deleteReceipt(receipt.id)
      const updatedReceipts = receipts.filter((r) => r.id !== receipt.id)
      localStorage.setItem('billing_receipts', JSON.stringify(updatedReceipts))
      toast.success('Receipt deleted')
    }
  }

  const exportToPDF = (receipt: Receipt) => {
    const doc = new jsPDF()
    const client = clients.find((c) => c.id === receipt.client_id)

    // Header with gradient-like effect
    doc.setFillColor(26, 26, 26)
    doc.rect(0, 0, 220, 45, 'F')

    // Checkmark circle
    doc.setFillColor(34, 197, 94)
    doc.circle(30, 22, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text('✓', 26, 27)

    doc.setTextColor(201, 168, 108)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT RECEIPT', 50, 20)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text(receipt.receipt_number, 50, 28)
    doc.setTextColor(34, 197, 94)
    doc.setFontSize(9)
    doc.text('PAYMENT RECEIVED', 50, 36)

    // Company info (right side)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Ace Noir Cleaning Services', 190, 15, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Professional Janitorial Services', 190, 22, { align: 'right' })
    doc.text('acenoircleaning@example.com', 190, 28, { align: 'right' })
    doc.text('(555) 123-4567', 190, 34, { align: 'right' })

    doc.setTextColor(0, 0, 0)

    // Amount Box
    doc.setFillColor(245, 240, 232)
    doc.roundedRect(130, 55, 60, 25, 3, 3, 'F')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('Amount Paid', 160, 63, { align: 'center' })
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 26, 26)
    doc.text(formatCurrency(receipt.amount), 160, 74, { align: 'center' })
    doc.setFont('helvetica', 'normal')

    // Received From section
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Received From:', 20, 60)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    if (client) {
      doc.text(client.company_name, 20, 68)
      doc.text(client.contact_name, 20, 74)
      doc.text(client.address, 20, 80)
      doc.text(`${client.city}, ${client.state} ${client.zip_code}`, 20, 86)
    }

    // Payment Details
    doc.setFontSize(10)
    doc.text('Payment Date:', 20, 100)
    doc.text(formatDate(receipt.payment_date), 70, 100)

    doc.text('Payment Method:', 20, 108)
    doc.text(PAYMENT_METHOD_LABELS[receipt.payment_method], 70, 108)

    if (receipt.reference_number) {
      doc.text('Reference #:', 20, 116)
      doc.text(receipt.reference_number, 70, 116)
    }

    if (receipt.invoice_id) {
      doc.text('Invoice #:', 110, 100)
      const invoice = invoices.find((i) => i.id === receipt.invoice_id)
      doc.text(invoice?.invoice_number || '', 150, 100)
    }

    // Line items table
    const tableData = receipt.line_items.map((item) => [
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unit_price),
      formatCurrency(item.total),
    ])

    autoTable(doc, {
      startY: receipt.reference_number ? 125 : 118,
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

    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    // Total
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total Paid:', 140, finalY)
    doc.setTextColor(34, 197, 94)
    doc.text(formatCurrency(receipt.amount), 190, finalY, { align: 'right' })
    doc.setTextColor(0, 0, 0)

    // Notes
    if (receipt.notes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Notes:', 20, finalY + 15)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const splitNotes = doc.splitTextToSize(receipt.notes, 170)
      doc.text(splitNotes, 20, finalY + 22)
    }

    // Footer
    doc.setFillColor(26, 26, 26)
    doc.rect(0, 280, 220, 20, 'F')
    doc.setTextColor(201, 168, 108)
    doc.setFontSize(9)
    doc.text('Thank you for your payment!', 105, 290, { align: 'center' })

    doc.save(`${receipt.receipt_number}.pdf`)
    toast.success('Receipt exported to PDF')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ace-black">Receipts</h1>
          <p className="text-gray-600 mt-1">Create payment receipts for completed transactions</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Create Receipt
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search receipts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <div className="card">
          <div className="p-12 text-center">
            <ReceiptPercentIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Create your first receipt to get started'}
            </p>
            {!searchQuery && (
              <button onClick={() => openModal()} className="btn-primary">
                Create Your First Receipt
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Receipt #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReceipts.map((receipt) => {
                  const client = clients.find((c) => c.id === receipt.client_id)
                  return (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <span className="font-medium text-ace-black">{receipt.receipt_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{client?.company_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(receipt.payment_date)}</td>
                      <td className="px-4 py-3">
                        <span className="badge badge-gold">{PAYMENT_METHOD_LABELS[receipt.payment_method]}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-600">{formatCurrency(receipt.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setPreviewReceipt(receipt)
                              setShowPreview(true)
                            }}
                            className="p-1.5 text-gray-400 hover:text-ace-gold rounded"
                            title="Preview"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(receipt)}
                            className="p-1.5 text-gray-400 hover:text-ace-gold rounded"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportToPDF(receipt)}
                            className="p-1.5 text-gray-400 hover:text-ace-gold rounded"
                            title="Download PDF"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(receipt)}
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

      {/* Create/Edit Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">
                {editingReceipt ? 'Edit Receipt' : 'Create Payment Receipt'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-6">
              {/* Client & Invoice Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Client *</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value)
                      setSelectedInvoiceId('')
                    }}
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
                  <label className="form-label">Link to Invoice (Optional)</label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="form-input"
                    disabled={!selectedClientId}
                  >
                    <option value="">No invoice linked</option>
                    {clientInvoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {formatCurrency(invoice.total)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Payment Method *</label>
                  <select
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="form-input"
                  >
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Reference # (Check/Trans.)</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="form-input"
                    placeholder="e.g., Check #1234"
                  />
                </div>
              </div>

              {/* Line Items - only show if no invoice linked */}
              {!selectedInvoiceId && (
                <>
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

                  {/* Line Items Table */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label mb-0">Services / Items</label>
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
                        <p className="text-gray-500">No items added. Use quick add or add a custom item.</p>
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
                </>
              )}

              {/* Amount Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-green-700">Payment Amount</p>
                      {selectedInvoiceId && (
                        <p className="text-xs text-green-600">From Invoice {selectedInvoice?.invoice_number}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(selectedInvoiceId ? amount : calculatedTotal)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingReceipt ? 'Update Receipt' : 'Create Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showPreview && previewReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Receipt Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportToPDF(previewReceipt)}
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
              {/* Receipt Header */}
              <div className="bg-ace-black text-white p-6 rounded-lg mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-ace-gold">PAYMENT RECEIPT</h1>
                    <p className="text-gray-400">{previewReceipt.receipt_number}</p>
                  </div>
                </div>
                <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded inline-block text-sm font-medium">
                  PAYMENT RECEIVED
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-ace-cream p-4 rounded-lg mb-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
                <p className="text-3xl font-bold text-ace-black">{formatCurrency(previewReceipt.amount)}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
                <div>
                  <h3 className="font-semibold text-gray-500 text-xs mb-2">RECEIVED FROM</h3>
                  {(() => {
                    const client = clients.find((c) => c.id === previewReceipt.client_id)
                    return client ? (
                      <div>
                        <p className="font-semibold">{client.company_name}</p>
                        <p className="text-gray-600">{client.contact_name}</p>
                        <p className="text-gray-600">{client.email}</p>
                      </div>
                    ) : null
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500 text-xs mb-2">PAYMENT DETAILS</h3>
                  <p><span className="text-gray-500">Date:</span> {formatDate(previewReceipt.payment_date)}</p>
                  <p><span className="text-gray-500">Method:</span> {PAYMENT_METHOD_LABELS[previewReceipt.payment_method]}</p>
                  {previewReceipt.reference_number && (
                    <p><span className="text-gray-500">Ref #:</span> {previewReceipt.reference_number}</p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <table className="w-full mb-6 text-sm">
                <thead>
                  <tr className="border-b-2 border-ace-black">
                    <th className="py-2 text-left font-semibold">Description</th>
                    <th className="py-2 text-right font-semibold w-20">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewReceipt.line_items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-2 font-bold">Total Paid</td>
                    <td className="py-2 text-right font-bold text-green-600">{formatCurrency(previewReceipt.amount)}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Notes */}
              {previewReceipt.notes && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm text-gray-500 mb-1">Notes</h4>
                  <p className="text-sm text-gray-600">{previewReceipt.notes}</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-ace-gold font-medium">Thank you for your payment!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
