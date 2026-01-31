// Enum types (mirroring Prisma schema)
export type UserRole = 'OWNER' | 'ADMIN' | 'DISPATCHER' | 'DRIVER';
export type Plan = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type LoadOfferSource = 'EMAIL' | 'PHONE' | 'MANUAL' | 'API';
export type LoadOfferStatus = 'NEW' | 'PENDING' | 'ACCEPTED' | 'DENIED' | 'EXPIRED';
export type IntegrationStatus = 'PENDING' | 'ACTIVE' | 'ERROR' | 'DISABLED';
export type EmailProvider = 'SENDGRID' | 'MAILGUN' | 'AWS_SES' | 'GMAIL' | 'OUTLOOK';
export type TelephonyProvider = 'TWILIO' | 'VONAGE' | 'BANDWIDTH';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'VOICE';
export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
export type MileageSource = 'MANUAL' | 'GPS' | 'IMPORT';
export type AuditAction =
  | 'LOGIN'
  | 'LOAD_ACCEPTED'
  | 'LOAD_DENIED'
  | 'INTEGRATION_ADDED'
  | 'INTEGRATION_UPDATED'
  | 'INTEGRATION_REMOVED'
  | 'GPS_ENABLED'
  | 'GPS_DISABLED'
  | 'USER_INVITED'
  | 'USER_REMOVED'
  | 'DRIVER_ADDED'
  | 'DRIVER_REMOVED'
  | 'SETTINGS_UPDATED';

// API Request/Response types
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

export interface InviteUserData {
  email: string;
  name: string;
  role: 'ADMIN' | 'DISPATCHER' | 'DRIVER';
}

// Load offer types
export interface ExtractedLoadFields {
  pickup?: {
    location?: string;
    date?: string;
    time?: string;
    contact?: string;
  };
  dropoff?: {
    location?: string;
    date?: string;
    time?: string;
    contact?: string;
  };
  rate?: {
    amount?: number;
    currency?: string;
    type?: 'flat' | 'per_mile';
  };
  equipment?: string;
  weight?: string;
  distance?: string;
  referenceNumber?: string;
  notes?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface LoadOfferFilters {
  status?: string;
  sourceType?: string;
  search?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

// GPS types
export interface GpsPosition {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

export interface DriverLocation {
  driverId: string;
  driverName: string;
  truckId?: string;
  position: GpsPosition;
  isActive: boolean;
  sessionId?: string;
}

// Email ingest types
export interface InboundEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  headers: Record<string, string>;
  attachments?: {
    filename: string;
    contentType: string;
    content: string; // base64
  }[];
}

// Phone call types
export interface CallTranscript {
  segments: {
    speaker: 'AI' | 'CALLER';
    text: string;
    timestamp: number;
  }[];
  summary?: string;
  extractedData?: ExtractedLoadFields;
}

// Dashboard stats
export interface DashboardStats {
  totalLoads: number;
  newLoads: number;
  acceptedLoads: number;
  deniedLoads: number;
  activeDrivers: number;
  totalMilesThisMonth: number;
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'xlsx';
  dateRange?: {
    start: string;
    end: string;
  };
  includeFields?: string[];
}
