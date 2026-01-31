# FreightFlow - Multi-Tenant SaaS Logistics App

A production-grade, multi-tenant SaaS logistics application for trucking companies. Built with Next.js 14, PostgreSQL, Prisma, and TypeScript.

## Features

### Core Functionality
- **Email Ingestion**: Automatically import load offers from forwarded emails
- **AI Phone Receptionist**: Twilio-powered voice bot that answers calls and collects load details
- **Load Management**: Accept/deny loads with automated reply emails
- **GPS Tracking**: Real-time driver location tracking with on/off toggle
- **Mileage Export**: CSV exports for tax purposes

### Multi-Tenancy
- Complete tenant isolation at the database level
- Role-based access control (Owner, Admin, Dispatcher, Driver)
- Company-scoped data with Prisma middleware

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v5 with JWT sessions
- **Email**: SendGrid Inbound Parse
- **Telephony**: Twilio Voice & AI
- **Maps**: Mapbox (for GPS tracking)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone and install dependencies:
   \`\`\`bash
   cd logistics-saas
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Edit \`.env\` with your configuration.

3. Set up the database:
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   \`\`\`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open http://localhost:3000

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| NEXTAUTH_URL | Your app URL | Yes |
| NEXTAUTH_SECRET | Random secret for JWT signing | Yes |
| SENDGRID_API_KEY | SendGrid API key for emails | For email features |
| TWILIO_ACCOUNT_SID | Twilio account SID | For phone features |
| OPENAI_API_KEY | OpenAI API key for AI parsing | For AI features |
| NEXT_PUBLIC_MAPBOX_TOKEN | Mapbox token for maps | For GPS tracking |

## User Roles

| Role | Permissions |
|------|-------------|
| Owner | Full access, billing, can delete company |
| Admin | Full access except billing |
| Dispatcher | Manage loads, view drivers, view tracking |
| Driver | View assigned loads, toggle GPS, view own mileage |

## API Routes

- POST /api/auth/register - Register new company/user
- GET/POST /api/loads - List/create load offers
- POST /api/loads/[id]/action - Accept/deny load
- GET/POST /api/drivers - List/create drivers
- GET/POST /api/gps - Get locations / record GPS point
- POST /api/webhooks/email - SendGrid inbound webhook
- POST /api/webhooks/twilio - Twilio voice webhook
- GET /api/export/loads - Export loads CSV
- GET /api/export/mileage - Export mileage CSV

## License

MIT
