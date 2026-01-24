# Decision Logic & State Machine

## Overview

This document defines the processing flow for inbound calls to the Ace Noir receptionist system, including the state machine, decision trees, and idempotency strategy.

---

## State Machine

### Call Processing States

```
                                    ┌─────────────────┐
                                    │     START       │
                                    └────────┬────────┘
                                             │
                                             ▼
                              ┌──────────────────────────────┐
                              │    VALIDATE_WEBHOOK          │
                              │  • Check signature           │
                              │  • Validate payload schema   │
                              │  • Extract call_id           │
                              └──────────────┬───────────────┘
                                             │
                           ┌─────────────────┼─────────────────┐
                           │ invalid         │ valid           │
                           ▼                 ▼                 │
                    ┌─────────────┐  ┌──────────────────┐      │
                    │ REJECT_400  │  │ CHECK_IDEMPOTENCY│      │
                    └─────────────┘  └────────┬─────────┘      │
                                              │                │
                           ┌──────────────────┼────────────────┐
                           │ exists+completed │ exists+pending │ new
                           ▼                  ▼                ▼
                    ┌─────────────┐  ┌──────────────┐  ┌───────────────┐
                    │ RETURN_CACHE│  │ WAIT_OR_409  │  │ MARK_PROCESSING│
                    └─────────────┘  └──────────────┘  └───────┬───────┘
                                                               │
                                                               ▼
                                              ┌────────────────────────────┐
                                              │      ROUTE_EVENT_TYPE      │
                                              └───────────┬────────────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────┐
                        │ call_start    │ transcript_update   │ call_end        │
                        ▼               ▼                     ▼                 │
                 ┌────────────┐  ┌──────────────┐     ┌──────────────────┐      │
                 │ INIT_SESSION│  │ UPDATE_BUFFER│     │ PROCESS_COMPLETE │      │
                 │ (ACK only)  │  │ (ACK only)   │     │ (full processing)│      │
                 └────────────┘  └──────────────┘     └────────┬─────────┘      │
                                                               │                │
                                                               ▼
                                              ┌────────────────────────────┐
                                              │      CHECK_CONSENT         │
                                              └───────────┬────────────────┘
                                                          │
                              ┌────────────────────────────┼────────────────┐
                              │ granted                    │ denied         │ not_asked
                              ▼                            ▼                ▼
                      ┌───────────────┐          ┌─────────────────┐  ┌─────────────┐
                      │ FULL_PROCESSING│          │ LIMITED_PROCESS │  │ FLAG_ERROR  │
                      └───────┬───────┘          │ (no transcript) │  └─────────────┘
                              │                  └────────┬────────┘
                              └────────────────────┬──────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────┐
                                    │      DETECT_INTENT       │
                                    └───────────┬──────────────┘
                                                │
             ┌──────────────────────────────────┼──────────────────────────────────┐
             │ walkthrough/quote    │ info_request   │ existing_customer │ spam    │
             ▼                      ▼                ▼                   ▼         │
      ┌──────────────┐      ┌────────────┐    ┌──────────────┐    ┌──────────┐    │
      │ LEAD_INTAKE  │      │ INFO_ONLY  │    │ ROUTE_SUPPORT│    │ LOG_SPAM │    │
      └──────┬───────┘      └──────┬─────┘    └──────┬───────┘    └────┬─────┘    │
             │                     │                 │                 │          │
             ▼                     │                 │                 │          │
      ┌──────────────┐             │                 │                 │          │
      │ EXTRACT_DATA │             │                 │                 │          │
      └──────┬───────┘             │                 │                 │          │
             │                     │                 │                 │          │
             ▼                     │                 │                 │          │
      ┌──────────────┐             │                 │                 │          │
      │ CHECK_BOOKING│             │                 │                 │          │
      └──────┬───────┘             │                 │                 │          │
             │                     │                 │                 │          │
      ┌──────┴──────┐              │                 │                 │          │
      │ booked      │ not_booked  │                 │                 │          │
      ▼             ▼              │                 │                 │          │
┌───────────┐ ┌──────────┐         │                 │                 │          │
│CREATE_EVENT│ │NEW_LEAD │         │                 │                 │          │
└─────┬─────┘ └────┬─────┘         │                 │                 │          │
      │            │               │                 │                 │          │
      └────────────┴───────────────┴─────────────────┴─────────────────┘          │
                                   │                                              │
                                   ▼                                              │
                          ┌────────────────┐                                      │
                          │   STORE_LEAD   │◄─────────────────────────────────────┘
                          └───────┬────────┘
                                  │
                     ┌────────────┴────────────┐
                     │ success                 │ failure
                     ▼                         ▼
              ┌─────────────┐           ┌─────────────┐
              │SEND_NOTIFY  │           │ RETRY_STORE │
              └──────┬──────┘           └──────┬──────┘
                     │                         │
                     │                  ┌──────┴──────┐
                     │                  │ retry_ok    │ retry_fail
                     │                  ▼             ▼
                     │           ┌─────────────┐ ┌─────────────┐
                     │           │ STORE_LEAD  │ │ FAIL_REQUEST│
                     │           └──────┬──────┘ └─────────────┘
                     │                  │
                     └──────────────────┤
                                        ▼
                              ┌────────────────────┐
                              │  MARK_COMPLETED    │
                              │  (cache response)  │
                              └─────────┬──────────┘
                                        │
                                        ▼
                              ┌────────────────────┐
                              │   RETURN_RESPONSE  │
                              └────────────────────┘
```

