# n8n Workflow Setup Guide

## Import the Workflow

1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Select `workflow.json` from this directory
4. The workflow will be imported with all nodes configured

## Required Credentials

Before activating the workflow, you need to set up the following credentials in n8n:

### 1. Anthropic API (for AI extraction)

- Go to **Credentials** → **New Credential** → **Anthropic API**
- Name it: `Anthropic API`
- Enter your API key from [console.anthropic.com](https://console.anthropic.com)
- Update the credential ID in the workflow's "AI - Extract Lead Data" node

### 2. PostgreSQL Database

- Go to **Credentials** → **New Credential** → **Postgres**
- Name it: `Postgres`
- Configure:
  - Host: your database host
  - Database: `inbound_receptionist`
  - User: your db user
  - Password: your db password
  - SSL: enable if required
- Run the SQL schema from `../sql/schema.sql` to create tables

### 3. Google Calendar

- Go to **Credentials** → **New Credential** → **Google Calendar OAuth2 API**
- Follow the OAuth flow to connect your Google account
- Make sure the calendar you want to use is accessible

### 4. Gmail

- Go to **Credentials** → **New Credential** → **Gmail OAuth2 API**
- Follow the OAuth flow to connect your Gmail account
- Grant send permissions

## Environment Variables

Set these in n8n Settings → Environment Variables:

```
OWNER_EMAIL=owner@acenoir.com
GOOGLE_CALENDAR_ID=primary
```

## Webhook URL

After importing, the webhook URL will be:

```
https://your-n8n-instance.com/webhook/inbound-call
```

or for testing:

```
https://your-n8n-instance.com/webhook-test/inbound-call
```

Configure your voice platform (Twilio, Vapi, Retell, etc.) to send call events to this URL.

## Workflow Flow

```
Webhook Trigger
    │
    ▼
Validate Payload ─────► If not call_end ─────► ACK Response
    │
    ▼ (call_end only)
AI Extract Lead Data (Claude)
    │
    ▼
Merge & Format Data
    │
    ▼
Is Spam? ─────► Yes ─────► Log & Respond (spam)
    │
    ▼ No
Store in Postgres
    │
    ▼
Needs Booking? ─────► Yes ─────► Create Calendar Event
    │                                   │
    ▼ No                                ▼
    └─────────────► Merge ◄─────────────┘
                      │
                      ▼
              Send Email Notification
                      │
                      ▼
              Build Success Response
                      │
                      ▼
                  Respond
```

## Testing

1. Activate the workflow
2. Use the webhook test URL to send a test payload:

```bash
curl -X POST https://your-n8n-instance.com/webhook-test/inbound-call \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test_call_001",
    "event_type": "call_end",
    "timestamp": "2026-01-24T14:30:00Z",
    "caller_phone": "+16265551234",
    "call_duration_seconds": 180,
    "transcript": {
      "mode": "single_shot",
      "full_text": "Agent: Thank you for calling Ace Noir Cleaning Services. This call may be recorded for quality purposes. Is that okay?\n\nCaller: Yes, thats fine.\n\nAgent: Great, how can I help you today?\n\nCaller: Hi, I need a quote for cleaning our office in Pasadena. Its about 2000 square feet.\n\nAgent: Id be happy to help. Whats your name?\n\nCaller: John Smith.\n\nAgent: And your business name?\n\nCaller: Smith Consulting.\n\nAgent: Perfect. How often would you like cleaning?\n\nCaller: Three times a week.\n\nAgent: When are you looking to start?\n\nCaller: As soon as possible.\n\nAgent: Would you like to schedule a walkthrough?\n\nCaller: Yes please.\n\nAgent: How about Thursday at 2pm?\n\nCaller: That works.\n\nAgent: Great, youre all set. Whats your email?\n\nCaller: john@smithconsulting.com\n\nAgent: Perfect. See you Thursday!"
    }
  }'
```

3. Check that:
   - A lead was created in Postgres
   - A calendar event was created
   - An email notification was sent
   - The response includes lead_id and status

## Customization

### Change AI Model

Edit the "AI - Extract Lead Data" node and change the `model` parameter to:
- `claude-3-opus-20240229` (more accurate, slower, more expensive)
- `claude-3-haiku-20240307` (faster, cheaper, less accurate)

### Use Google Sheets Instead of Postgres

1. Remove the "Store Lead - Postgres" node
2. Add a "Google Sheets" node with:
   - Spreadsheet ID: your sheet ID
   - Sheet: "Leads"
   - Operation: Append Row
   - Map all fields to columns

### Add Slack Notification

1. Add a "Slack" node after "Send Email Notification"
2. Configure with your Slack credentials
3. Send message to your #leads channel

## Troubleshooting

### AI extraction fails
- Check Anthropic API key is valid
- Review transcript format in logs
- Increase timeout if needed

### Database insert fails
- Verify Postgres credentials
- Check table schema matches
- Review SQL error in execution log

### Calendar event not created
- Verify Google Calendar credentials
- Check calendar sharing permissions
- Ensure datetime format is valid ISO 8601

### Email not sent
- Verify Gmail credentials
- Check OAuth scopes include send permission
- Review email content for issues
