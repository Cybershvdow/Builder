import type { CleaningService } from '@/types'

// Pre-defined cleaning services for janitorial businesses
export const CLEANING_SERVICES: CleaningService[] = [
  // Standard Cleaning Services
  {
    id: 'standard-office',
    name: 'Standard Office Cleaning',
    description: 'Regular office cleaning including dusting, vacuuming, mopping, and trash removal',
    category: 'standard',
    default_rate: 45,
    unit: 'hourly',
    is_active: true,
  },
  {
    id: 'standard-restroom',
    name: 'Restroom Cleaning & Sanitization',
    description: 'Complete restroom cleaning, disinfection, and restocking supplies',
    category: 'standard',
    default_rate: 35,
    unit: 'hourly',
    is_active: true,
  },
  {
    id: 'standard-break-room',
    name: 'Break Room / Kitchen Cleaning',
    description: 'Kitchen and break room cleaning including appliances, counters, and floors',
    category: 'standard',
    default_rate: 40,
    unit: 'hourly',
    is_active: true,
  },
  {
    id: 'standard-trash',
    name: 'Trash Removal & Recycling',
    description: 'Emptying all trash cans, replacing liners, and separating recyclables',
    category: 'standard',
    default_rate: 25,
    unit: 'hourly',
    is_active: true,
  },

  // Deep Cleaning Services
  {
    id: 'deep-carpet',
    name: 'Carpet Deep Cleaning',
    description: 'Professional carpet extraction and shampooing',
    category: 'deep_clean',
    default_rate: 0.25,
    unit: 'per_sqft',
    is_active: true,
  },
  {
    id: 'deep-floor-strip',
    name: 'Floor Strip & Wax',
    description: 'Strip old wax, clean, and apply new finish to hard floors',
    category: 'deep_clean',
    default_rate: 0.50,
    unit: 'per_sqft',
    is_active: true,
  },
  {
    id: 'deep-tile-grout',
    name: 'Tile & Grout Cleaning',
    description: 'Deep cleaning and restoration of tile and grout',
    category: 'deep_clean',
    default_rate: 0.35,
    unit: 'per_sqft',
    is_active: true,
  },
  {
    id: 'deep-construction',
    name: 'Post-Construction Cleaning',
    description: 'Thorough cleaning after construction or renovation projects',
    category: 'deep_clean',
    default_rate: 75,
    unit: 'hourly',
    is_active: true,
  },

  // Specialty Services
  {
    id: 'specialty-window',
    name: 'Window Cleaning (Interior)',
    description: 'Interior window cleaning including sills and frames',
    category: 'specialty',
    default_rate: 8,
    unit: 'flat',
    is_active: true,
  },
  {
    id: 'specialty-window-ext',
    name: 'Window Cleaning (Exterior)',
    description: 'Exterior window cleaning with proper safety equipment',
    category: 'specialty',
    default_rate: 12,
    unit: 'flat',
    is_active: true,
  },
  {
    id: 'specialty-pressure',
    name: 'Pressure Washing',
    description: 'Pressure washing for sidewalks, parking lots, and building exteriors',
    category: 'specialty',
    default_rate: 0.15,
    unit: 'per_sqft',
    is_active: true,
  },
  {
    id: 'specialty-disinfection',
    name: 'Electrostatic Disinfection',
    description: 'Hospital-grade electrostatic disinfection service',
    category: 'specialty',
    default_rate: 0.10,
    unit: 'per_sqft',
    is_active: true,
  },
  {
    id: 'specialty-upholstery',
    name: 'Upholstery Cleaning',
    description: 'Professional cleaning of office furniture and upholstery',
    category: 'specialty',
    default_rate: 50,
    unit: 'flat',
    is_active: true,
  },

  // Recurring Services
  {
    id: 'recurring-daily',
    name: 'Daily Janitorial Service',
    description: 'Comprehensive daily cleaning package for commercial spaces',
    category: 'recurring',
    default_rate: 150,
    unit: 'flat',
    is_active: true,
  },
  {
    id: 'recurring-weekly',
    name: 'Weekly Cleaning Service',
    description: 'Full weekly cleaning service including all standard tasks',
    category: 'recurring',
    default_rate: 200,
    unit: 'flat',
    is_active: true,
  },
  {
    id: 'recurring-monthly',
    name: 'Monthly Deep Clean',
    description: 'Comprehensive monthly deep cleaning service',
    category: 'recurring',
    default_rate: 500,
    unit: 'flat',
    is_active: true,
  },
]

// Helper function to get services by category
export function getServicesByCategory(category: string): CleaningService[] {
  return CLEANING_SERVICES.filter((s) => s.category === category && s.is_active)
}

// Helper function to get a service by ID
export function getServiceById(id: string): CleaningService | undefined {
  return CLEANING_SERVICES.find((s) => s.id === id)
}

// Category labels for UI
export const SERVICE_CATEGORIES = {
  standard: 'Standard Cleaning',
  deep_clean: 'Deep Cleaning',
  specialty: 'Specialty Services',
  recurring: 'Recurring Services',
}

// Payment terms labels
export const PAYMENT_TERMS_LABELS = {
  due_on_receipt: 'Due on Receipt',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60',
}

// Payment method labels
export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  check: 'Check',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
}

// Invoice status labels and colors
export const INVOICE_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'badge-gray' },
  sent: { label: 'Sent', color: 'badge-blue' },
  paid: { label: 'Paid', color: 'badge-green' },
  overdue: { label: 'Overdue', color: 'badge-red' },
  cancelled: { label: 'Cancelled', color: 'badge-gray' },
}

// Generate invoice/receipt numbers
export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

export function generateReceiptNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `RCP-${year}${month}-${random}`
}

// Calculate due date based on payment terms
export function calculateDueDate(issueDate: Date, terms: string): Date {
  const dueDate = new Date(issueDate)
  switch (terms) {
    case 'net_15':
      dueDate.setDate(dueDate.getDate() + 15)
      break
    case 'net_30':
      dueDate.setDate(dueDate.getDate() + 30)
      break
    case 'net_45':
      dueDate.setDate(dueDate.getDate() + 45)
      break
    case 'net_60':
      dueDate.setDate(dueDate.getDate() + 60)
      break
    default: // due_on_receipt
      break
  }
  return dueDate
}
