# Error Handling & Observability

## Overview

This document defines error handling strategies, retry policies, validation rules, human fallback procedures, and logging/monitoring practices for the Ace Noir Inbound Receptionist system.

---

## Error Categories

### 1. Validation Errors (4xx)

Errors caused by invalid input data.

| Error Code | HTTP Status | Description | Retriable |
|------------|-------------|-------------|-----------|
| `VALIDATION_ERROR` | 400 | Payload schema validation failed | No |
| `MISSING_FIELD` | 400 | Required field missing | No |
| `INVALID_FORMAT` | 400 | Field format invalid (e.g., phone, email) | No |
| `INVALID_SIGNATURE` | 401 | Webhook signature verification failed | No |
| `UNKNOWN_EVENT_TYPE` | 400 | Unrecognized event_type | No |

### 2. Processing Errors (5xx)

Errors during call processing.

| Error Code | HTTP Status | Description | Retriable |
|------------|-------------|-------------|-----------|
| `AI_EXTRACTION_FAILED` | 500 | AI could not parse transcript | Yes |
| `STORE_FAILED` | 500 | Database write failed | Yes |
| `CALENDAR_FAILED` | 500 | Google Calendar API error | Yes |
| `NOTIFICATION_FAILED` | 500 | Gmail send failed | Yes |
| `TIMEOUT` | 504 | Processing exceeded timeout | Yes |

### 3. External Service Errors

| Error Code | HTTP Status | Description | Retriable |
|------------|-------------|-------------|-----------|
| `DB_CONNECTION_ERROR` | 503 | Cannot connect to Postgres | Yes |
| `SHEETS_API_ERROR` | 503 | Google Sheets API error | Yes |
| `CALENDAR_API_ERROR` | 503 | Google Calendar API error | Yes |
| `GMAIL_API_ERROR` | 503 | Gmail API error | Yes |
| `AI_API_ERROR` | 503 | Claude/GPT API error | Yes |
| `RATE_LIMITED` | 429 | External API rate limit hit | Yes (after delay) |

---

## Retry Policy

### Default Retry Configuration

```javascript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'STORE_FAILED',
    'CALENDAR_FAILED',
    'NOTIFICATION_FAILED',
    'DB_CONNECTION_ERROR',
    'SHEETS_API_ERROR',
    'CALENDAR_API_ERROR',
    'GMAIL_API_ERROR',
    'AI_API_ERROR',
    'TIMEOUT'
  ]
};
```

### Exponential Backoff Implementation

```python
async def with_retry(operation, config=RETRY_CONFIG):
    """Execute operation with exponential backoff retry."""
    last_error = None
    delay = config.initial_delay_ms

    for attempt in range(config.max_retries + 1):
        try:
            return await operation()
        except Exception as e:
            last_error = e
            error_code = getattr(e, 'code', 'UNKNOWN')

            if error_code not in config.retryable_errors:
                raise  # Non-retryable, fail immediately

            if attempt == config.max_retries:
                break  # No more retries

            # Log retry attempt
            log.warning(f"Retry {attempt + 1}/{config.max_retries} after {delay}ms",
                       error=str(e), error_code=error_code)

            await sleep(delay / 1000)
            delay = min(delay * config.backoff_multiplier, config.max_delay_ms)

    # All retries exhausted
    raise RetryExhaustedError(
        f"Operation failed after {config.max_retries} retries",
        last_error=last_error
    )
```

### Per-Operation Retry Policies

| Operation | Max Retries | Initial Delay | Notes |
|-----------|-------------|---------------|-------|
| Store Lead | 2 | 500ms | Critical - must succeed |
| Book Calendar | 2 | 1s | Non-blocking - continue if fails |
| Send Notification | 1 | 1s | Non-blocking - log if fails |
| AI Extraction | 1 | 2s | Expensive - limit retries |

---

## Validation Rules

### Webhook Payload Validation

```javascript
const webhookValidation = {
  call_id: {
    required: true,
    type: 'string',
    pattern: /^[a-zA-Z0-9_-]{8,64}$/,
    errorMessage: 'call_id must be 8-64 alphanumeric characters'
  },
  event_type: {
    required: true,
    type: 'string',
    enum: ['call_start', 'transcript_update', 'call_end'],
    errorMessage: 'event_type must be call_start, transcript_update, or call_end'
  },
  timestamp: {
    required: true,
    type: 'string',
    format: 'iso8601',
    errorMessage: 'timestamp must be ISO 8601 format'
  },
  caller_phone: {
    required: false,
    type: 'string',
    pattern: /^\+?[1-9]\d{1,14}$/,
    errorMessage: 'caller_phone must be E.164 format'
  }
};
```

### Lead Data Validation

```javascript
const leadValidation = {
  contact: {
    caller_name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    phone: {
      required: true,
      type: 'string',
      pattern: /^\+?[0-9\-\s\(\)]{7,20}$/
    },
    email: {
      required: false,
      type: 'string',
      format: 'email'
    }
  },
  business: {
    business_name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 200
    },
    facility_type: {
      required: true,
      type: 'string',
      enum: FACILITY_TYPES
    }
  },
  location: {
    city: {
      required: true,
      type: 'string',
      minLength: 1
    }
  },
  service_requirements: {
    frequency: {
      required: true,
      type: 'string'
    },
    timeline: {
      required: true,
      type: 'string'
    }
  }
};
```

