# Bilingual (EN/MK) + Geo-Routing + Regional Pricing — Implementation Plan

**Project:** AG Development platform (Next.js 16 App Router, Supabase, Hetzner)
**Goal:** Serve a US English site and a Macedonian site from the same codebase, with different plans/prices per region, auto-routing visitors by country (soft redirect), and full Macedonian translation.

**Confirmed decisions**

- URL structure: **path prefix** — `/en/...` and `/mk/...`
- Geo behavior: **soft redirect** — detect country, send to the right locale, but allow manual switching
- Hosting: **Hetzner + Supabase** (no edge geo data out of the box)
- Translation: **full Macedonian translation** of all copy

---

## 0. Prerequisites (do these first)

This is a large refactor. Do **not** start it on the current working tree, which is mid-conflict.

1. **Finish the interrupted `git pull`.** You are 6 commits behind with local edits to `route.ts` and `usePlans.ts`:
   ```
   git stash
   git pull
   git stash pop          # resolve conflicts in usePlans.ts if prompted
   ```
2. **Clear the corrupted Turbopack cache** (cause of the blank page):
   ```
   rd /s /q .next
   npm run dev            # confirm the site loads cleanly
   ```
3. **Create a feature branch** so this work is isolated and reviewable:
   ```
   git checkout -b feature/i18n-mk
   ```
4. **Back up the Supabase `plans` table** (export to CSV from the dashboard) before the schema migration in Phase 3.

---

## 1. Architecture overview

Today the app serves a single locale from `src/app/*`. The target shape:

```
src/
  app/
    [locale]/              ← every public + app route moves under here
      layout.tsx           ← sets <html lang>, loads messages, fonts
      page.tsx             ← home
      pricing/page.tsx
      contact/page.tsx
      review/page.tsx
      order/...
      login/page.tsx
      portal/...           ← still auth-gated
      admin/...            ← still admin-gated
    api/                   ← NOT localized (stays at /api/*)
  i18n/
    routing.ts             ← locales = ['en','mk'], defaultLocale = 'en'
    request.ts             ← loads the right message catalog per request
  messages/
    en.json                ← all English strings
    mk.json                ← all Macedonian strings
  middleware.ts (→ proxy.ts)  ← geo detect + locale routing + existing auth
  lib/
    geo.ts                 ← country → region/locale mapping
    plans.ts               ← gains a `region` filter
    catalog.ts / order/_data.ts  ← gains regional price/plan variants
```

**Region vs locale.** Keep these as two related-but-distinct concepts:

- **Locale** = display language (`en` / `mk`) — controls translation.
- **Region** = pricing market (`us` / `mk`) — controls which plans and which currency.

They map 1:1 for now (`en→us`, `mk→mk`), but separating them keeps the door open for, e.g., a Macedonian-language page that still shows EUR, or an English page for the MK market.

---

## 2. Phase 1 — i18n foundation (`next-intl`)

**Library:** `next-intl` is the standard for App Router i18n.

> ⚠️ **Version check before installing.** You're on Next.js 16, which is deprecating the `middleware` file in favor of `proxy`. Confirm the `next-intl` version you install officially supports Next 16 and its proxy convention (check the next-intl changelog/docs at install time). If the latest stable still targets `middleware`, we keep `middleware.ts` for now — it still runs, just with the deprecation warning you already see. Don't rename to `proxy.ts` until next-intl documents support for it, or you'll have to wire its routing helper into the proxy file manually.

### Steps

1. **Install:**
   ```
   npm install next-intl
   ```
2. **Define routing** — `src/i18n/routing.ts`:
   ```ts
   import { defineRouting } from 'next-intl/routing'

   export const routing = defineRouting({
     locales: ['en', 'mk'],
     defaultLocale: 'en',
     localePrefix: 'always',   // URLs always carry /en or /mk
   })
   ```
3. **Request config** — `src/i18n/request.ts` loads `messages/${locale}.json`.
4. **Move all routes under `src/app/[locale]/`.** Everything currently in `src/app/*` except `api/` and root files (`globals.css`, `favicon`, etc.) moves into `[locale]/`. `layout.tsx` becomes `[locale]/layout.tsx` and wraps children in `NextIntlClientProvider` and sets `<html lang={locale}>`.
5. **Keep `src/app/api/` where it is** — API routes are not localized. The plans API will instead take a `region` query param (Phase 3).
6. **Replace hardcoded copy with `useTranslations()` / `getTranslations()`** as each component is migrated (this is the bulk of Phase 4, but the wiring lands here).
7. **Language switcher component** — a small client component in the header that swaps the locale segment of the current path and sets the `NEXT_LOCALE` cookie so the choice persists and overrides geo on the next visit.

### Internal links

