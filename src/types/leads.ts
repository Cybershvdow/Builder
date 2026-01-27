// Lead Generation Workflow Types

// ============================================
// Enums
// ============================================

export type LeadStatus =
  | 'NEW'
  | 'ENRICHING'
  | 'ENRICHED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EMAILING'
  | 'EMAILED'
  | 'BOUNCED'
  | 'REPLIED'
  | 'ERROR';

export type QualifyDecision = 'PENDING' | 'APPROVE' | 'REJECT';

export type OutreachStatus =
  | 'PENDING'
  | 'READY_TO_CALL'
  | 'EMAILED'
  | 'BOUNCED'
  | 'REPLIED'
  | 'DO_NOT_CONTACT';

export type WorkflowStep =
  | 'SCRAPE'
  | 'NORMALIZE'
  | 'SYNC_SHEETS'
  | 'ENRICH'
  | 'EMAIL'
  | 'COMPLETE';

export type WorkflowStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

// ============================================
// Form Input Types
// ============================================

export interface WorkflowFormInput {
  business_type: string;
  city: string;
  zip_code?: string;
  radius_miles: 5 | 10 | 15 | 20 | 30 | 50;
  max_results?: number;
  campaign_name?: string;
  send_emails?: boolean;
}

export interface WorkflowFormValidationErrors {
  business_type?: string;
  city?: string;
  zip_code?: string;
  radius_miles?: string;
  max_results?: string;
}

// ============================================
// Appify API Types
// ============================================

export interface AppifySearchRequest {
  query: string;
  location?: string;
  radius?: number;
  zoom?: number;
  maxResults?: number;
  cursor?: string;
}

export interface AppifyBusinessResult {
  // These fields may vary based on actual Appify API
  // Keeping all possible fields to maximize coverage
  placeId?: string;
  googleId?: string;
  name: string;
  address?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  email?: string;
  category?: string;
  categories?: string[];
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
  hours?: Record<string, string>;
  isOpen?: boolean;
  openStatus?: string;
  description?: string;
  services?: string[];
  photos?: string[];
  hasBooking?: boolean;
  bookingUrl?: string;
  url?: string;
  mapsUrl?: string;
  [key: string]: unknown; // Capture any additional fields
}

export interface AppifyResponse {
  success: boolean;
  data: AppifyBusinessResult[];
  cursor?: string;
  hasMore?: boolean;
  totalResults?: number;
  error?: string;
}

// ============================================
// Lead Types
// ============================================

export interface Lead {
  id: string;
  lead_id: string;

  // Source tracking
  source: string;
  campaign_name?: string;
  business_type?: string;
  search_city?: string;
  search_zip?: string;
  radius_miles?: number;

  // Identity
  business_name: string;
  place_id?: string;
  google_id?: string;
  listing_url?: string;

  // Location
  address_full?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;

  // Contact
  phone?: string;
  phone_normalized?: string;
  website?: string;
  domain?: string;
  email?: string;

  // Business attributes
  category_primary?: string;
  categories_all?: string[];
  rating?: number;
  review_count?: number;
  price_level?: string;
  hours?: Record<string, string>;
  open_status?: string;
  description?: string;
  services?: string[];
  photos?: string[];
  has_booking?: boolean;
  appointment_url?: string;

  // Status tracking
  status: LeadStatus;
  qualify_decision: QualifyDecision;
  qualify_notes?: string;

  // Enrichment data
  contact_name?: string;
  contact_role?: string;
  contact_email?: string;
  email_confidence?: number;
  personalization_summary?: string;
  enrichment_source?: string;

  // Email tracking
  email_sent_at?: string;
  email_opened_at?: string;
  email_clicked_at?: string;
  email_bounced_at?: string;
  email_replied_at?: string;
  email_subject?: string;
  email_body?: string;

  // Raw data
  raw_json: Record<string, unknown>;

  // Audit
  scraped_at: string;
  enriched_at?: string;
  last_synced_to_sheets_at?: string;
  error_message?: string;
  update_history?: Array<{
    timestamp: string;
    changes: Record<string, { from: string; to: string }>;
  }>;

  created_at: string;
  updated_at: string;
}

export interface LeadInsert
  extends Omit<Lead, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

export interface LeadUpdate extends Partial<LeadInsert> {
  lead_id: string;
}

// ============================================
// Workflow Run Types
// ============================================

export interface WorkflowRun {
  id: string;

  // Input parameters
  business_type: string;
  city: string;
  zip_code?: string;
  radius_miles: number;
  max_results: number;
  campaign_name?: string;
  send_emails: boolean;

