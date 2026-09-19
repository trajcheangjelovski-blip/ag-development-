# AG Development Platform — Master Reference

> **Single source of truth** for the whole platform: what it is, how it's built, how to set it
> up from scratch, how it's deployed, and how to work on it. This file consolidates the four
> previous docs (`PROJECT.md`, `SETUP.md`, `HETZNER_DEPLOY.md`, `TRANSLATION_GEO_PLAN.md`).
> Keep it updated as the project evolves.

Last consolidated: 2026-09-17 · App domain: **ag-development.dev**

> **Note on the old docs.** Where the source files disagreed, this file follows the *current
> production reality* (Caddy on Hetzner, confirmed by the repo's `deploy.sh` /
> `docker-compose.yml` / `Caddyfile`). Superseded methods (Vercel, the earlier Nginx setup) are
> kept below under **§13.3 Legacy / alternative deploy paths** so nothing is lost, but they are
> **not** how the site runs today.

---

## 1. What this is

A **full-stack platform for a web-development & remote L1 IT-support agency** (`ag-development.dev`).
One codebase, three audiences:

1. **Public marketing site** — home, about, services, pricing, portfolio, demos, order/checkout, review, contact.
2. **Client portal** (`/portal/*`) — logged-in clients see tickets, invoices, usage, reports, activity, chat.
3. **Admin CRM** (`/admin/*`) — manage clients, leads, tickets, invoices, plans, team, emails, Viber outreach, reports, stats.

Core flow the MVP delivers:
public site → free website review lead → admin sees lead → admin creates client → client logs in →
client creates ticket → admin tracks time + uploads proof → client sees completed work & package usage.

---

## 2. Tech stack

| Layer | Technology |
|-------|-----------|
| Language | **TypeScript** (strict), SQL, some JS config |
| Framework | **Next.js 16** (App Router, Turbopack) + **React 19** |
| Styling | **Tailwind CSS** |
| i18n | **next-intl** (MK/EN) — *migration in progress, see §16* |
| Database | **Supabase / PostgreSQL** |
| Auth | **Supabase Auth** (cookie sessions) |
| File storage | **Supabase Storage** |
| Payments | **Stripe** (custom REST client, no SDK) |
| Email (send) | **Resend** primary, **Nodemailer/SMTP** fallback |
| Marketing pixel | **Facebook Pixel** |
| Rich text | react-quill-new |
| Uploads | react-dropzone |
| Tests | Playwright |
| Hosting | **Docker Compose + Caddy** on a **Hetzner** Ubuntu server |
| DNS / CDN | **Cloudflare** |

**Runtime:** Node **20** (the Dockerfile builds on `node:20-alpine`). *(The old SETUP.md said "Node 18+"; 20 is what production uses — install 20 locally.)*

---

## 3. Architecture (how it fits together)

```
Browser
  │  React 19 pages (Next.js App Router)
  ▼
Next.js server  ── middleware.ts (i18n + auth/role gating, runs before every request)
  │
  ├─ Route handlers  src/app/api/*/route.ts   ← the backend (~45 endpoints)
  │     │
  │     ├─ src/lib/stripe.ts   → api.stripe.com
  │     ├─ src/lib/email.ts    → Resend / SMTP
  │     └─ src/lib/supabase/*  → Supabase (DB, Auth, Storage)
  │
  └─ Server components render pages (client components marked 'use client')
```

Production request path:

```
Internet → Cloudflare (DNS/CDN, CF-IPCountry) → Hetzner VPS
  → agdev_caddy (Caddy 2, :80/:443, auto Let's Encrypt TLS)
  → agdev_app  (Next.js standalone, :3000)
  → Supabase (DB + Auth + Storage)
```

- **Two Supabase clients** (`src/lib/supabase/server.ts`):
  - `createClient()` — carries the user's cookie session; **RLS applies**.
  - `createAdminClient()` — bare service-role client that **bypasses RLS** (admin ops).
    ⚠️ Must be built with the service key directly, **NOT** on the cookie client, or RLS silently
    blocks writes (0 rows updated, reports success).

