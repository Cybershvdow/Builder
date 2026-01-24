-- ============================================================================
-- ACE NOIR INBOUND RECEPTIONIST - POSTGRES SCHEMA
-- ============================================================================
-- Database schema for storing leads and call data from the inbound receptionist
--
-- Design Decision: Using two tables (leads + calls) instead of one because:
-- 1. A single lead may have multiple call interactions over time
-- 2. Call metadata (transcripts, recordings) can be large; separating keeps leads table lean
-- 3. Enables analytics on call patterns independently from lead status
-- 4. Cleaner separation of concerns for GDPR/CCPA compliance (can purge call data separately)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE lead_status AS ENUM (
    'new_lead',
    'booked',
    'info_only',
    'existing_customer',
    'spam',
    'follow_up_needed'
);

CREATE TYPE consent_status AS ENUM (
    'granted',
    'denied',
    'not_asked'
);

CREATE TYPE caller_intent AS ENUM (
    'walkthrough_request',
    'quote_request',
    'info_request',
    'existing_customer',
    'spam',
    'unknown'
);

CREATE TYPE facility_type AS ENUM (
    'office',
    'medical',
    'dental',
    'school',
    'warehouse',
    'retail',
    'restaurant',
    'multi_tenant',
    'industrial',
    'gym_fitness',
    'church',
    'government',
    'other'
);

CREATE TYPE timeline_urgency AS ENUM (
    'asap',
    'within_2_weeks',
    'within_month',
    'flexible',
    'shopping'
);

CREATE TYPE next_action_type AS ENUM (
    'confirm_walkthrough',
    'callback_to_schedule',
    'send_info_email',
    'route_to_account_manager',
    'no_action',
    'manual_review'
);

CREATE TYPE processing_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

-- ============================================================================
-- LEADS TABLE
-- ============================================================================
-- Primary table for lead/prospect information

CREATE TABLE leads (
    -- Primary identifiers
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id VARCHAR(30) UNIQUE NOT NULL, -- Human-readable ID: lead_YYYYMMDD_NNN

    -- Status and classification
    lead_status lead_status NOT NULL DEFAULT 'new_lead',
    consent_status consent_status NOT NULL DEFAULT 'not_asked',
    intent caller_intent NOT NULL DEFAULT 'unknown',

    -- Contact information
    caller_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    phone_source VARCHAR(20) DEFAULT 'caller_id', -- caller_id, confirmed, provided
    email VARCHAR(255),
    preferred_contact_method VARCHAR(10) DEFAULT 'phone',

    -- Business information
    business_name VARCHAR(200),
    facility_type facility_type,
    facility_type_other VARCHAR(100),

    -- Location
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2) DEFAULT 'CA',
    zip VARCHAR(10),
    full_address TEXT,
    in_service_area BOOLEAN DEFAULT TRUE,
    distance_from_base_miles NUMERIC(6,2),

    -- Facility details (JSONB for flexibility)
    facility_details JSONB DEFAULT '{}',
    -- Expected structure:
    -- {
    --   "approx_sqft": 3500,
    --   "sqft_source": "estimate",
    --   "size_proxy": null,
    --   "num_restrooms": 2,
    --   "has_breakroom": true,
    --   "has_kitchen": false,
    --   "floor_types": ["carpet", "tile"],
    --   "high_traffic_areas": "lobby, hallways",
    --   "trash_volume": "moderate"
    -- }

    -- Service requirements
    frequency VARCHAR(100), -- "3x/week", "nightly", etc.
    frequency_times_per_week NUMERIC(3,1),
    specific_days VARCHAR(50)[], -- ARRAY['monday', 'wednesday', 'friday']
    preferred_time VARCHAR(100),
    timeline VARCHAR(200),
    timeline_urgency timeline_urgency,
    add_ons TEXT[], -- ARRAY of requested add-ons

    -- Special requirements (JSONB for flexibility)
    special_requirements JSONB DEFAULT '{}',
    -- Expected structure:
    -- {
    --   "security_requirements": "NDA required",
    --   "access_instructions": "Key in lockbox, code 1234",
    --   "compliance_requirements": ["hipaa"],
    --   "supplies_provided": "ace_noir_provides",
    --   "hazardous_materials": null,
    --   "other_notes": null
    -- }

    -- Pain points and context
    current_provider VARCHAR(200),
    reason_for_switch TEXT,
    specific_issues TEXT[], -- ARRAY of issues
    priorities TEXT[], -- ARRAY of priorities

    -- Budget (only if voluntarily provided)
    budget_range VARCHAR(100),
    current_spend VARCHAR(100),

    -- Walkthrough scheduling
    walkthrough_requested BOOLEAN DEFAULT FALSE,
    walkthrough_booked BOOLEAN DEFAULT FALSE,
    walkthrough_datetime TIMESTAMPTZ,
    walkthrough_duration_minutes INTEGER DEFAULT 30,
    calendar_event_id VARCHAR(100),
    decision_maker_attending BOOLEAN,
    availability_notes TEXT,

    -- AI-generated content
    call_summary TEXT,

    -- Next action tracking
    next_action next_action_type,
    next_action_deadline VARCHAR(50),
    next_action_notes TEXT,

    -- Notifications tracking (JSONB array)
    notifications_sent JSONB DEFAULT '[]',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processing_status processing_status DEFAULT 'pending',

    -- Search optimization
    search_vector tsvector
);

