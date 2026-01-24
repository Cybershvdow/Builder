# Configuration & Environment Variables

## Overview

All configuration for the Ace Noir Inbound Receptionist is managed through environment variables. This allows easy deployment across environments (development, staging, production) without code changes.

---

## Environment Variables

### Core Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment: `development`, `staging`, `production` |
| `PORT` | No | `3000` | HTTP server port |
| `LOG_LEVEL` | No | `info` | Logging level: `debug`, `info`, `warn`, `error` |

### Company Information

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COMPANY_NAME` | No | `Ace Noir Cleaning Services` | Company name for greetings |
| `BASE_CITY` | No | `Pasadena` | Base location city |
| `BASE_STATE` | No | `CA` | Base location state |
| `SERVICE_AREA` | No | `LA County` | Primary service area description |

### Owner/Notifications

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OWNER_EMAIL` | **Yes** | - | Email address for lead notifications |
| `OWNER_NAME` | No | `Owner` | Name for calendar invites |
| `SALES_EMAIL` | No | (uses OWNER_EMAIL) | Sales team email for walkthrough invites |
| `CALLBACK_SLA_HOURS` | No | `4` | Hours to call back new leads |

### Database (Postgres)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes*** | - | Full Postgres connection string |
| `DB_HOST` | No | `localhost` | Database host (if not using DATABASE_URL) |
| `DB_PORT` | No | `5432` | Database port |
| `DB_NAME` | No | `inbound_receptionist` | Database name |
| `DB_USER` | No | - | Database user |
| `DB_PASSWORD` | No | - | Database password |
| `DB_SSL` | No | `false` | Enable SSL connection |
| `DB_POOL_MIN` | No | `2` | Minimum pool connections |
| `DB_POOL_MAX` | No | `10` | Maximum pool connections |

*Either `DATABASE_URL` or individual DB_ variables required

### Google Sheets (Alternative to Postgres)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `USE_GOOGLE_SHEETS` | No | `false` | Use Sheets instead of Postgres |
| `GOOGLE_SHEET_ID` | If Sheets | - | Google Spreadsheet ID |
| `GOOGLE_SHEETS_CREDENTIALS` | If Sheets | - | Path to service account JSON |

### Google Calendar

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CALENDAR_ID` | **Yes** | `primary` | Calendar ID for walkthroughs |
| `GOOGLE_CALENDAR_CREDENTIALS` | **Yes** | - | Path to service account JSON or credentials JSON |
| `WALKTHROUGH_DURATION_MINUTES` | No | `30` | Default walkthrough duration |

### Gmail / Email

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GMAIL_CREDENTIALS` | **Yes** | - | Path to Gmail OAuth/service account credentials |
| `GMAIL_FROM_ADDRESS` | No | (service account email) | From address for notifications |
| `EMAIL_PROVIDER` | No | `gmail` | Email provider: `gmail`, `sendgrid`, `ses` |
| `SENDGRID_API_KEY` | If SendGrid | - | SendGrid API key |

### AI / LLM

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | `anthropic` | AI provider: `anthropic`, `openai` |
| `ANTHROPIC_API_KEY` | If Anthropic | - | Anthropic API key |
| `OPENAI_API_KEY` | If OpenAI | - | OpenAI API key |
| `AI_MODEL` | No | `claude-3-sonnet-20240229` | Model ID to use |
| `AI_MAX_TOKENS` | No | `4096` | Max tokens for extraction |
| `AI_TEMPERATURE` | No | `0.1` | Temperature for extraction (low for determinism) |

### Webhook Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEBHOOK_SECRET` | **Yes** | - | Secret for webhook signature verification |
| `WEBHOOK_SIGNATURE_HEADER` | No | `X-Webhook-Signature` | Header name for signature |
| `WEBHOOK_SIGNATURE_ALGO` | No | `sha256` | HMAC algorithm |