### JSON Repair Strategy

If AI output is malformed JSON:

```python
def repair_json(raw_output):
    """Attempt to repair malformed JSON from AI output."""

    # Strategy 1: Extract JSON from markdown code blocks
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', raw_output)
    if json_match:
        raw_output = json_match.group(1)

    # Strategy 2: Fix common issues
    repairs = [
        (r',\s*}', '}'),  # Trailing commas
        (r',\s*]', ']'),  # Trailing commas in arrays
        (r'"\s*:\s*undefined', '": null'),  # undefined → null
        (r"'", '"'),  # Single quotes → double quotes
    ]

    for pattern, replacement in repairs:
        raw_output = re.sub(pattern, replacement, raw_output)

    # Strategy 3: Try parsing
    try:
        return json.loads(raw_output)
    except json.JSONDecodeError as e:
        # Strategy 4: Re-ask AI with error context
        raise AIRepairNeededError(
            f"JSON parse failed at position {e.pos}: {e.msg}",
            raw_output=raw_output
        )
```

---

## Human Fallback Procedures

### When to Escalate to Human

| Condition | Fallback Action |
|-----------|-----------------|
| AI extraction fails after retries | Queue for manual transcription review |
| Consent status unclear | Flag for manual review, assume not_asked |
| Intent unclear + high value signals | Flag for immediate callback |
| Location far outside service area | Flag for manual decision |
| Booking conflicts with no alternatives | Queue for manual scheduling |
| Database down | Log to backup file, alert ops |

### Fallback Queue Structure

```json
{
  "fallback_id": "fb_20260124_001",
  "call_id": "call_abc123",
  "reason": "AI_EXTRACTION_FAILED",
  "severity": "high",
  "data": {
    "caller_phone": "+16265551234",
    "transcript_available": true,
    "partial_extraction": {
      "caller_name": "Sarah",
      "business_name": null
    }
  },
  "created_at": "2026-01-24T14:32:45Z",
  "assigned_to": null,
  "status": "pending",
  "resolution": null
}
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Failed extractions/hour | > 3 | > 10 |
| Database errors/hour | > 1 | > 5 |
| Calendar booking failures/day | > 5 | > 15 |
| Average processing time | > 15s | > 30s |
| Fallback queue depth | > 5 | > 20 |

---

## Logging Standards

### Log Levels

| Level | Usage |
|-------|-------|
| `DEBUG` | Detailed processing steps, AI prompts/responses |
| `INFO` | Normal operations, successful completions |
| `WARN` | Retries, partial failures, unusual but handled conditions |
| `ERROR` | Failed operations requiring attention |
| `FATAL` | System-wide failures, startup errors |

### Structured Log Format

```json
{
  "timestamp": "2026-01-24T14:32:45.123Z",
  "level": "INFO",
  "service": "inbound-receptionist",
  "component": "webhook-handler",
  "call_id": "call_abc123",
  "lead_id": "lead_20260124_001",
  "event": "lead_stored",
  "duration_ms": 234,
  "metadata": {
    "lead_status": "booked",
    "intent": "walkthrough_request",
    "in_service_area": true
  }
}
```

### Required Log Fields by Event

#### Webhook Received

```json
{
  "event": "webhook_received",
  "call_id": "string",
  "event_type": "call_start|transcript_update|call_end",
  "caller_phone": "string (masked)",
  "signature_valid": true
}
```

#### Processing Started

```json
{
  "event": "processing_started",
  "call_id": "string",
  "idempotency_status": "new|cached|retry"
}
```

#### AI Extraction

```json
{
  "event": "ai_extraction_complete",
  "call_id": "string",
  "intent_detected": "string",
  "consent_status": "string",
  "fields_extracted": 15,
  "confidence_score": 0.95,
  "duration_ms": 3456
}
```

#### Lead Stored

```json
{
  "event": "lead_stored",
  "call_id": "string",
  "lead_id": "string",
  "lead_status": "string",
  "is_new": true,
  "duration_ms": 123
}
```

#### Calendar Booked

```json
{
  "event": "calendar_booked",
  "call_id": "string",
  "lead_id": "string",
  "event_id": "string",
  "datetime": "ISO8601",
  "duration_ms": 890
}
```

#### Notification Sent

```json
{
  "event": "notification_sent",
  "call_id": "string",
  "lead_id": "string",
  "recipient": "owner@acenoir.com",
  "message_id": "string",
  "duration_ms": 456
}
```

#### Error

```json
{
  "event": "error",
  "call_id": "string",
  "error_code": "STORE_FAILED",
  "error_message": "Database connection timeout",
  "retry_count": 2,
  "stack_trace": "string (DEBUG only)"
}
```

---

## Observability Dashboard Metrics

### Key Performance Indicators (KPIs)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INBOUND RECEPTIONIST DASHBOARD                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CALLS TODAY          LEADS CAPTURED       WALKTHROUGHS BOOKED     │
│  ┌─────────┐          ┌─────────┐          ┌─────────┐             │
│  │   47    │          │   38    │          │   15    │             │
│  └─────────┘          └─────────┘          └─────────┘             │
│  +12 vs yesterday     81% capture rate     39% booking rate        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROCESSING TIME (p50/p95/p99)    ERROR RATE    FALLBACK QUEUE     │
│  ┌─────────────────────────┐      ┌─────────┐   ┌─────────┐        │
│  │  2.3s / 5.1s / 8.9s     │      │  0.8%   │   │    2    │        │
│  └─────────────────────────┘      └─────────┘   └─────────┘        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  INTENT BREAKDOWN (Today)          LEAD STATUS (Today)             │
│  ┌──────────────────────────┐     ┌──────────────────────────┐     │
│  │ Walkthrough: 38 (81%)    │     │ Booked: 15 (39%)         │     │
│  │ Info Only:    5 (11%)    │     │ New Lead: 18 (47%)       │     │
│  │ Existing:     2 (4%)     │     │ Follow-up: 3 (8%)        │     │
│  │ Spam:         2 (4%)     │     │ Info Only: 2 (5%)        │     │
│  └──────────────────────────┘     └──────────────────────────┘     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CONSENT STATUS              SERVICE AREA                          │
│  ┌────────────────────────┐  ┌────────────────────────────────┐    │
│  │ Granted: 44 (94%)      │  │ In Area: 35 (92%)              │    │
│  │ Denied:   2 (4%)       │  │ Outside: 3 (8%) → follow_up    │    │
│  │ Not Asked: 1 (2%)      │  └────────────────────────────────┘    │
│  └────────────────────────┘                                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Prometheus Metrics

```prometheus
# Counter: Total webhooks received
inbound_webhooks_total{event_type="call_end", status="success"} 156

