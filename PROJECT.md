# AG Development Platform — Project Reference

> Single source of truth for the whole platform: what it is, how it's built, how it's
> deployed, and how to work on it. Keep this file updated as the project evolves.

Last updated: 2026-08-15

---

## 1. What this is

A **full-stack platform for a web-development agency** (`ag-development.dev`). One codebase, three audiences:

1. **Public marketing site** — home, services, pricing, portfolio, demos, order/checkout, contact.
2. **Client portal** (`/portal/*`) — logged-in clients see tickets, invoices, usage, reports, chat.
3. **Admin CRM** (`/admin/*`) — manage clients, leads, tickets, invoices, plans, team, emails, stats.

---

## 2. Tech stack

| Layer | Technology |
|-------|-----------|
| Language | **TypeScript** (strict), SQL, some JS config |
| Framework | **Next.js 16** (App Router, Turbopack) + **React 19** |
| Styling | **Tailwind CSS** |
| i18n | **next-intl** (MK/EN) — *migration in progress, see §11* |
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
| DNS | **Cloudflare** |

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

- **Two Supabase clients** (`src/lib/supabase/server.ts`):
  - `createClient()` — carries the user's cookie session; **RLS applies**.
  - `createAdminClient()` — bare service-role client that **bypasses RLS** (admin ops). ⚠️ Must be built with the service key directly, NOT on the cookie client, or RLS silently blocks writes.

---

## 4. Directory structure

```
src/
├── middleware.ts            # i18n routing + auth/role gating (admin/portal/login)
├── app/
│   ├── [locale]/            # localized pages (feature/i18n-mk); on main these live at app/ root
│   │   ├── (public)         # /, about, services, pricing, portfolio, contact, review, cart, order/*, demos/*
│   │   ├── admin/           # dashboard, clients, leads, tickets, invoices, plans, emails, reports, settings, stats, team, activity
│   │   └── portal/          # dashboard, tickets, invoices, reports, usage, activity, settings, team
│   ├── api/                 # backend route handlers (see §6)
│   └── auth/callback        # Supabase auth callback
├── components/
│   ├── public/              # Header, Footer, Cart, Pricing*, ServiceCards, ChatWidget, LanguageSwitcher, Logo
│   ├── portal/              # PortalLayout, Sidebar, PortalChat, NotificationBell, ticket/invoice buttons
│   ├── admin/               # RichEditor (Quill)
│   ├── demos/               # demo-site chrome/banners
│   └── ui/                  # shared UI primitives
├── lib/                     # see §8
├── i18n/                    # next-intl config: routing.ts, request.ts, navigation.ts
└── messages/                # mk.json, en.json (translations)

supabase/
├── schema.sql               # full DB schema + RLS (run in Supabase SQL editor)
├── pending-migrations.sql   # migrations not yet applied (e.g. email_campaigns)
├── regional-pricing.sql
└── restore-plans.sql
```

---

## 5. Routes (pages)

**Public:** `/`, `/about`, `/services`, `/pricing`, `/portfolio`, `/contact`, `/review`, `/cart`,
`/checkout/success`, `/login`, `/forgot-password`, `/reset-password`,
`/order`, `/order/custom-plan`, `/order/it-support`, `/order/social-media`, `/order/website-care`,
`/demos/{dental,fitness,restaurant,store}` (store has about/contact/product/shop).