### Business Hours

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TIMEZONE` | No | `America/Los_Angeles` | Default timezone |
| `WORKING_HOURS_START` | No | `08:00` | Business hours start (24h format) |
| `WORKING_HOURS_END` | No | `18:00` | Business hours end (24h format) |
| `WORKING_DAYS` | No | `1,2,3,4,5` | Working days (1=Mon, 7=Sun) |

### Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_ENABLED` | No | `true` | Enable rate limiting |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window (1 minute) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |

### Retry Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RETRY_MAX_ATTEMPTS` | No | `3` | Maximum retry attempts |
| `RETRY_INITIAL_DELAY_MS` | No | `1000` | Initial retry delay |
| `RETRY_MAX_DELAY_MS` | No | `10000` | Maximum retry delay |
| `RETRY_BACKOFF_MULTIPLIER` | No | `2` | Exponential backoff multiplier |

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_CALENDAR_BOOKING` | No | `true` | Enable calendar integration |
| `ENABLE_EMAIL_NOTIFICATIONS` | No | `true` | Enable email notifications |
| `ENABLE_TRANSCRIPT_STORAGE` | No | `true` | Store transcripts (if consent) |
| `ENABLE_SPAM_DETECTION` | No | `true` | Enable spam call detection |
| `ENABLE_SERVICE_AREA_CHECK` | No | `true` | Flag out-of-area leads |

---

## Example `.env` File

```bash
# ============================================
# ACE NOIR INBOUND RECEPTIONIST CONFIGURATION
# ============================================

# Environment
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Company
COMPANY_NAME="Ace Noir Cleaning Services"
BASE_CITY=Pasadena
BASE_STATE=CA
SERVICE_AREA="LA County"

# Owner/Notifications
OWNER_EMAIL=owner@acenoir.com
OWNER_NAME="John Smith"
SALES_EMAIL=sales@acenoir.com
CALLBACK_SLA_HOURS=4

# Database (Postgres) - use connection string
DATABASE_URL=postgresql://user:password@localhost:5432/inbound_receptionist?sslmode=require

# OR use individual settings:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=inbound_receptionist
# DB_USER=receptionist_app
# DB_PASSWORD=secure_password_here
# DB_SSL=true

# Google Sheets (alternative - uncomment if using)
# USE_GOOGLE_SHEETS=true
# GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
# GOOGLE_SHEETS_CREDENTIALS=/secrets/sheets-service-account.json

# Google Calendar
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_CREDENTIALS=/secrets/calendar-credentials.json
WALKTHROUGH_DURATION_MINUTES=30

# Gmail
GMAIL_CREDENTIALS=/secrets/gmail-credentials.json
# GMAIL_FROM_ADDRESS=receptionist@acenoir.com

# AI Provider
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-xxx
AI_MODEL=claude-3-sonnet-20240229
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.1

# Webhook Security
WEBHOOK_SECRET=your-webhook-secret-minimum-32-chars
WEBHOOK_SIGNATURE_HEADER=X-Webhook-Signature
WEBHOOK_SIGNATURE_ALGO=sha256

# Business Hours
TIMEZONE=America/Los_Angeles
WORKING_HOURS_START=08:00
WORKING_HOURS_END=18:00
WORKING_DAYS=1,2,3,4,5

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Retry Configuration
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY_MS=1000
RETRY_MAX_DELAY_MS=10000
RETRY_BACKOFF_MULTIPLIER=2

# Feature Flags
ENABLE_CALENDAR_BOOKING=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_TRANSCRIPT_STORAGE=true
ENABLE_SPAM_DETECTION=true
ENABLE_SERVICE_AREA_CHECK=true
```

---

## Secrets Management

### Required Secrets

| Secret | Format | Description |
|--------|--------|-------------|
| `WEBHOOK_SECRET` | String (32+ chars) | HMAC secret for webhook verification |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Anthropic API key |
| `DATABASE_URL` | Connection string | Contains DB password |
| `GOOGLE_CALENDAR_CREDENTIALS` | JSON file | Service account credentials |
| `GMAIL_CREDENTIALS` | JSON file | OAuth or service account credentials |

### Secret Storage Options

#### Option 1: Environment Variables (Development)

```bash
export ANTHROPIC_API_KEY=sk-ant-api03-xxx
export WEBHOOK_SECRET=your-secret-here
```

#### Option 2: `.env` File (Development/Staging)

```bash
# .env file (add to .gitignore!)
ANTHROPIC_API_KEY=sk-ant-api03-xxx
WEBHOOK_SECRET=your-secret-here
```

#### Option 3: Docker Secrets (Production)

```yaml
# docker-compose.yml
services:
  receptionist:
    secrets:
      - anthropic_api_key
      - webhook_secret
      - db_password
    environment:
      - ANTHROPIC_API_KEY_FILE=/run/secrets/anthropic_api_key