  // Status
  status: WorkflowStatus;
  current_step?: WorkflowStep;

  // Progress tracking
  checkpoint?: {
    step: WorkflowStep;
    cursor?: string;
    processed_count: number;
    last_lead_id?: string;
  };

  // Stats
  total_fetched: number;
  total_inserted: number;
  total_updated: number;
  total_deduped: number;
  total_approved: number;
  total_enriched: number;
  total_emailed: number;
  errors: Array<{
    step: string;
    message: string;
    lead_id?: string;
    timestamp: string;
  }>;

  // Timing
  started_at: string;
  completed_at?: string;

  created_at: string;
  updated_at: string;
}

export interface WorkflowRunSummary {
  run_id: string;
  status: WorkflowStatus;
  total_fetched: number;
  total_inserted: number;
  total_updated: number;
  total_deduped: number;
  total_approved: number;
  total_enriched: number;
  total_emailed: number;
  errors: Array<{ step: string; message: string }>;
  duration_seconds: number;
}

// ============================================
// Enrichment Types
// ============================================

export interface EnrichmentResult {
  emails: Array<{
    email: string;
    confidence: number;
    source: string;
    type?: 'personal' | 'generic' | 'support';
  }>;
  contacts: Array<{
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  }>;
  social_profiles?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface EnrichmentCache {
  id: string;
  domain: string;
  emails: EnrichmentResult['emails'];
  contacts: EnrichmentResult['contacts'];
  social_profiles?: EnrichmentResult['social_profiles'];
  source: string;
  confidence: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// Email Types
// ============================================

export interface EmailTemplate {
  subject: string;
  body_html: string;
  body_text: string;
}

export interface EmailSendRequest {
  lead_id: string;
  to_email: string;
  template: EmailTemplate;
}

export interface EmailLog {
  id: string;
  lead_id?: string;
  to_email: string;
  from_email: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  provider: 'RESEND' | 'SENDGRID';
  provider_message_id?: string;
  status: 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'COMPLAINED';
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  bounce_type?: 'HARD' | 'SOFT';
  bounce_reason?: string;
  created_at: string;
}

export interface EmailBlacklist {
  id: string;
  email: string;
  domain?: string;
  reason: 'HARD_BOUNCE' | 'SOFT_BOUNCE' | 'UNSUBSCRIBE' | 'COMPLAINT' | 'MANUAL';
  created_at: string;
}

// ============================================
// Google Sheets Types
// ============================================

export interface SheetsColumnMapping {
  db_column: string;
  sheet_column: string;
  sheet_index: number;
}

export interface SheetsSyncConfig {
  spreadsheet_id: string;
  leads_raw_sheet: string;
  leads_qualified_sheet: string;
  column_mapping: SheetsColumnMapping[];
}

export interface SheetsSyncResult {
  rows_synced: number;
  rows_updated: number;
  qualification_changes: number;
  errors: string[];
}

// ============================================
// Utility Types
// ============================================

export interface NormalizedLead {
  lead_id: string;
  business_name: string;
  place_id?: string;
  google_id?: string;
  listing_url?: string;
  address_full?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  phone_normalized?: string;
  website?: string;
  domain?: string;
  email?: string;
  category_primary?: string;
  categories_all?: string[];
  rating?: number;
  review_count?: number;
  price_level?: string;
  hours?: Record<string, string>;
  open_status?: string;
  description?: string;
  services?: string[];
  photos?: string[];
  has_booking?: boolean;
  appointment_url?: string;
  raw_json: Record<string, unknown>;
}

export interface DedupeResult {
  action: 'INSERT' | 'UPDATE' | 'SKIP';
  lead_id: string;
  existing_id?: string;
  merged_fields?: string[];
}

export interface RetryConfig {
  max_retries: number;
  base_delay_ms: number;
  max_delay_ms: number;
}

// ============================================
// Config Types
// ============================================

export interface LeadWorkflowConfig {
  appify: {
    api_key: string;
    endpoint_url: string;
    rate_limit_per_minute: number;
  };
  sheets: {
    credentials: string; // JSON string of service account
    spreadsheet_id: string;
  };
  enrichment: {
    hunter_api_key?: string;
    apollo_api_key?: string;
    cache_ttl_hours: number;
    max_pages_to_crawl: number;
  };
  email: {
    provider: 'RESEND' | 'SENDGRID';
    from_email: string;
    from_name: string;
    daily_limit: number;
    min_confidence: number;
  };
  workflow: {
    batch_size: number;
    enrichment_concurrency: number;
    retry: RetryConfig;
  };
}