---

## Decision Trees

### 1. Consent Decision

```
START: Did agent ask about recording consent?
│
├── NO → Set consent_status = "not_asked"
│        Flag for manual review
│        Continue with LIMITED processing
│
└── YES → What was the response?
          │
          ├── GRANTED ("yes", "sure", "okay", "fine")
          │   └── Set consent_status = "granted"
          │       Store transcript = TRUE
          │       Continue with FULL processing
          │
          ├── DENIED ("no", "don't", "rather not", "prefer not")
          │   └── Set consent_status = "denied"
          │       Store transcript = FALSE
          │       Set transcript_reference = "consent_denied"
          │       Continue with LIMITED processing
          │
          └── UNCLEAR (ambiguous response)
              └── Check if agent clarified
                  ├── YES → Re-evaluate response
                  └── NO → Treat as "not_asked"
```

### 2. Intent Classification

```
START: Analyze transcript for intent signals
│
├── SPAM SIGNALS DETECTED?
│   Keywords: "marketing", "SEO", "Google listing", "special offer",
│             "business opportunity", "you've won", sales pitch pattern
│   └── YES → intent = "spam"
│             lead_status = "spam"
│             SKIP storage (or log for analytics)
│             SKIP notification
│             END
│
├── EXISTING CUSTOMER SIGNALS?
│   Keywords: "already a client", "current customer", "we use you",
│             "there's an issue", "complaint about service"
│   └── YES → intent = "existing_customer"
│             lead_status = "existing_customer"
│             STORE with issue details
│             NOTIFY (urgent if complaint)
│             next_action = "route_to_account_manager"
│             END
│
├── WALKTHROUGH/QUOTE SIGNALS?
│   Keywords: "quote", "pricing", "cost", "cleaning service",
│             "need a cleaner", "looking for", "hire"
│   └── YES → intent = "walkthrough_request" or "quote_request"
│             Continue to LEAD INTAKE
│
├── INFO SIGNALS?
│   Keywords: "what services", "do you serve", "what areas",
│             "how does it work", "just wondering"
│   └── YES → intent = "info_request"
│             Check if converted to lead
│             ├── YES → Continue to LEAD INTAKE
│             └── NO → lead_status = "info_only"
│                      STORE (optional)
│                      SKIP notification (optional)
│                      END
│
└── UNCLEAR
    └── intent = "unknown"
        lead_status = "follow_up_needed"
        STORE with all available info
        NOTIFY for manual review
        END
```

### 3. Lead Qualification