---

## 4. Directory structure

```
src/
├── middleware.ts            # i18n routing + auth/role gating (admin/portal/login)
├── app/
│   ├── [locale]/            # localized pages (now merged to main; every page lives under [locale])
│   │   ├── (public)         # /, about, services, pricing, portfolio, contact, review, cart, order/*, demos/*
│   │   ├── admin/           # dashboard, clients, leads, tickets, invoices, plans, emails, reports, settings, stats, team, activity
│   │   └── portal/          # dashboard, tickets, invoices, reports, usage, activity, settings, team
│   ├── api/                 # backend route handlers (see §6) — NOT localized
│   └── auth/callback        # Supabase auth callback
├── components/
│   ├── public/              # Header, Footer, Cart, Pricing*, ServiceCards, ChatWidget, LanguageSwitcher, Logo
│   ├── portal/              # PortalLayout, Sidebar, PortalChat, NotificationBell, ticket/invoice buttons
│   ├── admin/               # RichEditor (Quill)
│   ├── demos/               # demo-site chrome/banners
│   └── ui/                  # shared UI primitives
├── lib/                     # see §8
├── i18n/                    # next-intl config: routing.ts, request.ts, navigation.ts
├── messages/                # mk.json, en.json (translations)
└── types/                   # shared TypeScript types

supabase/
├── schema.sql               # full DB schema + RLS (run in Supabase SQL editor)
├── pending-migrations.sql   # migrations not yet applied (e.g. email_campaigns)
├── regional-pricing.sql
└── restore-plans.sql

# Deploy / infra (repo root — current, Caddy-based)
Dockerfile · docker-compose.yml · Caddyfile · deploy.sh

server/                      # ⚠️ LEGACY Nginx-based deploy (setup.sh, nginx.conf, deploy.sh) — superseded, see §13.3
```

---

## 5. Routes (pages)

**Public:** `/`, `/about`, `/services`, `/pricing`, `/portfolio`, `/contact`, `/review`, `/cart`,
`/checkout/success`, `/login`, `/forgot-password`, `/reset-password`,
`/order`, `/order/custom-plan`, `/order/it-support`, `/order/social-media`, `/order/website-care`,
`/demos/{dental,fitness,restaurant,store}` (store has about/contact/product/shop).

**Admin** (`role=admin`, gated in middleware): `dashboard, clients, clients/[id], clients/new,
leads, leads/[id], tickets, tickets/[id], tickets/new, invoices, plans, emails, outreach, reports,
settings, stats, team, activity`.

**Portal** (logged-in clients): `dashboard, tickets, tickets/[id], tickets/new, invoices,
reports, usage, activity, settings, team`.

---

## 6. API endpoints (`src/app/api/*/route.ts`)

HTTP method = exported function name (`GET/POST/PATCH/DELETE`).

- **Clients/leads:** `clients`, `clients/[id]`, `clients/[id]/reset-password`, `clients/[id]/usage`, `clients/[id]/extras`, `leads`, `leads/[id]`, `leads/[id]/email`
- **Tickets:** `tickets`, `tickets/[id]`, `tickets/[id]/activity`, `tickets/[id]/attachments`, `comments`, `time-entries`, `proof`
- **Billing:** `checkout`, `stripe/webhook`, `invoices`, `invoices/[id]`, `coupons`, `coupons/validate`, `plans`, `packages`
- **Chat:** `chat`, `chat/conversations`, `chat/messages`, `chat/unread`, `chat/typing`, `chat/upload`
- **Email:** `emails`, `emails/[id]`, `email-templates`, `email-templates/[id]`, `contact`, `review`
- **Viber outreach:** `outreach/contacts`, `outreach/contacts/[id]`, `outreach/campaigns`, `outreach/campaigns/[id]`, `outreach/webhook` (Infobip delivery reports + STOP-reply opt-out; guarded by `INFOBIP_WEBHOOK_TOKEN`)
- **Admin/account:** `settings`, `settings/test-email`, `team`, `admins`, `stats`, `reports`, `upload`, `account/avatar`, `account/email-connection`
- **Cron** (guarded by `CRON_SECRET` Bearer): `cron/monthly-invoices`, `cron/send-scheduled`