-- ============================================================================
-- CALLS TABLE
-- ============================================================================
-- Stores individual call records and transcripts
-- Multiple calls can be associated with a single lead

CREATE TABLE calls (
    -- Primary identifiers
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id VARCHAR(64) UNIQUE NOT NULL, -- From voice platform (idempotency key)

    -- Link to lead (nullable for spam/info-only calls)
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

    -- Call metadata
    caller_phone VARCHAR(20) NOT NULL,
    called_phone VARCHAR(20),
    call_direction VARCHAR(10) DEFAULT 'inbound',
    call_status VARCHAR(20),
    call_duration_seconds INTEGER,

    -- Consent (California compliance)
    consent_status consent_status NOT NULL DEFAULT 'not_asked',
    consent_timestamp TIMESTAMPTZ,

    -- Transcript storage (null if consent denied)
    transcript_stored BOOLEAN DEFAULT FALSE,
    transcript_full TEXT,
    transcript_utterances JSONB, -- Array of utterance objects
    transcript_reference VARCHAR(255), -- External reference or 'consent_denied'

    -- Recording
    recording_url TEXT,
    recording_stored BOOLEAN DEFAULT FALSE,

    -- Voice platform metadata
    voice_platform VARCHAR(50),
    voice_platform_version VARCHAR(20),
    voice_session_id VARCHAR(100),
    platform_metadata JSONB DEFAULT '{}',

    -- AI processing
    ai_confidence_score NUMERIC(4,3),
    intent_detected caller_intent,
    extracted_data JSONB, -- Raw extracted data before processing

    -- Processing status
    event_type VARCHAR(20), -- call_start, transcript_update, call_end
    processing_status processing_status DEFAULT 'pending',
    processing_error TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    call_started_at TIMESTAMPTZ,
    call_ended_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- IDEMPOTENCY TABLE
-- ============================================================================
-- Tracks processed call_ids to prevent duplicate processing

CREATE TABLE call_idempotency (
    call_id VARCHAR(64) PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    response_data JSONB NOT NULL, -- Cached response
    processing_status processing_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Leads table indexes
CREATE INDEX idx_leads_lead_id ON leads(lead_id);
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_walkthrough_datetime ON leads(walkthrough_datetime) WHERE walkthrough_datetime IS NOT NULL;
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_processing_status ON leads(processing_status);
CREATE INDEX idx_leads_search ON leads USING GIN(search_vector);

-- Calls table indexes
CREATE INDEX idx_calls_call_id ON calls(call_id);
CREATE INDEX idx_calls_lead_id ON calls(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_calls_caller_phone ON calls(caller_phone);
CREATE INDEX idx_calls_received_at ON calls(received_at);
CREATE INDEX idx_calls_processing_status ON calls(processing_status);
CREATE INDEX idx_calls_consent_status ON calls(consent_status);

-- Idempotency table indexes
CREATE INDEX idx_idempotency_expires ON call_idempotency(expires_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-generate lead_id
CREATE OR REPLACE FUNCTION generate_lead_id()
RETURNS TRIGGER AS $$
DECLARE
    today_date VARCHAR(8);
    seq_num INTEGER;
BEGIN
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(lead_id FROM 15) AS INTEGER)
    ), 0) + 1
    INTO seq_num
    FROM leads
    WHERE lead_id LIKE 'lead_' || today_date || '_%';

    NEW.lead_id := 'lead_' || today_date || '_' || LPAD(seq_num::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_generate_id
    BEFORE INSERT ON leads
    FOR EACH ROW
    WHEN (NEW.lead_id IS NULL)
    EXECUTE FUNCTION generate_lead_id();

-- Update search vector for full-text search
CREATE OR REPLACE FUNCTION update_lead_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.business_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.caller_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.call_summary, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.specific_issues, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_search_vector_update
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_search_vector();

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Clean expired idempotency records
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM call_idempotency WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Purge transcripts for consent-denied calls (compliance)
CREATE OR REPLACE FUNCTION purge_denied_transcripts()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE calls
    SET
        transcript_full = NULL,
        transcript_utterances = NULL,
        transcript_reference = 'consent_denied',
        transcript_stored = FALSE
    WHERE consent_status = 'denied'
    AND (transcript_full IS NOT NULL OR transcript_utterances IS NOT NULL);

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active leads requiring follow-up
CREATE VIEW active_leads_followup AS
SELECT
    l.lead_id,
    l.business_name,
    l.caller_name,
    l.phone,
    l.email,
    l.city,
    l.lead_status,
    l.next_action,
    l.next_action_deadline,
    l.created_at,
    l.walkthrough_datetime
FROM leads l
WHERE l.lead_status IN ('new_lead', 'follow_up_needed')
AND l.processing_status = 'completed'
ORDER BY
    CASE l.timeline_urgency
        WHEN 'asap' THEN 1
        WHEN 'within_2_weeks' THEN 2
        WHEN 'within_month' THEN 3
        ELSE 4
    END,
    l.created_at;

-- Today's booked walkthroughs
CREATE VIEW todays_walkthroughs AS
SELECT
    l.lead_id,
    l.business_name,
    l.caller_name,
    l.phone,
    l.full_address,
    l.walkthrough_datetime,
    l.facility_type,
    l.facility_details->>'approx_sqft' AS approx_sqft,
    l.call_summary,
    l.calendar_event_id
FROM leads l
WHERE l.walkthrough_booked = TRUE
AND DATE(l.walkthrough_datetime AT TIME ZONE 'America/Los_Angeles') = CURRENT_DATE
ORDER BY l.walkthrough_datetime;

-- Call statistics
CREATE VIEW call_stats AS
SELECT
    DATE(received_at AT TIME ZONE 'America/Los_Angeles') AS call_date,
    COUNT(*) AS total_calls,
    COUNT(CASE WHEN intent_detected = 'walkthrough_request' THEN 1 END) AS walkthrough_requests,
    COUNT(CASE WHEN intent_detected = 'spam' THEN 1 END) AS spam_calls,
    AVG(call_duration_seconds) AS avg_duration_seconds,
    COUNT(CASE WHEN consent_status = 'granted' THEN 1 END) AS consent_granted,
    COUNT(CASE WHEN consent_status = 'denied' THEN 1 END) AS consent_denied
FROM calls
WHERE received_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(received_at AT TIME ZONE 'America/Los_Angeles')
ORDER BY call_date DESC;

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

/*
-- Insert a new lead (lead_id auto-generated)
INSERT INTO leads (
    lead_status, consent_status, intent,
    caller_name, phone, email,
    business_name, facility_type,
    city, state, zip, full_address,
    frequency, timeline, timeline_urgency,
    call_summary, next_action
) VALUES (
    'booked', 'granted', 'walkthrough_request',
    'Sarah Martinez', '+16265551234', 'sarah@martinezlaw.com',
    'Martinez & Associates Law Firm', 'office',
    'Glendale', 'CA', '91203', '450 North Brand Blvd, Suite 300, Glendale, CA 91203',
    '3x/week after 6 PM', 'ASAP', 'asap',
    'Law firm seeking cleaning services due to dissatisfaction with current provider.',
    'confirm_walkthrough'
);

-- Check idempotency before processing
SELECT * FROM call_idempotency WHERE call_id = 'call_abc123' AND processing_status = 'completed';

-- Upsert call with idempotency
INSERT INTO call_idempotency (call_id, response_data, processing_status)
VALUES ('call_abc123', '{"status": "success"}', 'processing')
ON CONFLICT (call_id) DO UPDATE SET processing_status = 'processing'
WHERE call_idempotency.processing_status != 'completed';

-- Full-text search
SELECT * FROM leads
WHERE search_vector @@ plainto_tsquery('english', 'law firm glendale')
ORDER BY ts_rank(search_vector, plainto_tsquery('english', 'law firm glendale')) DESC;

-- Get leads needing callback today
SELECT * FROM active_leads_followup
WHERE created_at > NOW() - INTERVAL '24 hours';

*/

-- ============================================================================
-- GRANTS (adjust role names as needed)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE ON leads TO receptionist_app;
-- GRANT SELECT, INSERT, UPDATE ON calls TO receptionist_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON call_idempotency TO receptionist_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO receptionist_app;