```
START: Lead Intake
│
├── Minimum Viable Fields (MVF) Check
│   Required: name, phone, business_name, city, facility_type,
│             frequency, timeline
│   │
│   ├── ALL MVF CAPTURED → lead_status = "new_lead" (minimum)
│   │
│   └── MVF INCOMPLETE →
│       │
│       ├── Caller refused to provide → Flag missing fields
│       │                               lead_status = "follow_up_needed"
│       │
│       └── Conversation ended early → Flag missing fields
│                                      lead_status = "follow_up_needed"
│
├── Service Area Check
│   │
│   ├── City in LA County → in_service_area = TRUE
│   │                       Continue normally
│   │
│   └── City outside LA County → in_service_area = FALSE
│                                lead_status = "follow_up_needed"
│                                Add note: "Outside primary service area"
│
└── Booking Check
    │
    ├── Walkthrough BOOKED → lead_status = "booked"
    │                        CREATE calendar event
    │                        next_action = "confirm_walkthrough"
    │
    └── Walkthrough NOT BOOKED
        │
        ├── Caller requested callback → next_action = "callback_to_schedule"
        │
        └── Caller undecided → next_action = "callback_to_schedule"
```

### 4. Next Action Determination

```
START: Determine next_action based on lead_status
│
├── lead_status = "booked"
│   └── next_action = "confirm_walkthrough"
│       deadline = "day before appointment"
│       notes = "Prepare checklist based on facility type"
│
├── lead_status = "new_lead"
│   └── next_action = "callback_to_schedule"
│       deadline = "within 4 hours" (or per SLA config)
│       notes = "Schedule walkthrough"
│
├── lead_status = "follow_up_needed"
│   │
│   ├── Reason: Outside service area
│   │   └── next_action = "manual_review"
│   │       notes = "Evaluate if we can service this area"
│   │
│   └── Reason: Incomplete info / Unclear
│       └── next_action = "callback_to_schedule"
│           notes = "Gather missing information"
│
├── lead_status = "info_only"
│   │
│   ├── Email provided?
│   │   └── YES → next_action = "send_info_email"
│   │   └── NO → next_action = "no_action"
│   │
│   └── notes = "May convert to lead later"
│
├── lead_status = "existing_customer"
│   └── next_action = "route_to_account_manager"
│       deadline = "within 1 hour" (if complaint)
│       notes = "Issue details in summary"
│
└── lead_status = "spam"
    └── next_action = "no_action"
```

---

## Idempotency Strategy

### Using `call_id`

Every call from the voice platform includes a unique `call_id`. This is the idempotency key.

### Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        IDEMPOTENCY CHECK                            │
└─────────────────────────────────────────────────────────────────────┘

1. RECEIVE webhook with call_id
         │
         ▼
2. QUERY idempotency table:
   SELECT * FROM call_idempotency WHERE call_id = $1
         │
         ├── NOT FOUND
         │   │
         │   ▼
         │   INSERT INTO call_idempotency (call_id, processing_status)
         │   VALUES ($call_id, 'processing')
         │   ON CONFLICT DO NOTHING
         │   RETURNING *
         │         │
         │         ├── INSERT succeeded → Process call
         │         │
         │         └── INSERT failed (conflict) → Re-query, treat as FOUND
         │
         └── FOUND
             │
             ├── processing_status = 'completed'
             │   └── RETURN cached response_data
             │       HTTP 200 with cached = true
             │
             ├── processing_status = 'processing'
             │   │
             │   ├── Created < 30 seconds ago
             │   │   └── WAIT 1-2 seconds, re-query
             │   │       (prevent thundering herd)
             │   │
             │   └── Created > 30 seconds ago
             │       └── Assume stale, reset to 'processing'
             │           Continue with processing
             │
             └── processing_status = 'failed'
                 └── Reset to 'processing'
                     Retry processing
```

### Postgres Implementation

```sql
-- Check and claim call_id atomically
INSERT INTO call_idempotency (call_id, processing_status, created_at)
VALUES ($call_id, 'processing', NOW())
ON CONFLICT (call_id) DO UPDATE
SET processing_status = CASE
    WHEN call_idempotency.processing_status = 'completed' THEN 'completed'  -- Don't change if completed
    WHEN call_idempotency.created_at < NOW() - INTERVAL '30 seconds' THEN 'processing'  -- Reset stale
    ELSE call_idempotency.processing_status  -- Keep current