---

## 7. Database (Supabase / Postgres)

Schema in [supabase/schema.sql](supabase/schema.sql). Tables:

| Table | Purpose |
|-------|---------|
| `profiles` | extends `auth.users`; `role` = admin/client, `client_id`, RBAC fields |
| `clients` | agency clients (business, contact, package) |
| `support_packages` | care-plan tiers (Basic/Business/Priority) |
| `leads` | CRM prospects (status: New→Contacted→Proposal Sent→Won/Lost) |
| `tickets` | support tickets (category, priority, status, assignment) |
| `ticket_comments` | public + internal notes |
| `time_entries` | logged work minutes per ticket/month (billable, package) |
| `proof_uploads` | before/after proof of completed work |
| `activity_logs` | audit trail per client/ticket |
| `monthly_reports` | per-client monthly summary |
| `invoices` | billing (Pending/Paid/Overdue/Cancelled) |
| `plans` | sellable plans/pricing (public catalog) |
| `coupons` | discount codes (percent/amount, redemptions, expiry) |
| `app_settings` | key/value app config (Stripe keys, email, notification_from…) |
| `email_campaigns` | composed/bulk email sends (may need pending migration) |
| `outreach_contacts` | Viber outreach list: phone (E.164, unique), company, consent_status, opt-out |
| `outreach_campaigns` | Viber campaigns (message + `{company}` placeholder, audience, sent/failed counts) |
| `outreach_messages` | per-recipient Viber delivery log (status, Infobip messageId for webhook matching) |