**Admin** (`role=admin`, gated in middleware): `dashboard, clients, clients/[id], clients/new,
leads, leads/[id], tickets, tickets/[id], tickets/new, invoices, plans, emails, reports,
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

- **Migrations:** run SQL files from `supabase/` in the Supabase SQL editor. `email_campaigns` lives in `pending-migrations.sql`.
- **RLS is on.** User-scoped access via `createClient()`; admin overrides via `createAdminClient()`.

---

## 8. Key library modules (`src/lib/`)

| File | Responsibility |
|------|----------------|
| `supabase/server.ts` / `client.ts` | Supabase clients (server cookie-based + admin service-role; browser) |
| `email.ts` | All email sending. Resend + SMTP. `sendComposedEmail` = campaigns/lead replies (normalizes `&nbsp;`, adds `List-Unsubscribe`). Notification templates via `wrap()`. |
| `emailCampaigns.ts` | Bulk campaign sending, recipient parsing, attachments |
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
- **Admin sub-roles** (`profiles.admin_role`): `master` (all, incl. `admins.manage` + `settings.manage`), `manager`, `support` (assigned clients only), `billing`, `viewer`. Fine-grained perms in `profiles.permissions[]`. Use `can(profile, key)` / `isMaster(profile)`.
- **Client teams** (`profiles.client_role`): `leader` (full) vs member; capabilities `team`/`billing`/`allTickets` via `clientCan(profile, cap)`.
- **Route gating** happens in `middleware.ts`: `/admin/*` requires admin; `/portal/*` requires login; `/login` redirects logged-in users to their dashboard.

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

# App
NEXT_PUBLIC_APP_URL=                # e.g. https://ag-development.dev
NEXT_PUBLIC_APP_NAME=AG Development
ADMIN_EMAIL=
CRON_SECRET=                        # Bearer token guarding /api/cron/*
```

Stripe/email config can also be set at runtime in **Admin → Settings** (`app_settings`), which
takes priority over env in `settings.ts`.

---

## 11. Internationalization (i18n) — MK/EN

- Uses **next-intl**. Config in `src/i18n/` (`routing.ts`, `request.ts`, `navigation.ts`); strings in `src/messages/{mk,en}.json`.
- `middleware.ts` handles locale routing + a **geo soft-redirect** (visitors from MK → `/mk`, others → `/en`), remembered via `NEXT_LOCALE` cookie. Geo read from Cloudflare `CF-IPCountry` header.
- **Migration status:** the move of all pages under `src/app/[locale]/` lives on branch **`feature/i18n-mk`** and is **not yet merged to `main`**. Production (`main`) still serves pages from `src/app/` root (no `[locale]`). Finish + test before merging.

---

## 12. Email deliverability (SPF / DKIM / DMARC) — IMPORTANT

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
- ⚠️ **All mail records must be Cloudflare "DNS only" (grey cloud), NEVER Proxied (orange).** Proxying a DKIM CNAME breaks it. Only the website `A`/`AAAA`/`www` records should be proxied.
- After adding M365 DKIM CNAMEs, **enable DKIM** in security.microsoft.com → DKIM.
- Composed/campaign mail auto-gets a `List-Unsubscribe` header + footer and `&nbsp;` cleanup (see `email.ts`).
- **Deliverability is reputation + auth.** Gmail is lenient; **Microsoft/Hotmail is strict** and junks new domains until warmed. Warm up (MailReach), register **Microsoft SNDS/JMRP**, ramp volume slowly (cold outreach ceiling ≈ 40–50/day per mailbox).
- Next hardening step: move DMARC `p=none` → `p=quarantine` once all senders confirm DKIM alignment.

---

## 13. Deployment

**Server:** Hetzner, Ubuntu, IP `167.233.86.97`, app dir `/root/ag-development-`, host `Makedonka`.
**Stack:** Docker Compose — `agdev_app` (Next.js standalone, port 3000) behind `agdev_caddy` (Caddy 2, ports 80/443, auto Let's Encrypt TLS).

**Files:** [Dockerfile](Dockerfile) (multi-stage node:20-alpine → standalone), [docker-compose.yml](docker-compose.yml), [Caddyfile](Caddyfile), [deploy.sh](deploy.sh).

**Deploy = run on the server:**
```bash
ssh root@167.233.86.97
cd /root/ag-development- && ./deploy.sh
```
`deploy.sh` does: `git pull` (branch **main**) → `docker compose up -d --build` → `docker image prune -f`.

**How code goes live:** commit → push to GitHub `main` → run `deploy.sh` on server. Production
tracks **`main`**, so anything on a feature branch is NOT live until merged to main.

**Health check after deploy:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://ag-development.dev
docker ps --format "{{.Names}} {{.Status}}"
```

---

## 14. Domains & DNS (Cloudflare)

- `ag-development.dev` — main site. Root `A`/`AAAA` → server IP (proxied). Mail records DNS-only (§12).
- `www.ag-development.dev` → 301 to apex (Caddy).
- `ag-development.mk` — referenced in Caddyfile for a future MK app (`mk_app`), **not currently in docker-compose** (see §16).
- `thetruedefender.news` — a separate client site (in portfolio), hosted elsewhere (Hetzner).

---

## 15. Common tasks

- **Add a page:** create `src/app/[locale]/<path>/page.tsx` (feature branch) or `src/app/<path>/page.tsx` (main). Server component by default; add `'use client'` for interactivity.
- **Add an API endpoint:** `src/app/api/<path>/route.ts`, export `GET/POST/…`. Auth via `createClient()`; admin ops via `createAdminClient()`; check perms with `can()`.
- **DB change:** write SQL, run in Supabase SQL editor, keep `supabase/schema.sql` updated.
- **Change Stripe/email config:** Admin → Settings (persists to `app_settings`), or env vars.
- **Send a campaign:** Admin → Emails (uses `sendComposedEmail`; needs sender identity in Account Settings).
- **Run locally:** `npm run dev` (needs `.env.local`). Build: `npm run build`.
- **Deploy:** see §13.

---

## 16. Gotchas & known issues

- **Production runs `main`, dev work is on `feature/i18n-mk`.** The i18n migration is unfinished; don't merge/deploy it until tested. Email-deliverability fix + "True Defender" portfolio entry are already on `main` (hotfixed separately).
- **Server has local uncommitted drift** on `Caddyfile`, `docker-compose.yml`, `deploy.sh`, and 2 order pages. `git pull` only works cleanly if incoming commits don't touch those files. Don't `git reset`/`checkout` those on the server (they're live config). Consider committing that drift into the repo properly to remove the risk.
- **Caddyfile references `mk_app:3000`** (planned MK container) that isn't in `docker-compose.yml`. Harmless only because `ag-development.mk` DNS may not point here; clean up when the MK app is settled.
- **Cloudflare proxy on mail records breaks email.** Keep all mail records grey (DNS only). See §12.
- **`createAdminClient()` must use the service-role key directly** — building it on the cookie client makes RLS silently block writes (0 rows updated, reports success).
- **Quill editor inserts `&nbsp;`** on paste; `email.ts` strips it before sending. Don't remove that normalization.

---

## 17. Repo / git

- Remote: `https://github.com/trajcheangjelovski-blip/ag-development-`
- Default/production branch: **`main`**
- Active dev branch: **`feature/i18n-mk`** (i18n migration)
- Deploy target: `main` via `deploy.sh` on the server.
