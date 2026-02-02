// User Types
export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface UserInvite {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

// Facility Types
export interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Time Tracking Types
export interface TimeEntry {
  id: string;
  user_id: string;
  facility_id?: string;
  clock_in: string;
  clock_out?: string;
  clock_in_latitude?: number;
  clock_in_longitude?: number;
  clock_out_latitude?: number;
  clock_out_longitude?: number;
  clock_in_address?: string;
  clock_out_address?: string;
  total_hours?: number;
  notes?: string;
  status: 'active' | 'completed' | 'edited' | 'approved';
  edited_by?: string;
  edit_reason?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: User;
  facility?: Facility;
}

// Pay Period Types
export interface PayPeriod {
  id: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed' | 'processed';
  created_at: string;
  updated_at: string;
}

export interface Timesheet {
  user_id: string;
  user: User;
  pay_period: PayPeriod;
  entries: TimeEntry[];
  total_hours: number;
  total_pay: number;
}

// Schedule Types
export interface ScheduleAssignment {
  id: string;
  facility_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Joined data
  user?: User;
  facility?: Facility;
}

// Messaging Types
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined data
  participants?: ConversationParticipant[];
  last_message?: Message;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string;
  // Joined data
  user?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  sender?: User;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'schedule' | 'timesheet' | 'system';
  title: string;
  content: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// Export Types
export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  pay_period_id?: string;
  user_ids?: string[];
  include_details?: boolean;
}

// Client Types (for billing)
export interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Cleaning Services Types
export type ServiceCategory = 'standard' | 'deep_clean' | 'specialty' | 'recurring';

export interface CleaningService {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  default_rate: number;
  unit: 'hourly' | 'flat' | 'per_sqft';
  is_active: boolean;
}

// Invoice Types
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentTerms = 'due_on_receipt' | 'net_15' | 'net_30' | 'net_45' | 'net_60';

export interface InvoiceLineItem {
  id: string;
  service_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  client?: Client;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  payment_terms: PaymentTerms;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  terms?: string;
  paid_date?: string;
  paid_amount?: number;
  created_at: string;
  updated_at: string;
}

// Receipt Types
export type PaymentMethod = 'cash' | 'check' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'other';

export interface Receipt {
  id: string;
  receipt_number: string;
  invoice_id?: string;
  invoice?: Invoice;
  client_id: string;
  client?: Client;
  payment_date: string;
  payment_method: PaymentMethod;
  amount: number;
  reference_number?: string;
  notes?: string;
  line_items: InvoiceLineItem[];
  created_at: string;
  updated_at: string;
}

// Billing Dashboard Stats
export interface BillingStats {
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  invoices_count: number;
  receipts_count: number;
  clients_count: number;
}