Every `<Link href="/pricing">` must become locale-aware. `next-intl` provides a wrapped `Link` (from `@/i18n/routing`'s navigation helpers) that automatically prefixes the active locale. Find/replace `from 'next/link'` → the next-intl navigation `Link` across `components/public/*` and pages (Header, Footer, home CTAs, PricingTabs, etc.).

---

## 3. Phase 2 — Geo detection + soft redirect

Goal: a visitor hitting `https://ag-development.dev/` (no locale) is sent to `/mk` if they're in Macedonia, `/en` otherwise — **unless** they have a `NEXT_LOCALE` cookie (manual choice), which always wins.

### 3a. Getting the country on Hetzner

A bare Hetzner box has no country data. Two options:

**Option A — Cloudflare in front (recommended).** Proxy the domain through Cloudflare (free plan). Cloudflare injects a `CF-IPCountry` header (e.g. `MK`, `US`) on every request. Middleware reads it directly — no database, no latency, auto-updating. Bonus: CDN, caching, free TLS, DDoS protection.

```ts
const country = request.headers.get('cf-ipcountry') ?? 'XX'
```

**Option B — MaxMind GeoLite2 (no Cloudflare).** Bundle the free `GeoLite2-Country.mmdb` in the repo and look up the client IP with the `maxmind` npm package inside middleware.
- Requires a free MaxMind account + a monthly DB refresh (the file goes stale).
- **Critical for Hetzner:** middleware must see the *real* client IP, not your reverse proxy's. Ensure nginx (or whatever fronts the Node app) sets `X-Forwarded-For` and that you read the first IP from it. Without this every visitor resolves to the server's own IP.

> Recommendation: **Option A.** It's less code, more reliable, and you get a CDN for free. The rest of this plan assumes `CF-IPCountry`, with the MaxMind path as a drop-in alternative inside `lib/geo.ts`.

### 3b. The mapping — `src/lib/geo.ts`

```ts
export function localeFromCountry(country: string): 'en' | 'mk' {
  return country === 'MK' ? 'mk' : 'en'
}
export function regionFromLocale(locale: string): 'us' | 'mk' {
  return locale === 'mk' ? 'mk' : 'us'
}
```

### 3c. Middleware logic (combined with existing auth)

Order of operations in the existing `middleware.ts`:

1. If the path already has a locale prefix → run `next-intl` routing + your existing Supabase auth checks (admin/portal/login) and return.
2. If the path has **no** locale prefix:
   - If `NEXT_LOCALE` cookie exists → redirect to that locale.
   - Else → read `CF-IPCountry`, compute locale, redirect (`307`) to `/{locale}{path}`.
3. The matcher must expand beyond today's `['/admin','/portal','/login','/api']` to also catch locale-less public paths (`/`, `/pricing`, etc.). Exclude `/api`, `/_next`, and static assets.

> **Soft, not hard:** we only redirect when there's no explicit locale and no cookie. A US visitor can still open `/mk` directly and a switcher lets anyone change — this is the diaspora-friendly behavior you chose. No country is ever blocked.

---

## 4. Phase 3 — Regional plans & pricing

Your plans flow today: Supabase `plans` table → `lib/plans.ts` (`getPlans`) → `/api/plans` → `usePlans()` / `mergeCard()`, with static fallback from `CATALOG` and card copy from `order/_data.ts` (`BUILD_PACKAGES`, `CARE_PLANS`) via `planDefaults.ts`.

To make plans/prices differ by market we add a `region` dimension end to end.

### 4a. Supabase schema migration

Add a `region` column to `plans` (and `currency` for display). Run in the Supabase SQL editor:

```sql
-- 1. Add columns
alter table plans add column if not exists region text not null default 'us';
alter table plans add column if not exists currency text not null default 'USD';

-- 2. Composite uniqueness: the same plan id can exist once per region
--    (drop the old single-column PK/unique on id first if present, then:)
alter table plans drop constraint if exists plans_pkey;
alter table plans add primary key (id, region);

-- 3. Seed Macedonian variants (example — adjust prices/plan set as needed)
--    Duplicate the US rows into 'mk' with MKD pricing, then edit in the admin UI.
insert into plans (id, region, currency, name, description, category, price, billing_interval, sale_price, sale_active, is_active, sort, badge, features, details, good_for, delivery, grant_type, grant_qty)
select id, 'mk', 'MKD', name, description, category,
       price,            -- TODO: set real MKD prices
       billing_interval, sale_price, sale_active, is_active, sort, badge, features, details, good_for, delivery, grant_type, grant_qty
from plans where region = 'us'
on conflict (id, region) do nothing;
```

> Because the PK becomes `(id, region)`, every `.eq('id', ...)` / upsert in `route.ts` (`onConflict: 'id'`) must become `(id, region)`-aware. This touches `getPlans`, `getPlan`, the PATCH `onConflict`, and the DELETE `eq('id', id)`. List those changes explicitly during the build.

### 4b. Code changes

- **`lib/plans.ts`** — `getPlans(region)` filters `.eq('region', region)`; `getPlan(id, region)`. Static fallback `CATALOG` gains region-tagged entries (or a per-region map).
- **`app/api/plans/route.ts`** — read `?region=` (default `us`), pass to `getPlans`, and include `currency` + `effective_price` in the response. PATCH/DELETE key on `(id, region)`.
- **`lib/usePlans.ts`** — `usePlans()` must know the active locale → region. Easiest: the component passes the region (derived from the `next-intl` locale) or the hook reads it from context. Append `?region=${region}` to the fetch. `ApiPlan` type gains `currency`.
- **`order/_data.ts` + `catalog.ts`** — card copy and base prices become region-aware. Either duplicate `BUILD_PACKAGES`/`CARE_PLANS` per region, or split copy (translated via message catalogs) from price (from the API). Cleaner: **copy lives in `messages/*.json`, prices/plan-availability come from the DB by region.**

### 4c. Currency formatting

Add a helper using `Intl.NumberFormat`:

```ts
new Intl.NumberFormat(locale === 'mk' ? 'mk-MK' : 'en-US',
  { style: 'currency', currency }).format(amount)
```

Replace hardcoded `$` symbols in `PricingTabs`, `ServiceCards`, order pages, and cart.

### 4d. Payments (flag for decision)

If the site takes payment, the provider matters: **Stripe does not support payouts to Macedonian businesses.** If you charge MK customers in MKD/EUR you may need a different processor (e.g. CaSys/CPay or a local MK gateway) or to handle MK orders manually. This is out of scope for this plan but **must be decided before launching MK checkout** — flagging so it doesn't surprise you. The cart/order flow may need a per-region payment path.

---

## 5. Phase 4 — Macedonian translation

1. **Extract every user-facing string** into `messages/en.json` as you migrate each component (Header, Footer, home sections, PricingTabs, ServiceCards, ServicesSection, ChatWidget, order/contact/review pages, login/portal/admin labels).
2. **Translate `en.json` → `mk.json`.** I'll write the full Macedonian copy. Note: marketing copy on the home page is US-targeted ("US-Based Remote Support", "$60K+ salary", US testimonials) — the MK version needs **localized messaging**, not a literal translation (different value props, MKD figures, local testimonials/names). We'll adapt, not just translate.
3. **Metadata & SEO per locale** — `title`, `description`, `openGraph` in `layout.tsx`/`page.tsx` become translated and locale-specific.

---

## 6. SEO

- **`hreflang` tags** — each page advertises its `en` and `mk` alternates so Google serves the right version. `next-intl` + Next metadata `alternates.languages` handles this.
- **`canonical`** per locale (currently hardcoded to the bare domain in `layout.tsx`/`page.tsx` — must become locale-aware).
- **Sitemap** — generate entries for both locales.
- **`<html lang>`** — set from the active locale (done in Phase 1 layout).

---

## 7. Testing & rollout

- Local: visit `/en` and `/mk` directly; verify copy, prices, currency, and links all stay in-locale.
- Geo: spoof country to test redirect — set `CF-IPCountry` via a header (or test on Cloudflare with a VPN). Confirm the `NEXT_LOCALE` cookie overrides geo.
- Auth: confirm admin/portal/login still gate correctly now that they live under `[locale]`.
- Pricing API: hit `/api/plans?region=mk` and `?region=us`, confirm correct plan sets/currency.
- Build: `npm run build` clean (you already skip ESLint in builds); check for any remaining hardcoded `next/link` imports or `$` strings.
- Verification step: diff review of all touched files + a checklist that no English string leaks into the MK site and no USD price shows on `/mk`.

---

## 8. Risk register

| Risk | Mitigation |
|---|---|
| IP geo is bypassable via VPN | Accepted — soft redirect by design; never used as a hard security boundary |
| Diaspora / cross-shoppers locked out | Avoided — switcher + cookie, no hard block |
| `next-intl` vs Next 16 `proxy` rename | Verify version support before install; keep `middleware.ts` until confirmed |
| PK change `(id)` → `(id, region)` breaks upserts | Audit every `eq('id')` / `onConflict` in `route.ts` & `plans.ts` |
| Stripe can't pay out to MK | Decide MK payment processor before enabling MK checkout |
| MaxMind DB goes stale (if Option B) | Monthly refresh cron, or use Cloudflare (Option A) |
| Half-migrated tree breaks dev | Do prerequisites (git pull + cache clear) on a clean feature branch first |

---

## 9. Suggested execution order

1. Prerequisites (§0) — git pull, cache clear, feature branch.
2. Phase 1 wiring (§2) — install next-intl, `[locale]` restructure, providers, switcher. *Site still English-only but locale-routed.*
3. Phase 2 (§3) — geo + soft redirect (Cloudflare).
4. Phase 3 (§4) — schema migration + regional pricing plumbing.
5. Phase 4 (§5) — extract strings + Macedonian translation.
6. SEO (§6), then testing (§7).

Each phase is independently shippable and reviewable. I'd recommend merging Phase 1 to a staging deploy before layering on geo and pricing.