# Counter: Leads by status
inbound_leads_total{status="booked"} 45
inbound_leads_total{status="new_lead"} 67
inbound_leads_total{status="spam"} 12

# Histogram: Processing duration
inbound_processing_duration_seconds_bucket{le="1"} 50
inbound_processing_duration_seconds_bucket{le="5"} 140
inbound_processing_duration_seconds_bucket{le="10"} 155

# Gauge: Fallback queue depth
inbound_fallback_queue_depth 2

# Counter: Errors by type
inbound_errors_total{error_code="STORE_FAILED"} 3
inbound_errors_total{error_code="AI_EXTRACTION_FAILED"} 1

# Histogram: AI extraction confidence
inbound_ai_confidence_bucket{le="0.7"} 5
inbound_ai_confidence_bucket{le="0.9"} 120
inbound_ai_confidence_bucket{le="1.0"} 156

# Counter: Consent status
inbound_consent_total{status="granted"} 150
inbound_consent_total{status="denied"} 5
inbound_consent_total{status="not_asked"} 1
```

### Alert Rules

```yaml
# Prometheus AlertManager rules
groups:
  - name: inbound-receptionist
    rules:
      - alert: HighErrorRate
        expr: rate(inbound_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate in inbound receptionist"

      - alert: ProcessingLatency
        expr: histogram_quantile(0.95, inbound_processing_duration_seconds_bucket) > 15
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "p95 processing time exceeds 15 seconds"

      - alert: FallbackQueueBacklog
        expr: inbound_fallback_queue_depth > 10
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Fallback queue has more than 10 items"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL database is down"
```

---

## Health Check Endpoints

### `/health`

Basic liveness check.

```json
{
  "status": "healthy",
  "timestamp": "2026-01-24T14:32:45Z"
}
```

### `/health/ready`

Readiness check including dependencies.

```json
{
  "status": "ready",
  "timestamp": "2026-01-24T14:32:45Z",
  "checks": {
    "database": {
      "status": "healthy",
      "latency_ms": 5
    },
    "google_calendar": {
      "status": "healthy",
      "latency_ms": 120
    },
    "gmail": {
      "status": "healthy",
      "latency_ms": 85
    },
    "ai_api": {
      "status": "healthy",
      "latency_ms": 450
    }
  }
}
```

### `/metrics`

Prometheus metrics endpoint (see above).

---

## Backup and Recovery

### Backup Log File

If primary database is unavailable, write to backup file:

```
/var/log/inbound-receptionist/backup_leads.jsonl
```

Format (JSON Lines):

```json
{"timestamp":"2026-01-24T14:32:45Z","call_id":"call_abc123","data":{...}}
{"timestamp":"2026-01-24T14:35:12Z","call_id":"call_def456","data":{...}}
```

### Recovery Procedure

1. Alert triggers on database outage
2. System switches to backup file logging
3. When database recovers, run recovery script:

```bash
./scripts/recover_backup_leads.sh /var/log/inbound-receptionist/backup_leads.jsonl
```

4. Script replays leads with idempotency check
5. Verify counts match, archive backup file