- **Migrations:** run SQL files from `supabase/` in the Supabase SQL editor. `email_campaigns`
  lives in `pending-migrations.sql`; the Viber outreach tables live in `viber-outreach.sql`
  (idempotent — the outreach admin page shows a "run this SQL" prompt until it's applied).
- **RLS is on.** User-scoped access via `createClient()`; admin overrides via `createAdminClient()`.
- **Storage buckets:** `proof-uploads` (private) and `avatars` (public) — see §11.

---

## 8. Key library modules (`src/lib/`)

| File | Responsibility |
|------|----------------|
| `supabase/server.ts` / `client.ts` | Supabase clients (server cookie-based + admin service-role; browser) |
| `email.ts` | All email sending. Resend + SMTP. `sendComposedEmail` = campaigns/lead replies (normalizes `&nbsp;`, adds `List-Unsubscribe`). Notification templates via `wrap()`. |
| `emailCampaigns.ts` | Bulk campaign sending, recipient parsing, attachments |
| `infobip.ts` | Viber Business Messages client (Infobip unified Messages API) + SMS failover + status mapping |
| `outreach.ts` | Viber outreach helpers: admin guard (`outreach.send`), CSV parse/dedupe, `{company}` templating |
| `phone.ts` | Phone normalization to E.164 digits (MK-aware: 070…/+389…/389…) |
| `stripe.ts` | Hand-rolled Stripe REST client + webhook signature verification |
| `permissions.ts` | Admin RBAC + client-team capabilities (see §9) |
| `settings.ts` | Reads `app_settings` (Stripe/email config, senders) |
| `plans.ts` / `usePlans.ts` / `planDefaults.ts` / `planUsage.ts` | Plan catalog, pricing, usage limits |
| `catalog.ts` | Service/product catalog data |
| `money.ts` | Currency/price formatting (regional pricing) |
| `rateLimit.ts` | In-memory rate limiting (e.g. checkout, contact) |
| `crypto.ts` | Encryption helpers (e.g. stored email credentials) |
| `notifications.ts` | In-app notification helpers |
| `chatTyping.ts` | Chat typing indicators |
| `fbpixel.ts` | Facebook Pixel client tracking |

---

## 9. Auth & roles (RBAC)

Defined in [src/lib/permissions.ts](src/lib/permissions.ts).

- **Two top-level roles** (`profiles.role`): `admin` and `client`.
- **Admin sub-roles** (`profiles.admin_role`): `master` (all, incl. `admins.manage` + `settings.manage`),
  `manager`, `support` (assigned clients only), `billing`, `viewer`. Fine-grained perms in
  `profiles.permissions[]`. Use `can(profile, key)` / `isMaster(profile)`.
- **Client teams** (`profiles.client_role`): `leader` (full) vs member; capabilities
  `team`/`billing`/`allTickets` via `clientCan(profile, cap)`.
- **Route gating** happens in `middleware.ts`: `/admin/*` requires admin; `/portal/*` requires
  login; `/login` redirects logged-in users to their dashboard.

---

## 10. Environment variables

See [.env.local.example](.env.local.example) (dev) and `.env.production` (on server).

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only, bypasses RLS

# Email
RESEND_API_KEY=                     # primary sender
SMTP_HOST= SMTP_PORT= SMTP_USER= SMTP_PASS=   # notification/fallback mailbox

# Stripe (can also live in app_settings table)
STRIPE_SECRET_KEY= STRIPE_PUBLISHABLE_KEY= STRIPE_WEBHOOK_SECRET=

# Viber outreach (Infobip) — feature is inert until these are set
INFOBIP_BASE_URL=                   # account base URL, e.g. https://xxxxx.api.infobip.com
INFOBIP_API_KEY=
INFOBIP_VIBER_SENDER=               # approved Viber sender / brand name
INFOBIP_MESSAGES_PATH=              # optional; default /messages-api/1/messages
INFOBIP_WEBHOOK_TOKEN=              # shared secret guarding the webhook (?token=…)

# App
NEXT_PUBLIC_APP_URL=                # e.g. https://ag-development.dev
NEXT_PUBLIC_APP_NAME=AG Development
ADMIN_EMAIL=
CRON_SECRET=                        # Bearer token guarding /api/cron/*
```

Stripe/email config can also be set at runtime in **Admin → Settings** (`app_settings`), which
takes priority over env in `settings.ts`.

---

## 11. First-time setup (from scratch)

*(Do this once when standing up a fresh environment. Consolidated from the original SETUP guide;
placeholder emails/domains updated to the real ones.)*

### 11.1 Create the Supabase project
1. Go to **https://supabase.com**, sign up, **New Project**.
   - Name: `ag-development-platform`
   - Set a strong DB password (save it)
   - Region: closest to your users
2. **Settings → API** — copy: **Project URL**, **anon public key**, **service_role key** (keep secret).

### 11.2 Run the schema
1. Supabase **SQL Editor → New Query**.
2. Paste the entire contents of `supabase/schema.sql`, **Run** ("Success. No rows returned").
3. Apply any pending migrations from `supabase/pending-migrations.sql` (e.g. `email_campaigns`).

### 11.3 Create storage buckets
- **Storage → New bucket** → `proof-uploads`, **Public = OFF**.
- **New bucket** → `avatars`, **Public = ON**.

### 11.4 Create the admin user
1. **Authentication → Users → Add User → Create new user**; set email + strong password; check
   **Auto Confirm User**.
2. In **SQL Editor**, promote them:
   ```sql
   UPDATE profiles
   SET role = 'admin', full_name = 'Your Name'
   WHERE email = 'admin@ag-development.dev';
   ```

### 11.5 Set up email (Resend)
1. **https://resend.com** → sign up (free 3,000/month) → **API Keys → Create** (`re_...`).
2. **Domains** → add `ag-development.dev` and complete DNS verification (see §15 for the exact,
   verified DNS setup). For quick testing, Resend allows sending to your own address without a
   verified domain.

### 11.6 Point Supabase at your URL (production)
- **Authentication → URL Configuration** → **Site URL** = `https://ag-development.dev`; add
  `https://ag-development.dev/**` to **Redirect URLs**.

---

## 12. Local development

Requirements: **Node 20+**, a code editor (VS Code recommended).

```bash
# from the project folder
npm install
cp .env.local.example .env.local     # then fill in values (see §10)
npm run dev                          # http://localhost:3000
```

Build check: `npm run build`.

Quick smoke test:
1. `http://localhost:3000/login` → sign in as the admin user (§11.4) → Admin Dashboard.
2. **Clients → Add Client** → fill business details + package → a portal login is emailed to the client.
3. Sign out, sign in as the client → Client Dashboard → create a test ticket to verify the flow.

---

## 13. Deployment

### 13.1 Current production (Hetzner + Docker Compose + Caddy) ✅

**Server:** Hetzner, Ubuntu, IP `167.233.86.97`, app dir `/root/ag-development-`, host `Makedonka`.
**Stack:** Docker Compose — `agdev_app` (Next.js standalone, :3000) behind `agdev_caddy`
(Caddy 2, :80/:443, auto Let's Encrypt TLS).

Files: [Dockerfile](Dockerfile) (multi-stage `node:20-alpine` → standalone),
[docker-compose.yml](docker-compose.yml), [Caddyfile](Caddyfile), [deploy.sh](deploy.sh).

**Deploy = run on the server:**
```bash
ssh root@167.233.86.97
cd /root/ag-development- && ./deploy.sh
```
`deploy.sh` does: `git pull` (branch **main**) → `docker compose up -d --build` → `docker image prune -f`.

**How code goes live:** commit → push to GitHub `main` → run `deploy.sh` on server.
Production tracks **`main`**; anything on a feature branch is NOT live until merged to main.

**Health check after deploy:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://ag-development.dev
docker ps --format "{{.Names}} {{.Status}}"
```

### 13.2 Operational commands

```bash
# Logs / lifecycle (run in /root/ag-development-)
docker compose logs -f app
docker compose restart app
docker compose down
docker compose ps

# Server health
df -h            # disk (watch for build bloat; deploy.sh prunes images)
htop             # CPU/RAM

# Firewall (recommended once, on a fresh box)
ufw allow ssh && ufw allow http && ufw allow https && ufw enable && ufw status
```

**Backups.** Data lives in **Supabase**, not on the VPS, so the box is effectively stateless —
it can be rebuilt from the GitHub repo any time. On Supabase free tier, periodically export via
**Supabase → Settings → Database → Backups** (paid plans back up daily automatically).

### 13.3 Legacy / alternative deploy paths (NOT current — kept for reference)

These earlier methods are superseded by §13.1. Don't follow them for the live site.

- **Earlier Nginx-based Hetzner setup** (from the old `HETZNER_DEPLOY.md`, files in `server/`):
  used Nginx + Certbot instead of Caddy, app dir `/var/www/agdev`, `server/setup.sh` to install
  Docker/Nginx/Node, `server/nginx.conf`, and `server/deploy.sh`. The current setup replaced
  Nginx+Certbot with a single Caddy container that auto-handles TLS. **Consider deleting the
  `server/` folder** once you're sure nothing references it, to avoid confusion.
- **Vercel** (from the original `SETUP.md`): the very first prototype deployed to Vercel with
  env vars set in the Vercel dashboard. The project has since moved to self-hosting on Hetzner
  (cheaper at scale, full control). Only relevant as historical context.

---

## 14. Domains & DNS (Cloudflare)

- `ag-development.dev` — main site. Root `A`/`AAAA` → server IP (**proxied / orange cloud**).
  Mail records **DNS-only / grey** (§15).
- `www.ag-development.dev` → 301 to apex (handled by Caddy).
- `ag-development.mk` — referenced in the Caddyfile for a future MK app (`mk_app`),
  **not currently in docker-compose** (see §17).
- `thetruedefender.news` — a separate client site (in portfolio), hosted elsewhere (Hetzner).

---

## 15. Email deliverability (SPF / DKIM / DMARC) — IMPORTANT

Domain email is on **Microsoft 365**; app/marketing mail sends via **Resend (Amazon SES)**.
DNS is managed in **Cloudflare**. Current, verified-working setup:

| Record | Value | Cloudflare proxy |
|--------|-------|------------------|
| MX | `agdevelopment-dev0e.mail.protection.outlook.com` | DNS only |
| SPF (root) | `v=spf1 include:spf.protection.outlook.com -all` | DNS only |
| SPF (send subdomain) | `send.ag-development.dev` → `v=spf1 include:amazonses.com ~all` | DNS only |
| DKIM (M365) | `selector1._domainkey` / `selector2._domainkey` → `...dkim.mail.microsoft` | **DNS only** |
| DKIM (Resend/SES) | `resend._domainkey` TXT | DNS only |
| DMARC | `_dmarc` → `v=DMARC1; p=none;` | DNS only |

**Golden rules:**
- ⚠️ **All mail records must be Cloudflare "DNS only" (grey cloud), NEVER Proxied (orange).**
  Proxying a DKIM CNAME breaks it. Only the website `A`/`AAAA`/`www` records should be proxied.
- After adding M365 DKIM CNAMEs, **enable DKIM** in security.microsoft.com → DKIM.
- Composed/campaign mail auto-gets a `List-Unsubscribe` header + footer and `&nbsp;` cleanup (see `email.ts`).
- **Deliverability is reputation + auth.** Gmail is lenient; **Microsoft/Hotmail is strict** and
  junks new domains until warmed. Warm up (MailReach), register **Microsoft SNDS/JMRP**, ramp
  volume slowly (cold-outreach ceiling ≈ 40–50/day per mailbox).
- Next hardening step: move DMARC `p=none` → `p=quarantine` once all senders confirm DKIM alignment.

---

## 16. Internationalization (i18n): EN/MK + geo + regional pricing

**Goal:** serve a US-English site and a Macedonian site from the same codebase, with different
plans/prices per region, auto-routing visitors by country (soft redirect), and full Macedonian copy.

**Confirmed decisions:** path-prefix URLs (`/en/…`, `/mk/…`) · soft redirect (detect country,
allow manual switch) · Hetzner + Supabase · full Macedonian translation.

**Status:** ✅ **merged to `main`** (as of 2026-09). All pages now live under `src/app/[locale]/`
with `next-intl` MK/EN routing; `src/app/` root no longer has non-localized pages. The admin CRM and
client portal render in **English only** (message files cover public/marketing namespaces only — see §16.4).

### 16.1 Concepts
- **Locale** = display language (`en` / `mk`) — controls translation.
- **Region** = pricing market (`us` / `mk`) — controls which plans and which currency.
- They map 1:1 for now (`en→us`, `mk→mk`) but are kept distinct to allow, e.g., MK-language pages priced in EUR.

> **§16.2–16.8 below are the original implementation plan, now completed and merged.** Kept as a
> record of how the i18n/geo/pricing system was built and why; not a to-do list any more.

### 16.2 Prerequisites (before resuming the refactor)
1. Finish any interrupted `git pull` (`git stash` → `git pull` → `git stash pop`, resolve conflicts).
2. Clear the Turbopack cache if the dev page goes blank (`rm -rf .next` → `npm run dev`).
3. Work on the `feature/i18n-mk` branch (already created).
4. **Back up the Supabase `plans` table** (export CSV) before the schema migration in §16.5.

### 16.3 Phase 1 — i18n foundation (`next-intl`)
- ⚠️ **Version check:** Next.js 16 is deprecating `middleware` in favor of `proxy`. Confirm the
  `next-intl` version supports Next 16 before installing; keep `middleware.ts` (with the
  deprecation warning) until next-intl documents `proxy` support.
- `src/i18n/routing.ts`: `locales: ['en','mk']`, `defaultLocale: 'en'`, `localePrefix: 'always'`.
- `src/i18n/request.ts` loads `messages/${locale}.json`.
- Move all routes under `src/app/[locale]/` **except** `api/` and root files (`globals.css`,
  favicon, etc.). `[locale]/layout.tsx` wraps children in `NextIntlClientProvider` and sets
  `<html lang={locale}>`.
- Replace hardcoded copy with `useTranslations()` / `getTranslations()`.
- Add a **language switcher** (client component) that swaps the locale segment and sets the
  `NEXT_LOCALE` cookie (persists + overrides geo).
- Convert every `<Link href="/pricing">` to the locale-aware `Link` from next-intl navigation
  helpers (find/replace `from 'next/link'` across `components/public/*` and pages).

### 16.4 Phase 2 — geo detection + soft redirect
- **Recommended: Cloudflare in front.** It injects `CF-IPCountry` on every request; middleware
  reads `request.headers.get('cf-ipcountry') ?? 'XX'`. Bonus CDN/caching/TLS/DDoS. *(This is
  already how DNS is set up — see §14.)*
- Alternative: MaxMind GeoLite2 `.mmdb` bundled + `maxmind` npm — but needs monthly DB refresh
  and correct `X-Forwarded-For` handling so middleware sees the real client IP, not the proxy's.
- `src/lib/geo.ts`: `localeFromCountry(country)` → `'mk'` if `MK` else `'en'`;
  `regionFromLocale(locale)` → `'mk'` if `mk` else `'us'`.
- Middleware order: locale-prefixed path → run next-intl routing + existing auth; no-locale path →
  if `NEXT_LOCALE` cookie use it, else read `CF-IPCountry` and `307`-redirect to `/{locale}{path}`.
  Expand the matcher to catch locale-less public paths; exclude `/api`, `/_next`, static assets.
- **Soft, never hard:** redirect only when there's no explicit locale and no cookie. No country
  is ever blocked (diaspora-friendly).

### 16.5 Phase 3 — regional plans & pricing
- **Schema migration** (Supabase SQL editor): add `region text default 'us'` and
  `currency text default 'USD'` to `plans`; change PK from `(id)` to **`(id, region)`**; seed MK
  variants by duplicating US rows into `'mk'` with MKD pricing. Full SQL is in
  `supabase/regional-pricing.sql`.
- ⚠️ Because the PK becomes `(id, region)`, **audit every `.eq('id', …)` / `onConflict: 'id'`**
  in `route.ts` and `plans.ts` (`getPlans`, `getPlan`, PATCH `onConflict`, DELETE) and make them
  `(id, region)`-aware.
- Code: `getPlans(region)` / `getPlan(id, region)` filter by region; `/api/plans` reads `?region=`
  (default `us`) and returns `currency` + `effective_price`; `usePlans()` appends `?region=` from
  the active locale; **card copy lives in `messages/*.json`, prices/availability come from the DB
  by region.**
- Currency: `new Intl.NumberFormat(locale==='mk'?'mk-MK':'en-US',{style:'currency',currency})`.
  Replace hardcoded `$` in PricingTabs, ServiceCards, order pages, cart.
- 🚩 **Payments decision required before MK checkout:** **Stripe does not support payouts to
  Macedonian businesses.** Charging MK customers in MKD/EUR may need a local processor
  (e.g. CaSys/CPay) or manual handling. Decide before enabling MK checkout.

### 16.6 Phase 4 — Macedonian translation
- Extract every user-facing string into `messages/en.json`, then translate to `mk.json`.
- **Adapt, don't literally translate** the marketing copy: the home page is US-targeted
  ("US-Based Remote Support", "$60K+ salary", US testimonials); the MK version needs localized
  value props, MKD figures, and local testimonials/names.
- Translated, locale-specific metadata (`title`, `description`, `openGraph`).

### 16.7 SEO
- `hreflang` alternates (Next metadata `alternates.languages`), locale-aware `canonical`,
  both-locale sitemap entries, `<html lang>` from the active locale.

### 16.8 Suggested execution order
Prereqs (§16.2) → Phase 1 wiring → Phase 2 geo → Phase 3 pricing → Phase 4 translation → SEO →
testing. Each phase is independently shippable; merge Phase 1 to a staging deploy before layering
on geo and pricing.

### 16.9 Risk register
| Risk | Mitigation |
|---|---|
| IP geo bypassable via VPN | Accepted — soft redirect by design, never a security boundary |
| Diaspora / cross-shoppers locked out | Avoided — switcher + cookie, no hard block |
| `next-intl` vs Next 16 `proxy` rename | Verify version support before install; keep `middleware.ts` until confirmed |
| PK `(id)` → `(id, region)` breaks upserts | Audit every `eq('id')` / `onConflict` in `route.ts` & `plans.ts` |
| Stripe can't pay out to MK | Decide MK payment processor before enabling MK checkout |
| MaxMind DB goes stale (Option B) | Monthly refresh cron, or use Cloudflare (Option A) |
| Half-migrated tree breaks dev | Do prerequisites on a clean feature branch first |

---

## 17. Common tasks

- **Add a page:** `src/app/[locale]/<path>/page.tsx` (feature branch) or `src/app/<path>/page.tsx`
  (main). Server component by default; add `'use client'` for interactivity.
- **Add an API endpoint:** `src/app/api/<path>/route.ts`, export `GET/POST/…`. Auth via
  `createClient()`; admin ops via `createAdminClient()`; check perms with `can()`.
- **DB change:** write SQL, run in Supabase SQL editor, keep `supabase/schema.sql` updated.
- **Change Stripe/email config:** Admin → Settings (persists to `app_settings`), or env vars.
- **Send a campaign:** Admin → Emails (uses `sendComposedEmail`; needs sender identity in Account Settings).
- **Send a Viber campaign:** Admin → Viber Outreach (perm `outreach.send`). Import contacts (paste/CSV),
  set consent, then compose with `{company}` and send. Needs `viber-outreach.sql` applied + `INFOBIP_*`
  env set. Sending runs in the background (Next `after()`); the campaign list polls for progress. Point the
  Infobip callback at `/api/outreach/webhook?token=$INFOBIP_WEBHOOK_TOKEN` for delivery reports + STOP opt-out.
- **Run locally:** `npm run dev` (needs `.env.local`). Build: `npm run build`.
- **Deploy:** see §13.

---

## 18. Gotchas & known issues

- **Production runs `main`.** The i18n migration is now merged and live on `main` (all pages under
  `[locale]`). Only public/marketing copy is translated; the admin CRM and client portal are
  English-only (no `admin`/`portal` namespaces in `messages/*.json`).
- **Server has local uncommitted drift** on `Caddyfile`, `docker-compose.yml`, `deploy.sh`, and
  2 order pages. `git pull` only works cleanly if incoming commits don't touch those files. Don't
  `git reset`/`checkout` those on the server (they're live config). Better: commit that drift into
  the repo properly to remove the risk.
- **Caddyfile references `mk_app:3000`** (planned MK container) that isn't in `docker-compose.yml`.
  Harmless only because `ag-development.mk` DNS may not point here; clean up when the MK app settles.
- **Cloudflare proxy on mail records breaks email.** Keep all mail records grey (DNS only). See §15.
- **`createAdminClient()` must use the service-role key directly** — building it on the cookie
  client makes RLS silently block writes (0 rows updated, reports success).
- **Quill editor inserts `&nbsp;`** on paste; `email.ts` strips it before sending. Don't remove
  that normalization.
- **The `server/` folder is legacy Nginx deploy config** (§13.3) — not used by the current Caddy
  setup. Safe to remove once confirmed unreferenced.

---

## 19. Costs

| Service | Free tier | Notes |
|---------|-----------|-------|
| **Hetzner CX22 VPS** | — | ~€4.35/month (2 vCPU, 4GB) — hosts the app |
| **Supabase** | 500MB DB, 5GB storage, 50K auth users | $25/month when you scale |
| **Resend** | 3,000 emails/month | $20/month for 50K |
| **Cloudflare** | Free plan (DNS/CDN/TLS) | — |
| **Let's Encrypt** | Free (via Caddy) | — |

Current baseline ≈ **€4/month** (self-hosted on Hetzner) vs the original Vercel-based estimate of
~$65/month at scale — the self-host move is the reason for the difference.

---

## 20. Repo / git

- Remote: `https://github.com/trajcheangjelovski-blip/ag-development-`
- Default / production branch: **`main`** (i18n migration now merged in)
- Deploy target: `main` via `deploy.sh` on the server.
