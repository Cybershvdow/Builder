# Lead Generation Workflow - Analysis & Improvements

## Issues Found in Original Prompt

### 1. Architectural Issues

| Issue | Problem | Solution |
|-------|---------|----------|
| **Monolithic Design** | Workflow runs as single process - any failure requires full restart | Split into discrete, resumable steps with status tracking |
| **Google Sheets as Database** | Sheets have 10M cell limit, poor concurrency, slow for lookups | Use Supabase (PostgreSQL) as primary store, sync to Sheets for human review |
| **Manual Qualification Gate** | Human review inside Sheets breaks automation flow | Event-driven: webhook triggers when human marks APPROVE/REJECT |
| **Mixed Concerns** | Scraping, normalization, enrichment, email all in one flow | Separate services with clear interfaces |

### 2. Data Integrity Issues

| Issue | Problem | Solution |
|-------|---------|----------|
| **Inconsistent lead_id** | Hashing different fields (place_id vs name+phone) creates collisions | Prioritize: place_id → (name+address hash) → UUID fallback |
| **Merge conflicts** | "Update if new field better" is ambiguous | Define explicit merge rules with timestamps and source priority |
| **No audit trail** | Can't track what changed when | Add `updated_at`, `update_history` JSONB column |

### 3. Efficiency Issues

| Issue | Problem | Solution |
|-------|---------|----------|
| **Synchronous enrichment** | Crawling 5 pages per website blocks the workflow | Async job queue with configurable concurrency |
| **No caching** | Same domain enriched multiple times | Cache enrichment results by domain (24hr TTL) |
| **Full sheet scans** | Dedupe checks scan entire sheet | Database indexes on lead_id, domain, phone |
| **No batching** | Individual sheet writes are slow | Batch upserts (50-100 rows per API call) |

### 4. Missing Critical Features

| Missing | Impact | Solution |
|---------|--------|----------|
| **Appify async handling** | Many scraper APIs are async with webhooks | Support both sync response and webhook callback |
| **Partial failure recovery** | Network error loses all progress | Checkpoint after each batch, resume from last success |
| **Rate limiting** | API bans, email blacklisting | Configurable delays, respect 429 responses |
| **Bounce handling** | Damages sender reputation | Track bounces, auto-update status, skip known-bad emails |
| **Email warmup** | Cold domains get spam-filtered | Start with low volume, gradually increase |

### 5. Prompt Specification Gaps

| Gap | Issue |
|-----|-------|
| **Appify endpoint not specified** | Need actual API documentation |
| **No pagination format** | Cursor vs offset vs page number? |
| **Email provider undefined** | Resend? SendGrid? SMTP? |
| **Enrichment provider undefined** | Hunter.io? Apollo? Clearbit? |
| **No error notification** | How does user know if workflow failed? |

---

## Optimized Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW ORCHESTRATOR                           │
│  (API Route: POST /api/leads/workflow)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: SCRAPE                                                          │
│ ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────────┐ │
│ │ Form Input  │───▶│ Appify API   │───▶│ Raw Results (paginated)     │ │
│ │ Validation  │    │ + Pagination │    │ Store in leads_raw_imports  │ │
│ └─────────────┘    └──────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: NORMALIZE + DEDUPE                                              │
│ ┌─────────────────┐    ┌───────────────┐    ┌────────────────────────┐ │
│ │ Field Mapping   │───▶│ Generate      │───▶│ Upsert to leads        │ │
│ │ (all 40+ cols)  │    │ lead_id hash  │    │ (merge if exists)      │ │
│ └─────────────────┘    └───────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: SYNC TO SHEETS (for human review)                               │
│ ┌─────────────────┐    ┌───────────────────────────────────────────┐   │
│ │ Batch 100 rows  │───▶│ Google Sheets API: Leads_Raw              │   │
│ │ at a time       │    │ (triggers human qualification)            │   │
│ └─────────────────┘    └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │  HUMAN REVIEWS IN SHEETS      │
                    │  Sets qualify_decision =      │
                    │  APPROVE / REJECT             │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: QUALIFICATION SYNC (Webhook or Poll)                            │
│ ┌─────────────────┐    ┌───────────────────────────────────────────┐   │
│ │ Read Sheets     │───▶│ Update leads table with decisions         │   │
│ │ qualify_decision│    │ Queue approved leads for enrichment       │   │
│ └─────────────────┘    └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: ENRICH (Async Queue)                                            │
│ ┌─────────────────┐    ┌───────────────┐    ┌────────────────────────┐ │
│ │ Check domain    │───▶│ Crawl website │───▶│ Try enrichment API     │ │
│ │ cache first     │    │ /contact,/about│    │ (Hunter, Apollo, etc)  │ │
│ └─────────────────┘    └───────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: EMAIL (Optional, with safeguards)                               │
│ ┌─────────────────┐    ┌───────────────┐    ┌────────────────────────┐ │
│ │ Check:          │───▶│ Generate      │───▶│ Send via Resend/       │ │
│ │ - confidence≥70%│    │ personalized  │    │ SendGrid + track       │ │
│ │ - not bounced   │    │ email (AI)    │    │                        │ │
│ │ - daily limit   │    │               │    │                        │ │
│ └─────────────────┘    └───────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: OUTPUT                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Sync qualified leads to Leads_Qualified sheet                       │ │
│ │ Return summary JSON with stats                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Improvements Implemented

### 1. Database-First Architecture
- PostgreSQL (Supabase) as source of truth
- Proper indexes for fast lookups
- JSONB for flexible raw data storage
- Sheets sync is one-way push (with qualification pull-back)

### 2. Resumable Workflow
- Each step has checkpoint
- Failed workflows resume from last successful step
- Partial batch failures don't lose completed work

### 3. Smart Deduplication
```typescript
// Priority-based lead_id generation
function generateLeadId(lead: RawLead): string {
  if (lead.place_id) return hash(`place:${lead.place_id}`);
  if (lead.phone_normalized && lead.business_name)
    return hash(`phone:${lead.phone_normalized}:${lead.business_name}`);
  if (lead.address_full && lead.business_name)
    return hash(`addr:${lead.address_full}:${lead.business_name}`);
  if (lead.domain && lead.business_name)
    return hash(`domain:${lead.domain}:${lead.business_name}`);
  return uuid(); // Last resort - new unique lead
}
```

### 4. Efficient Enrichment
- Domain-level caching (don't re-crawl same site)
- Async job queue with concurrency limits
- Graceful degradation if enrichment fails

### 5. Email Safety
- Minimum confidence: 70% (not 55%)
- Daily send limits per campaign
- Bounce tracking and auto-blacklist
- Warm-up schedule support

### 6. Observability
- Detailed run logs in database
- Webhook notifications for errors
- Summary stats after each run

---

## Environment Variables Required

```env
# Appify Scraper
APPIFY_API_KEY=
APPIFY_ENDPOINT_URL=https://api.appify.com/v1/google-places

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
GOOGLE_SHEETS_SPREADSHEET_ID=

# Email (using existing Resend)
RESEND_API_KEY=

# Enrichment (optional)
HUNTER_API_KEY=
APOLLO_API_KEY=

# Workflow Settings
LEAD_WORKFLOW_DAILY_EMAIL_LIMIT=50
LEAD_WORKFLOW_ENRICHMENT_CONCURRENCY=3
LEAD_WORKFLOW_MIN_EMAIL_CONFIDENCE=0.70
```
