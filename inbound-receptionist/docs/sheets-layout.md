# Google Sheets Layout - Ace Noir Inbound Receptionist

Alternative to Postgres for simpler deployments. Use Google Sheets API v4 for read/write operations.

## Sheet Structure

Use a single Google Spreadsheet with multiple sheets (tabs):

| Sheet Name | Purpose |
|------------|---------|
| `Leads` | Primary lead data |
| `Calls` | Call log with metadata |
| `Config` | Configuration values |
| `Lookups` | Dropdown values for data validation |

---

## Sheet 1: Leads

### Column Layout (A-AV)

| Col | Header | Data Type | Required | Notes |
|-----|--------|-----------|----------|-------|
| A | `lead_id` | String | Yes | Auto-generated: `lead_YYYYMMDD_NNN` |
| B | `call_id` | String | Yes | Reference to Calls sheet |
| C | `lead_status` | Dropdown | Yes | new_lead, booked, info_only, existing_customer, spam, follow_up_needed |
| D | `consent_status` | Dropdown | Yes | granted, denied, not_asked |
| E | `intent` | Dropdown | Yes | walkthrough_request, quote_request, info_request, existing_customer, spam, unknown |
| F | `caller_name` | String | Yes | |
| G | `phone` | String | Yes | E.164 format preferred |
| H | `phone_source` | Dropdown | | caller_id, confirmed, provided |
| I | `email` | String | | |
| J | `business_name` | String | Yes | |
| K | `facility_type` | Dropdown | Yes | office, medical, dental, school, warehouse, retail, etc. |
| L | `facility_type_other` | String | | If type = other |
| M | `street_address` | String | | |
| N | `city` | String | Yes | |
| O | `state` | String | | Default: CA |
| P | `zip` | String | | |
| Q | `full_address` | String | | Concatenated |
| R | `in_service_area` | Boolean | | TRUE/FALSE |
| S | `approx_sqft` | Number | | |
| T | `sqft_source` | Dropdown | | exact, estimate, proxy |
| U | `size_proxy` | String | | If exact sqft unknown |
| V | `num_restrooms` | Number | | |
| W | `has_breakroom` | Boolean | | TRUE/FALSE |
| X | `has_kitchen` | Boolean | | TRUE/FALSE |
| Y | `floor_types` | String | | Comma-separated: carpet, tile, vct |
| Z | `frequency` | String | Yes | e.g., "3x/week" |
| AA | `times_per_week` | Number | | Parsed frequency |
| AB | `specific_days` | String | | Comma-separated: Mon, Wed, Fri |
| AC | `preferred_time` | String | | e.g., "after 6 PM" |
| AD | `timeline` | String | Yes | When they want to start |
| AE | `timeline_urgency` | Dropdown | | asap, within_2_weeks, within_month, flexible, shopping |
| AF | `add_ons` | String | | Comma-separated list |
| AG | `security_requirements` | String | | |
| AH | `access_instructions` | String | | |
| AI | `compliance_requirements` | String | | Comma-separated: hipaa, osha, etc. |
| AJ | `current_provider` | String | | |
| AK | `reason_for_switch` | String | | |
| AL | `specific_issues` | String | | Comma-separated list |
| AM | `priorities` | String | | |
| AN | `budget_range` | String | | Only if volunteered |
| AO | `walkthrough_requested` | Boolean | | TRUE/FALSE |
| AP | `walkthrough_booked` | Boolean | | TRUE/FALSE |
| AQ | `walkthrough_datetime` | DateTime | | ISO 8601 |
| AR | `calendar_event_id` | String | | Google Calendar event ID |
| AS | `call_summary` | String | | AI-generated summary |
| AT | `next_action` | Dropdown | | confirm_walkthrough, callback_to_schedule, etc. |
| AU | `next_action_deadline` | String | | |
| AV | `created_at` | DateTime | Yes | ISO 8601 |

### Data Validation Rules

```javascript
// Apply these via Google Sheets API or manually

// Lead Status (Column C)
{
  "condition": {
    "type": "ONE_OF_LIST",
    "values": ["new_lead", "booked", "info_only", "existing_customer", "spam", "follow_up_needed"]
  }
}

// Consent Status (Column D)
{
  "condition": {
    "type": "ONE_OF_LIST",
    "values": ["granted", "denied", "not_asked"]
  }
}

// Facility Type (Column K)
{
  "condition": {
    "type": "ONE_OF_LIST",
    "values": ["office", "medical", "dental", "school", "warehouse", "retail", "restaurant", "multi_tenant", "industrial", "gym_fitness", "church", "government", "other"]
  }
}
```

### Conditional Formatting

| Rule | Condition | Format |
|------|-----------|--------|
| New leads | `lead_status = "new_lead"` | Yellow background |
| Booked | `lead_status = "booked"` | Green background |
| Follow-up needed | `lead_status = "follow_up_needed"` | Orange background |
| Spam | `lead_status = "spam"` | Gray text |
| Consent denied | `consent_status = "denied"` | Red border |
| Outside service area | `in_service_area = FALSE` | Blue background |