END
RETURNING processing_status, response_data, created_at;
```

### After Successful Processing

```sql
UPDATE call_idempotency
SET
    processing_status = 'completed',
    response_data = $response_json,
    lead_id = $lead_uuid
WHERE call_id = $call_id;
```

### Cleanup

```sql
-- Run periodically (e.g., daily cron)
DELETE FROM call_idempotency
WHERE expires_at < NOW();
```

---

## Pseudocode Implementation

### Main Handler

```python
async def handle_webhook(request):
    # 1. VALIDATE
    if not verify_signature(request):
        return Response(status=401, body={"error": "INVALID_SIGNATURE"})

    payload = parse_payload(request.body)
    if not validate_schema(payload):
        return Response(status=400, body={"error": "VALIDATION_ERROR"})

    call_id = payload.call_id

    # 2. IDEMPOTENCY CHECK
    existing = await check_idempotency(call_id)
    if existing and existing.status == "completed":
        return Response(status=200, body=existing.response_data, cached=True)

    if existing and existing.status == "processing":
        if existing.age_seconds < 30:
            return Response(status=409, body={"error": "PROCESSING_IN_PROGRESS"})
        # Stale - continue processing

    await mark_processing(call_id)

    # 3. ROUTE BY EVENT TYPE
    try:
        if payload.event_type == "call_start":
            result = await handle_call_start(payload)
        elif payload.event_type == "transcript_update":
            result = await handle_transcript_update(payload)
        elif payload.event_type == "call_end":
            result = await handle_call_end(payload)
        else:
            raise ValueError(f"Unknown event_type: {payload.event_type}")

        # 4. CACHE AND RETURN
        await mark_completed(call_id, result)
        return Response(status=200, body=result)

    except Exception as e:
        await mark_failed(call_id, str(e))
        return Response(status=500, body={"error": str(e), "retriable": True})


async def handle_call_end(payload):
    transcript = payload.transcript

    # 1. CHECK CONSENT
    consent_status = extract_consent(transcript)

    # 2. DETECT INTENT
    intent = classify_intent(transcript)

    if intent == "spam":
        return {
            "status": "success",
            "lead_status": "spam",
            "actions_taken": ["call_logged"]
        }

    # 3. EXTRACT DATA
    lead_data = await extract_lead_data(transcript, consent_status)
    lead_data.call_id = payload.call_id
    lead_data.consent_status = consent_status
    lead_data.intent = intent

    # 4. HANDLE BOOKING
    booking_result = None
    if lead_data.walkthrough.booked and lead_data.walkthrough.datetime:
        booking_result = await book_calendar_slot({
            "business_name": lead_data.business.business_name,
            "service_address": lead_data.location.full_address,
            "requested_datetime": lead_data.walkthrough.datetime,
            "contact_name": lead_data.contact.caller_name,
            "contact_phone": lead_data.contact.phone,
            "contact_email": lead_data.contact.email,
            "notes": lead_data.call_summary
        })

        if booking_result.success:
            lead_data.walkthrough.calendar_event_id = booking_result.event_id
            lead_data.lead_status = "booked"
        else:
            lead_data.walkthrough.booked = False
            lead_data.lead_status = "new_lead"

    # 5. STORE LEAD
    store_result = await store_lead(lead_data)
    if not store_result.success:
        # Retry once
        await sleep(1)
        store_result = await store_lead(lead_data)
        if not store_result.success:
            raise Exception(f"Failed to store lead: {store_result.error}")

    # 6. SEND NOTIFICATION
    if lead_data.lead_status != "spam":
        await send_gmail_notification({
            "recipient_email": config.OWNER_EMAIL,
            "lead_status": lead_data.lead_status,
            "business_name": lead_data.business.business_name,
            "city": lead_data.location.city,
            "lead_id": store_result.lead_id,
            "caller_name": lead_data.contact.caller_name,
            "phone": lead_data.contact.phone,
            "call_summary": lead_data.call_summary,
            "walkthrough_booked": lead_data.walkthrough.booked,
            "walkthrough_datetime": lead_data.walkthrough.datetime,
            "calendar_event_link": booking_result.event_link if booking_result else None,
            "next_action": lead_data.next_action.action
        })

    # 7. BUILD RESPONSE
    return {
        "status": "success",
        "call_id": payload.call_id,
        "lead_id": store_result.lead_id,
        "lead_status": lead_data.lead_status,
        "actions_taken": build_actions_list(lead_data, booking_result),
        "walkthrough": {
            "booked": lead_data.walkthrough.booked,
            "datetime": lead_data.walkthrough.datetime,
            "calendar_event_id": lead_data.walkthrough.calendar_event_id
        },
        "next_action": lead_data.next_action
    }
