# AG Development Platform — Complete Setup Guide

## What You're Building

A full-stack professional web platform with:
- **Public marketing website** (homepage, services, pricing, portfolio, contact, review form)
- **Client portal** (dashboard, tickets, usage, reports, invoices, activity)
- **Admin portal** (dashboard, all tickets, clients, CRM/leads, reports, invoices)
- **Real authentication** (Supabase Auth with role-based access)
- **Real database** (PostgreSQL on Supabase)
- **Email notifications** (Resend)
- **File uploads** for proof screenshots (Supabase Storage)

---

## Step 1 — Create Your Supabase Project (Free)

1. Go to **https://supabase.com** and sign up (free)
2. Click **"New Project"**
3. Fill in:
   - **Name:** ag-development-platform
   - **Database Password:** (save this somewhere safe)
   - **Region:** US East (or closest to you)
4. Wait ~2 minutes for it to spin up

### Get your API keys:
1. In your project, go to **Settings → API**
2. Copy these three values (you'll need them in Step 3):
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
   - **service_role key** (another long string — keep this SECRET)

---

## Step 2 — Run the Database Schema

1. In Supabase, go to **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the ENTIRE contents and paste it into the SQL Editor
5. Click **"Run"** (green button)
6. You should see: "Success. No rows returned"

### Create Storage Buckets:
1. Go to **Storage** in the left sidebar
2. Click **"New bucket"**, name it `proof-uploads`, toggle **Public** to OFF
3. Click **"New bucket"** again, name it `avatars`, toggle **Public** to ON

---

## Step 3 — Create Your Admin User

1. In Supabase, go to **Authentication → Users**
2. Click **"Add User" → "Create new user"**
3. Enter:
   - Email: `admin@agdevelopment.com` (or your email)
   - Password: (something strong)
   - Check "Auto Confirm User"
4. Click Create
5. Go to **SQL Editor** and run this to make them admin:

```sql
UPDATE profiles 
SET role = 'admin', full_name = 'Alex Garcia'
WHERE email = 'admin@agdevelopment.com';
```

---

## Step 4 — Set Up Email (Resend — Free)

1. Go to **https://resend.com** and sign up (free — 3,000 emails/month)
2. Go to **API Keys** and click **"Create API Key"**
3. Name it `ag-development` and copy the key (starts with `re_...`)
4. Go to **Domains** and add your domain (e.g. `agdevelopment.com`)
5. Follow the DNS verification steps (add the records in your domain registrar)

> **Skip domain verification for testing** — Resend allows sending to your own email without it on the free plan.

---

## Step 5 — Set Up the Project Locally

### Requirements:
- **Node.js 18+** — Download from https://nodejs.org
- A code editor (VS Code recommended — free at https://code.visualstudio.com)

### Install steps:

```bash
# 1. Navigate to the project folder
cd ag-development-platform

# 2. Install dependencies
npm install

# 3. Copy the environment file
cp .env.local.example .env.local
```

### Fill in your .env.local:
Open `.env.local` in VS Code and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

RESEND_API_KEY=re_your-resend-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@agdevelopment.com
```

### Start the development server:
```bash
npm run dev
```

Open **http://localhost:3000** in your browser. You should see the homepage!

---

## Step 6 — Test the Platform

### Sign in as admin:
1. Go to http://localhost:3000/login
2. Use the admin email/password you created in Step 3
3. You'll land on the Admin Dashboard

### Create your first client:
1. Go to **Clients → Add Client**
2. Fill in the business details and select a package
3. Click Create — a portal login will be emailed to the client automatically

### Test the client portal:
1. Sign out and sign in with the client's email/temp password
2. You'll see the Client Dashboard
3. Create a test ticket to verify the flow

---

## Step 7 — Deploy to Vercel (Free)

1. Push your code to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/yourusername/ag-development-platform.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** and sign up with your GitHub account (free)

3. Click **"New Project"** and import your GitHub repository

4. In **"Environment Variables"**, add all variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` → set this to your Vercel URL (e.g. `https://agdevelopment.vercel.app`)
   - `ADMIN_EMAIL`

5. Click **"Deploy"** — takes about 2 minutes

6. Update `NEXT_PUBLIC_APP_URL` in Vercel to match your actual deployment URL

### Add your custom domain:
1. In Vercel, go to your project → **Settings → Domains**
2. Add `agdevelopment.com`
3. Follow the DNS instructions (add records in your domain registrar)

---

## Step 8 — Connect Supabase to Your Production URL

1. In Supabase, go to **Authentication → URL Configuration**
2. Set **Site URL** to your production URL (e.g. `https://agdevelopment.com`)
3. Add your URL to **Redirect URLs** as well

---

## Project File Structure

```
ag-development-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Homepage
│   │   ├── login/page.tsx              ← Login page
│   │   ├── review/page.tsx             ← Free website review form
│   │   ├── services/page.tsx           ← Services page
│   │   ├── pricing/page.tsx            ← Pricing page
│   │   ├── portfolio/page.tsx          ← Portfolio page
│   │   ├── contact/page.tsx            ← Contact page
│   │   ├── admin/                      ← Admin portal pages
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tickets/page.tsx
│   │   │   ├── tickets/new/page.tsx
│   │   │   ├── tickets/[id]/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   ├── clients/new/page.tsx
│   │   │   ├── clients/[id]/page.tsx
│   │   │   ├── leads/page.tsx
│   │   │   ├── leads/[id]/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── invoices/page.tsx
│   │   ├── portal/                     ← Client portal pages
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tickets/page.tsx
│   │   │   ├── tickets/new/page.tsx
│   │   │   ├── tickets/[id]/page.tsx
│   │   │   ├── usage/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── invoices/page.tsx
│   │   │   └── activity/page.tsx
│   │   └── api/                        ← API endpoints
│   │       ├── tickets/route.ts
│   │       ├── tickets/[id]/route.ts
│   │       ├── comments/route.ts
│   │       ├── time-entries/route.ts
│   │       ├── proof/route.ts
│   │       ├── upload/route.ts
│   │       ├── leads/route.ts
│   │       ├── leads/[id]/route.ts
│   │       ├── clients/route.ts
│   │       ├── clients/[id]/route.ts
│   │       ├── reports/route.ts
│   │       └── invoices/route.ts
│   ├── components/
│   │   ├── ui/index.tsx                ← Reusable UI components
│   │   ├── portal/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── PortalLayout.tsx
│   │   │   └── NewTicketForm.tsx
│   │   └── public/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               ← Browser Supabase client
│   │   │   └── server.ts               ← Server Supabase client
│   │   ├── email.ts                    ← Resend email functions
│   │   └── utils.ts                    ← Helper functions
│   ├── types/index.ts                  ← TypeScript types
│   └── middleware.ts                   ← Auth route protection
├── supabase/
│   └── schema.sql                      ← Full database schema
├── .env.local.example                  ← Environment variables template
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Monthly Costs (Production)

| Service | Free Tier | Paid (when you scale) |
|---------|-----------|----------------------|
| **Supabase** | 500MB DB, 5GB storage, 50K auth users | $25/month |
| **Vercel** | 100GB bandwidth, unlimited sites | $20/month |
| **Resend** | 3,000 emails/month | $20/month for 50K |
| **Total** | **$0/month to start** | ~$65/month at scale |

---

## Common Issues & Fixes

### "Invalid JWT" or auth errors
→ Make sure your `.env.local` has the correct Supabase URL and anon key

### "Permission denied" on database operations
→ Run the schema SQL again to ensure RLS policies are set

### Emails not sending
→ Check your Resend API key and verify your domain (or use Resend's test mode)

### "relation does not exist" error
→ The schema.sql hasn't been run yet — go to Supabase SQL Editor and run it

---

## Support

For questions about this platform, contact: hello@agdevelopment.com