secrets:
  anthropic_api_key:
    external: true
  webhook_secret:
    external: true
```

#### Option 4: Cloud Secret Manager (Production)

```javascript
// AWS Secrets Manager
const secrets = await secretsManager.getSecretValue({
  SecretId: 'inbound-receptionist/production'
}).promise();

// Google Secret Manager
const [version] = await secretManager.accessSecretVersion({
  name: 'projects/my-project/secrets/anthropic-api-key/versions/latest'
});
```

---

## Google API Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: `ace-noir-receptionist`
3. Enable APIs:
   - Google Calendar API
   - Gmail API
   - Google Sheets API (if using)

### 2. Service Account Setup

```bash
# Create service account
gcloud iam service-accounts create receptionist-sa \
  --display-name="Inbound Receptionist Service Account"

# Grant Calendar access
gcloud projects add-iam-policy-binding ace-noir-receptionist \
  --member="serviceAccount:receptionist-sa@ace-noir-receptionist.iam.gserviceaccount.com" \
  --role="roles/calendar.events"

# Generate key
gcloud iam service-accounts keys create ./secrets/service-account.json \
  --iam-account=receptionist-sa@ace-noir-receptionist.iam.gserviceaccount.com
```

### 3. Calendar Sharing

1. Go to Google Calendar settings
2. Share calendar with service account email
3. Grant "Make changes to events" permission

### 4. Gmail Domain-Wide Delegation (for G Workspace)

1. Go to Google Workspace Admin > Security > API Controls
2. Manage domain-wide delegation
3. Add service account client ID
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/calendar.events`

---

## Validation

### Configuration Validation Script

```javascript
// scripts/validate-config.js
const required = [
  'OWNER_EMAIL',
  'WEBHOOK_SECRET',
  'ANTHROPIC_API_KEY', // or OPENAI_API_KEY
  'GOOGLE_CALENDAR_CREDENTIALS',
  'GMAIL_CREDENTIALS',
];

const dbRequired = process.env.USE_GOOGLE_SHEETS === 'true'
  ? ['GOOGLE_SHEET_ID', 'GOOGLE_SHEETS_CREDENTIALS']
  : ['DATABASE_URL']; // or DB_HOST + DB_USER + DB_PASSWORD

const allRequired = [...required, ...dbRequired];

const missing = allRequired.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('Configuration validated successfully!');
```

### Run Validation

```bash
node scripts/validate-config.js
```

---

## Environment-Specific Overrides

### Development

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://localhost:5432/receptionist_dev
ENABLE_EMAIL_NOTIFICATIONS=false  # Don't spam during dev
AI_MODEL=claude-3-haiku-20240307  # Cheaper for testing
```

### Staging

```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=postgresql://staging-db:5432/receptionist_staging
OWNER_EMAIL=staging-test@acenoir.com
```

### Production

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
DATABASE_URL=postgresql://prod-db:5432/receptionist_prod?sslmode=require
DB_POOL_MIN=5
DB_POOL_MAX=20
RATE_LIMIT_MAX_REQUESTS=200
```

---

## Configuration Loading Order

```
1. Default values (hardcoded)
2. .env file (if exists)
3. .env.{NODE_ENV} file (if exists)
4. Environment variables
5. Docker secrets (if running in Docker)
6. Cloud secret manager (if configured)
```

Later sources override earlier ones.
