-- Lead Generation Workflow Schema
-- Optimized for deduplication, qualification, enrichment, and outreach

-- Enum types for status tracking
CREATE TYPE lead_status AS ENUM (
  'NEW',
  'ENRICHING',
  'ENRICHED',
  'APPROVED',
  'REJECTED',
  'EMAILING',
  'EMAILED',
  'BOUNCED',
  'REPLIED',
  'ERROR'
);

CREATE TYPE qualify_decision AS ENUM (
  'PENDING',
  'APPROVE',
  'REJECT'
);

CREATE TYPE outreach_status AS ENUM (
  'PENDING',
  'READY_TO_CALL',
  'EMAILED',
  'BOUNCED',
  'REPLIED',
  'DO_NOT_CONTACT'
);

-- Main leads table (source of truth)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT UNIQUE NOT NULL, -- Stable hash for deduplication

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'APPIFY_GOOGLE_SCRAPER',
  campaign_name TEXT,
  business_type TEXT,
  search_city TEXT,
  search_zip TEXT,
  radius_miles INTEGER,

  -- Identity
  business_name TEXT NOT NULL,
  place_id TEXT,
  google_id TEXT,
  listing_url TEXT,

  -- Location
  address_full TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),

  -- Contact
  phone TEXT,
  phone_normalized TEXT, -- E.164 format
  website TEXT,
  domain TEXT, -- Extracted from website
  email TEXT, -- From scraper (if available)

  -- Business attributes
  category_primary TEXT,
  categories_all JSONB, -- Array of categories
  rating DECIMAL(2, 1),
  review_count INTEGER,
  price_level TEXT,
  hours JSONB, -- Structured hours data
  open_status TEXT,
  description TEXT,
  services JSONB, -- Array of services
  photos JSONB, -- Array of photo URLs
  has_booking BOOLEAN,
  appointment_url TEXT,

  -- Status tracking
  status lead_status NOT NULL DEFAULT 'NEW',
  qualify_decision qualify_decision NOT NULL DEFAULT 'PENDING',
  qualify_notes TEXT,

  -- Enrichment data
  contact_name TEXT,
  contact_role TEXT,
  contact_email TEXT, -- Enriched email
  email_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  personalization_summary TEXT,
  enrichment_source TEXT, -- 'CRAWL', 'HUNTER', 'APOLLO', etc.

  -- Email tracking
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,
  email_bounced_at TIMESTAMPTZ,
  email_replied_at TIMESTAMPTZ,
  email_subject TEXT,
  email_body TEXT,

  -- Raw data preservation
  raw_json JSONB NOT NULL, -- Full Appify response

  -- Audit trail
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enriched_at TIMESTAMPTZ,
  last_synced_to_sheets_at TIMESTAMPTZ,
  error_message TEXT,
  update_history JSONB DEFAULT '[]'::JSONB, -- Track changes

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups and deduplication
CREATE INDEX idx_leads_lead_id ON leads(lead_id);
CREATE INDEX idx_leads_place_id ON leads(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX idx_leads_phone_normalized ON leads(phone_normalized) WHERE phone_normalized IS NOT NULL;
CREATE INDEX idx_leads_domain ON leads(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_qualify_decision ON leads(qualify_decision);
CREATE INDEX idx_leads_campaign ON leads(campaign_name) WHERE campaign_name IS NOT NULL;
CREATE INDEX idx_leads_business_type ON leads(business_type);
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Full text search on business name
CREATE INDEX idx_leads_business_name_trgm ON leads USING gin(business_name gin_trgm_ops);

-- Workflow runs table (track each execution)
CREATE TABLE lead_workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input parameters
  business_type TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT,
  radius_miles INTEGER NOT NULL,
  max_results INTEGER NOT NULL DEFAULT 100,
  campaign_name TEXT,
  send_emails BOOLEAN NOT NULL DEFAULT FALSE,

  -- Status
  status TEXT NOT NULL DEFAULT 'RUNNING', -- RUNNING, COMPLETED, FAILED, PARTIAL
  current_step TEXT, -- SCRAPE, NORMALIZE, SYNC_SHEETS, ENRICH, EMAIL, COMPLETE

  -- Progress tracking
  checkpoint JSONB, -- Resume point if interrupted

  -- Stats
  total_fetched INTEGER DEFAULT 0,
  total_inserted INTEGER DEFAULT 0,
  total_updated INTEGER DEFAULT 0,
  total_deduped INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  total_enriched INTEGER DEFAULT 0,
  total_emailed INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::JSONB,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_runs_status ON lead_workflow_runs(status);
CREATE INDEX idx_workflow_runs_campaign ON lead_workflow_runs(campaign_name);

-- Raw imports table (preserve original API responses)
CREATE TABLE lead_raw_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID REFERENCES lead_workflow_runs(id) ON DELETE CASCADE,

  -- Pagination tracking
  page_number INTEGER,
  cursor TEXT,

  -- Raw data
  raw_response JSONB NOT NULL,
  record_count INTEGER,

  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raw_imports_workflow ON lead_raw_imports(workflow_run_id);
CREATE INDEX idx_raw_imports_processed ON lead_raw_imports(processed);

-- Enrichment cache (don't re-crawl same domains)
CREATE TABLE lead_enrichment_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,

  -- Cached results
  emails JSONB, -- Array of found emails
  contacts JSONB, -- Array of contact info
  social_profiles JSONB,

  -- Source info
  source TEXT, -- 'CRAWL', 'HUNTER', 'APOLLO'
  confidence DECIMAL(3, 2),

  -- TTL management
  expires_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_enrichment_cache_domain ON lead_enrichment_cache(domain);
CREATE INDEX idx_enrichment_cache_expires ON lead_enrichment_cache(expires_at);

-- Email send log (for rate limiting and tracking)
CREATE TABLE lead_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Email details
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,

  -- Provider info
  provider TEXT NOT NULL, -- 'RESEND', 'SENDGRID'
  provider_message_id TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'SENT', -- SENT, DELIVERED, OPENED, CLICKED, BOUNCED, COMPLAINED

  -- Events
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_type TEXT, -- 'HARD', 'SOFT'
  bounce_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_log_lead ON lead_email_log(lead_id);
CREATE INDEX idx_email_log_to ON lead_email_log(to_email);
CREATE INDEX idx_email_log_status ON lead_email_log(status);
CREATE INDEX idx_email_log_sent_at ON lead_email_log(sent_at DESC);

-- Email blacklist (bounced/unsubscribed emails)
CREATE TABLE lead_email_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  domain TEXT,
  reason TEXT NOT NULL, -- 'HARD_BOUNCE', 'SOFT_BOUNCE', 'UNSUBSCRIBE', 'COMPLAINT', 'MANUAL'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blacklist_email ON lead_email_blacklist(email);
CREATE INDEX idx_blacklist_domain ON lead_email_blacklist(domain);

-- Google Sheets sync tracking
CREATE TABLE lead_sheets_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spreadsheet_id TEXT NOT NULL,
  sheet_name TEXT NOT NULL,

  -- Sync status
  last_synced_at TIMESTAMPTZ,
  last_synced_row_count INTEGER,
  last_qualification_pull_at TIMESTAMPTZ,

  -- Mapping (which DB column goes to which Sheet column)
  column_mapping JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_lead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Track changes in history
  IF OLD IS DISTINCT FROM NEW THEN
    NEW.update_history = COALESCE(OLD.update_history, '[]'::JSONB) ||
      jsonb_build_object(
        'timestamp', NOW(),
        'changes', jsonb_build_object(
          'status', CASE WHEN OLD.status IS DISTINCT FROM NEW.status
            THEN jsonb_build_object('from', OLD.status::TEXT, 'to', NEW.status::TEXT)
            ELSE NULL END,
          'qualify_decision', CASE WHEN OLD.qualify_decision IS DISTINCT FROM NEW.qualify_decision
            THEN jsonb_build_object('from', OLD.qualify_decision::TEXT, 'to', NEW.qualify_decision::TEXT)
            ELSE NULL END
        )
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_timestamp
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_timestamp();

-- Function to generate stable lead_id
CREATE OR REPLACE FUNCTION generate_lead_id(
  p_place_id TEXT,
  p_phone_normalized TEXT,
  p_business_name TEXT,
  p_address_full TEXT,
  p_domain TEXT
) RETURNS TEXT AS $$
BEGIN
  -- Priority 1: Google Place ID (most stable)
  IF p_place_id IS NOT NULL AND p_place_id != '' THEN
    RETURN 'place_' || encode(sha256(('place:' || p_place_id)::bytea), 'hex');
  END IF;

  -- Priority 2: Phone + Business Name
  IF p_phone_normalized IS NOT NULL AND p_phone_normalized != ''
     AND p_business_name IS NOT NULL AND p_business_name != '' THEN
    RETURN 'phone_' || encode(sha256(('phone:' || p_phone_normalized || ':' || lower(p_business_name))::bytea), 'hex');
  END IF;

  -- Priority 3: Address + Business Name
  IF p_address_full IS NOT NULL AND p_address_full != ''
     AND p_business_name IS NOT NULL AND p_business_name != '' THEN
    RETURN 'addr_' || encode(sha256(('addr:' || lower(p_address_full) || ':' || lower(p_business_name))::bytea), 'hex');
  END IF;

  -- Priority 4: Domain + Business Name
  IF p_domain IS NOT NULL AND p_domain != ''
     AND p_business_name IS NOT NULL AND p_business_name != '' THEN
    RETURN 'domain_' || encode(sha256(('domain:' || lower(p_domain) || ':' || lower(p_business_name))::bytea), 'hex');
  END IF;

  -- Fallback: Random UUID (will always be unique, no dedup)
  RETURN 'uuid_' || gen_random_uuid()::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_raw_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_enrichment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_email_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sheets_sync ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to leads" ON leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to workflow_runs" ON lead_workflow_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to raw_imports" ON lead_raw_imports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to enrichment_cache" ON lead_enrichment_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to email_log" ON lead_email_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to blacklist" ON lead_email_blacklist
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to sheets_sync" ON lead_sheets_sync
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users read access (for dashboard)
CREATE POLICY "Authenticated users can read leads" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read workflow_runs" ON lead_workflow_runs
  FOR SELECT TO authenticated USING (true);

-- Comments for documentation
COMMENT ON TABLE leads IS 'Main leads table storing all scraped and enriched business leads';
COMMENT ON TABLE lead_workflow_runs IS 'Tracks each workflow execution with progress and stats';
COMMENT ON TABLE lead_raw_imports IS 'Preserves raw API responses for debugging and reprocessing';
COMMENT ON TABLE lead_enrichment_cache IS 'Caches domain-level enrichment to avoid redundant lookups';
COMMENT ON TABLE lead_email_log IS 'Tracks all sent emails with delivery status';
COMMENT ON TABLE lead_email_blacklist IS 'Emails to never send to (bounces, unsubscribes)';
COMMENT ON TABLE lead_sheets_sync IS 'Tracks Google Sheets sync state';
