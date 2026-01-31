import type {
  Company,
  Driver,
  EmailIntegration,
  GpsPoint,
  GpsSession,
  LoadOffer,
  MileageLog,
  Notification,
  Tag,
  TelephonyIntegration,
  User,
} from '@prisma/client';

// Re-export Prisma enums
export {
  UserRole,
  Plan,
  LoadOfferSource,
  LoadOfferStatus,
  IntegrationStatus,
  EmailProvider,
  TelephonyProvider,
  NotificationChannel,
  NotificationStatus,
  MileageSource,
  AuditAction,
} from '@prisma/client';

// Extended types with relations
export type UserWithCompany = User & {
  company: Company;
};

export type DriverWithUser = Driver & {
  user: User | null;
};

export type LoadOfferWithRelations = LoadOffer & {
  decidedBy: User | null;
  assignedDriver: Driver | null;
  tags: { tag: Tag }[];
};

export type GpsSessionWithPoints = GpsSession & {
  driver: Driver;
  points: GpsPoint[];
};

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