```

### Consent Extraction

```python
def extract_consent(transcript):
    """Extract consent status from transcript."""

    consent_patterns = {
        "granted": [
            r"yes,?\s*that'?s?\s*fine",
            r"yes,?\s*okay",
            r"sure,?\s*no problem",
            r"yes,?\s*go ahead",
            r"that's okay",
            r"i don't mind",
        ],
        "denied": [
            r"no,?\s*i'?d?\s*rather not",
            r"please don't record",
            r"i'd prefer (if )?you didn't",
            r"no,?\s*don't record",
            r"i don't want.+recorded",
        ]
    }

    # Find the consent exchange in transcript
    consent_segment = find_consent_segment(transcript)

    if not consent_segment:
        return "not_asked"

    caller_response = extract_caller_response(consent_segment)

    for pattern in consent_patterns["denied"]:
        if re.search(pattern, caller_response, re.IGNORECASE):
            return "denied"

    for pattern in consent_patterns["granted"]:
        if re.search(pattern, caller_response, re.IGNORECASE):
            return "granted"

    return "not_asked"  # Unclear response
```

### Intent Classification

```python
def classify_intent(transcript):
    """Classify caller intent from transcript."""

    spam_keywords = [
        "seo", "marketing", "google listing", "google business",
        "special offer", "business opportunity", "advertising",
        "web design", "social media", "we can help your business"
    ]

    existing_customer_keywords = [
        "already a client", "current customer", "we use you",
        "already work with you", "existing account", "my account",
        "there's an issue", "problem with", "complaint"
    ]

    walkthrough_keywords = [
        "quote", "pricing", "cost", "estimate", "bid",
        "cleaning service", "need a cleaner", "looking for cleaning",
        "hire", "janitorial", "commercial cleaning"
    ]

    info_keywords = [
        "what services", "do you serve", "what areas",
        "how does it work", "just wondering", "information about"
    ]

    transcript_lower = transcript.lower()

    # Check in order of priority
    if any(kw in transcript_lower for kw in spam_keywords):
        return "spam"

    if any(kw in transcript_lower for kw in existing_customer_keywords):
        return "existing_customer"

    if any(kw in transcript_lower for kw in walkthrough_keywords):
        return "walkthrough_request"

    if any(kw in transcript_lower for kw in info_keywords):
        return "info_request"

    return "unknown"
```

---

## Timing Considerations

| Stage | Target Time | Timeout |
|-------|-------------|---------|
| Webhook validation | < 100ms | N/A |
| Idempotency check | < 50ms | 1s |
| AI extraction | < 5s | 30s |
| Store lead | < 200ms | 5s |
| Book calendar | < 2s | 10s |
| Send notification | < 1s | 10s |
| **Total call_end processing** | **< 10s** | **60s** |

### Async Considerations

For real-time voice platforms that need immediate ACK:

1. ACK webhook immediately (< 3s)
2. Queue full processing asynchronously
3. Use callback URL or polling for result

```python
async def handle_webhook_async(request):
    # Quick validation
    if not quick_validate(request):
        return Response(status=400)

    # ACK immediately
    call_id = request.body.call_id

    # Queue for async processing
    await queue.enqueue("process_call", {
        "call_id": call_id,
        "payload": request.body
    })

    return Response(status=202, body={
        "status": "accepted",
        "call_id": call_id,
        "message": "Processing queued"
    })
```