---

## Sheet 2: Calls

### Column Layout (A-Q)

| Col | Header | Data Type | Required | Notes |
|-----|--------|-----------|----------|-------|
| A | `call_id` | String | Yes | From voice platform |
| B | `lead_id` | String | | Reference to Leads sheet |
| C | `caller_phone` | String | Yes | |
| D | `called_phone` | String | | Ace Noir number |
| E | `call_direction` | String | | inbound/outbound |
| F | `call_status` | String | | completed, failed, no_answer |
| G | `call_duration_seconds` | Number | | |
| H | `consent_status` | Dropdown | Yes | granted, denied, not_asked |
| I | `transcript_stored` | Boolean | | TRUE/FALSE |
| J | `transcript_reference` | String | | Link or "consent_denied" |
| K | `voice_platform` | String | | twilio, vapi, retell, etc. |
| L | `intent_detected` | String | | |
| M | `ai_confidence_score` | Number | | 0.00 - 1.00 |
| N | `processing_status` | Dropdown | | pending, processing, completed, failed |
| O | `processing_error` | String | | Error message if failed |
| P | `received_at` | DateTime | Yes | ISO 8601 |
| Q | `processed_at` | DateTime | | ISO 8601 |

---

## Sheet 3: Config

Simple key-value configuration sheet.

| A (Key) | B (Value) | C (Description) |
|---------|-----------|-----------------|
| `OWNER_EMAIL` | owner@acenoir.com | Email for notifications |
| `CALENDAR_ID` | primary | Google Calendar ID |
| `TIMEZONE` | America/Los_Angeles | Default timezone |
| `WORKING_HOURS_START` | 08:00 | Start of business hours |
| `WORKING_HOURS_END` | 18:00 | End of business hours |
| `WALKTHROUGH_DURATION` | 30 | Default minutes |
| `SERVICE_AREA_PRIMARY` | LA County | Primary service area |
| `BASE_CITY` | Pasadena | Base location |
| `CALLBACK_SLA_HOURS` | 4 | Hours to call back new leads |

---

## Sheet 4: Lookups

Dropdown values for data validation.

### Layout

| A (List Name) | B | C | D | E | F | ... |
|---------------|---|---|---|---|---|-----|
| `lead_status` | new_lead | booked | info_only | existing_customer | spam | follow_up_needed |
| `consent_status` | granted | denied | not_asked | | | |
| `facility_type` | office | medical | dental | school | warehouse | ... |
| `timeline_urgency` | asap | within_2_weeks | within_month | flexible | shopping | |
| `next_action` | confirm_walkthrough | callback_to_schedule | send_info_email | route_to_account_manager | no_action | manual_review |

---

## API Integration Notes

### Reading Data

```javascript
// Using Google Sheets API v4
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Get all leads
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Leads!A:AV',
});

// Get specific lead by ID
const response = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Leads!A:AV',
  // Filter in application code after retrieval
});
```

### Writing Data

```javascript
// Append new lead
const response = await sheets.spreadsheets.values.append({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Leads!A:AV',
  valueInputOption: 'USER_ENTERED',
  insertDataOption: 'INSERT_ROWS',
  requestBody: {
    values: [[
      leadId,      // A: lead_id
      callId,      // B: call_id
      'new_lead',  // C: lead_status
      // ... rest of columns
    ]]
  }
});
```

### Idempotency with Sheets

Since Sheets doesn't have native upsert, implement idempotency by:

1. Before processing, search Calls sheet for `call_id`
2. If found with `processing_status = completed`, return cached row
3. If not found, add new row with `processing_status = processing`
4. After processing, update row with `processing_status = completed`

```javascript
async function checkIdempotency(callId) {
  const calls = await getCallsSheet();
  const existing = calls.find(row => row.call_id === callId);

  if (existing && existing.processing_status === 'completed') {
    return { cached: true, data: existing };
  }

  return { cached: false };
}
```

---

## Lead ID Generation

Since Sheets doesn't have auto-increment, generate lead IDs in application code:

```javascript
function generateLeadId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // Get max sequence from today's leads
  const todayLeads = leads.filter(l => l.lead_id?.startsWith(`lead_${date}_`));
  const maxSeq = todayLeads.reduce((max, l) => {
    const seq = parseInt(l.lead_id.split('_')[2], 10);
    return seq > max ? seq : max;
  }, 0);
  return `lead_${date}_${String(maxSeq + 1).padStart(3, '0')}`;
}
```

---

## Limitations vs Postgres

| Feature | Postgres | Google Sheets |
|---------|----------|---------------|
| Concurrent writes | Excellent | Poor (rate limits) |
| Complex queries | Native SQL | Manual filtering |
| Transactions | ACID | None |
| Auto-increment | Native | Manual |
| Full-text search | Native | None |
| Row limit | Unlimited | 10M cells per spreadsheet |
| API rate limits | Connection pool | 300 requests/min |

**Recommendation:** Use Sheets only for low-volume scenarios (< 50 calls/day). For production scale, migrate to Postgres.
