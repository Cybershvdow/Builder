# Ace Noir Employee Management App

A comprehensive employee tracking and management system built for Ace Noir Cleaning Services L.L.C.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)

## Features

- **User Management** - Invite employees via email, manage roles and permissions
- **GPS Time Tracking** - Clock in/out with GPS location verification
- **Timesheets** - View, edit, and approve time entries with bi-weekly pay periods
- **Export** - Download timesheets as CSV, Excel, or PDF
- **Job Scheduling** - Interactive calendar for assigning employees to facilities
- **Messaging** - Direct messages and group chats
- **Facility Management** - Manage all cleaning locations
- **Mobile Responsive** - Works on all devices

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Optional: Resend account for email invites

### 1. Clone and Install

```bash
cd ace-noir-employee-app
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (~2 minutes)
3. Go to **SQL Editor** in your Supabase dashboard
4. Copy the contents of `supabase/schema.sql` and run it
5. Copy the contents of `supabase/seed.sql` and run it (this adds your facilities)

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
# Get these from Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: For email invites (get from resend.com)
RESEND_API_KEY=re_xxxxxxxx

# App settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_COMPANY_NAME=Ace Noir Cleaning Services
NEXT_PUBLIC_COMPANY_EMAIL=info@acenoirclean.com
NEXT_PUBLIC_COMPANY_PHONE=626-788-2108
```

### 4. Create Your Admin Account

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" and create your admin account
3. Go to SQL Editor and run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in!

## Project Structure

```
ace-noir-employee-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Main dashboard
│   │   ├── users/             # User management
│   │   ├── time-tracking/     # GPS clock in/out
│   │   ├── timesheets/        # Timesheet management
│   │   ├── schedule/          # Job scheduling calendar
│   │   ├── messages/          # Messaging system
│   │   ├── facilities/        # Facility management
│   │   └── settings/          # User settings
│   ├── components/            # React components
│   │   └── layout/           # Sidebar, Header
│   ├── lib/                   # Utilities
│   │   ├── supabase/         # Supabase clients
│   │   └── utils.ts          # Helper functions
│   ├── store/                 # Zustand state management
│   └── types/                 # TypeScript types
├── supabase/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Initial data
└── public/                    # Static assets
```

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access - manage users, facilities, all timesheets |
| **Manager** | View all timesheets, create schedules, manage facilities |
| **Employee** | Clock in/out, view own timesheet, view schedule, messaging |

## Pre-loaded Facilities

The app comes with 6 pre-configured facilities:

1. Love Bug N Me - South Pasadena
2. Maison Louis Marie - Los Angeles
3. Harvest Pack Inc - Arcadia
4. Uplift Therapy Center - La Cañada Flintridge
5. Pasadena Chamber of Commerce - Pasadena
6. Western Sound - Los Angeles

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add your environment variables
5. Deploy!

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)
- `NEXT_PUBLIC_COMPANY_NAME`

## White-Label / Reselling

This app is designed to be easily rebranded:

1. **Colors**: Edit `tailwind.config.ts` to change brand colors
2. **Company Name**: Update `NEXT_PUBLIC_COMPANY_NAME` in environment
3. **Logo**: Replace the logo in the Sidebar component
4. **Database**: Each customer gets their own Supabase project

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: Zustand
- **Email**: Resend
- **Icons**: Heroicons

## Support

For questions or issues, contact:
- Email: info@acenoirclean.com
- Phone: 626-788-2108

---

Built with ❤️ for Ace Noir Cleaning Services L.L.C.
