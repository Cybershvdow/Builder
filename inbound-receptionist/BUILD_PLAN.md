# Ace Noir Inbound Receptionist - Build Plan

## Overview

An AI-powered inbound call receptionist for **Ace Noir Cleaning Services (NOIR LLC)** that handles lead intake, appointment booking, and notifications for commercial cleaning services in the greater Los Angeles area.

**Base Location:** Pasadena, California
**Service Area:** Los Angeles County (with flexibility for edge cases)
**Primary Use Case:** B2B commercial cleaning lead capture and walkthrough scheduling

---

## 1. Lean Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INBOUND RECEPTIONIST SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  Voice Platform │
                              │ (Twilio/Vapi/   │
                              │  Retell/etc.)   │
                              └────────┬────────┘
                                       │
                         POST /webhook/call-event
                         (single-shot or streamed)
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            WEBHOOK HANDLER                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ • Validate payload signature                                            │ │
│  │ • Extract call_id for idempotency                                       │ │
│  │ • Determine event_type: call_start | transcript_update | call_end       │ │
│  │ • ACK immediately (< 3s response)                                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          AI INTAKE AGENT                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 1. CONSENT CHECK (California compliance)                                │ │
│  │    └─ If denied → minimal intake, flag consent_denied                   │ │
│  │                                                                         │ │
│  │ 2. INTENT DETECTION                                                     │ │
│  │    └─ walkthrough_request | info_request | existing_customer | spam     │ │
│  │                                                                         │ │
│  │ 3. STRUCTURED INTAKE                                                    │ │
│  │    └─ Collect MVF (minimum viable fields) → optional details            │ │
│  │                                                                         │ │
│  │ 4. OUTPUT: Deterministic JSON LeadRecord                                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
         ┌──────────────────┐  ┌─────────────┐  ┌─────────────────┐
         │  STORE LEAD      │  │ BOOK SLOT   │  │ SEND NOTIFY     │
         │  (Postgres/      │  │ (Google     │  │ (Gmail API)     │
         │   Sheets)        │  │  Calendar)  │  │                 │
         └──────────────────┘  └─────────────┘  └─────────────────┘
                    │                  │                  │
                    └──────────────────┴──────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Response/Next   │
                              │ Action Routing  │
                              └─────────────────┘
```

### Component Summary

| Component | Responsibility | Technology Options |
|-----------|---------------|-------------------|
| Webhook Handler | Validate, dedupe, route events | Node.js/Python + Express/FastAPI |
| AI Intake Agent | Conversation understanding, structured extraction | Claude API / GPT-4 |
| Data Store | Persist leads, calls, transcripts | Postgres (preferred) / Google Sheets |
| Calendar Booker | Schedule walkthrough appointments | Google Calendar API |
| Email Notifier | Alert owner of new leads | Gmail API / SendGrid |

---

## 2. File Index

This build plan includes the following artifacts:

| File | Description |
|------|-------------|
| `BUILD_PLAN.md` | This document - overview and architecture |
| `schemas/lead-record.json` | JSON Schema for LeadRecord |
| `schemas/webhook-payload.json` | JSON Schema for inbound webhook |
| `sql/schema.sql` | Postgres table definitions |
| `docs/sheets-layout.md` | Google Sheets column layout |
| `prompts/system-prompt.md` | AI receptionist system prompt |
| `prompts/developer-prompt.md` | Tool instructions for AI agent |
| `examples/webhook-payloads.json` | Example inbound/outbound payloads |
| `examples/few-shot-examples.md` | Conversation examples for AI |
| `docs/decision-logic.md` | State machine and pseudocode |
| `docs/error-handling.md` | Retry, validation, observability |
| `docs/config.md` | Environment variables and secrets |

---

## 3. Key Design Decisions

### 3.1 Idempotency Strategy
- Every call has a unique `call_id` from the voice platform
- Before processing, check if `call_id` exists in datastore
- If exists and `status = completed`, return cached response
- If exists and `status = processing`, wait or return "in progress"
- Use database transactions with `ON CONFLICT` for atomic upserts

### 3.2 Consent Handling (California Compliance)
- AI must ask consent before any recording/transcription storage
- If consent denied:
  - Set `consent_status = 'denied'`
  - Do NOT store transcript
  - Collect only basic contact info manually
  - Proceed with booking if requested
- If consent given:
  - Set `consent_status = 'granted'`
  - Store full transcript for reference

### 3.3 Service Area Logic
- Primary: Pasadena and LA County
- If location is outside LA County:
  - Still collect all lead details
  - Set `lead_status = 'follow_up_needed'`
  - Add note: "Outside primary service area - manual review required"
  - Never reject outright

### 3.4 Pricing Policy
- NEVER quote specific prices
- Standard response: "Pricing depends on facility scope. A walkthrough lets us give you an accurate bid."
- If pressed: "I can't give exact numbers without seeing the space, but our quotes are competitive and transparent."

---

## 4. Lead Status Definitions

| Status | Description | Next Action |
|--------|-------------|-------------|
| `new_lead` | Qualified lead, no appointment booked | Call back within 4 hours |
| `booked` | Walkthrough scheduled | Confirm appointment, prep checklist |
| `info_only` | Just seeking information | Send info email if contact provided |
| `existing_customer` | Current client calling | Route to account manager |
| `spam` | Wrong number, sales call, etc. | No action needed |
| `follow_up_needed` | Outside area or special circumstances | Manual review required |

---

## 5. Minimum Viable Fields (MVF)

These must be captured for any qualified lead:

1. **caller_name** - Full name of person calling
2. **phone** - Confirmed phone number
3. **email** - If willing to provide
4. **business_name** - Company/organization name
5. **service_address** - Street, city, zip
6. **facility_type** - Office, medical, school, warehouse, retail, multi-tenant, other
7. **approx_size** - Square footage or proxy (rooms/floors)
8. **cleaning_frequency** - Nights/week, weekly, bi-weekly, etc.
9. **timeline** - When looking to start/switch
10. **pain_points** - Current issues or reasons for seeking service
11. **special_requirements** - Security, access, compliance, supplies
12. **walkthrough_availability** - Best times, decision-maker presence

---

## 6. Quick Start Implementation

### Phase 1: Core Pipeline (Day 1-2)
1. Set up webhook endpoint with signature validation
2. Implement AI intake with consent check
3. Basic Postgres storage for leads

### Phase 2: Integrations (Day 3-4)
4. Google Calendar booking integration
5. Gmail notification on new leads

### Phase 3: Hardening (Day 5)
6. Add idempotency checks
7. Implement retry logic
8. Set up error logging/alerting

### Phase 4: Testing (Day 6-7)
9. End-to-end testing with mock calls
10. Edge case handling (consent denied, outside area, spam)
11. Load testing webhook endpoint

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Webhook response time | < 3 seconds |
| Lead capture rate | > 90% of qualified calls |
| Data completeness | > 80% MVF fields populated |
| Booking conversion | > 40% of leads book walkthrough |
| False positive (spam) rate | < 5% |
| Consent compliance | 100% disclosure before storage |

---

## Next Steps

1. Review all artifacts in this directory
2. Set up environment variables per `docs/config.md`
3. Deploy webhook endpoint
4. Configure voice platform to send events
5. Test with sample calls
6. Monitor and iterate

---

*Build Plan Version: 1.0*
*Last Updated: 2026-01-24*
*Company: Ace Noir Cleaning Services (NOIR LLC)*
