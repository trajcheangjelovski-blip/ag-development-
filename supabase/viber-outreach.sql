-- ─── Viber outreach (Infobip) ────────────────────────────────────────────────
-- Contact list you import + campaigns you send over Viber Business Messages via
-- Infobip, with per-recipient delivery logging and an opt-out/consent model.
--
-- Run this once in Supabase → SQL editor. Safe to re-run (idempotent).
--
-- Only the service-role client (the admin API routes) touches these tables, so
-- RLS is enabled with NO policies — that denies anon/authenticated access while
-- the service key bypasses RLS as intended.

-- ── Contacts ──────────────────────────────────────────────────────────────────
create table if not exists public.outreach_contacts (
  id            uuid primary key default gen_random_uuid(),
  company_name  text,
  phone         text not null unique,          -- E.164 digits, no '+', e.g. 38970123456
  source        text,                          -- where the number came from
  consent_status text not null default 'unknown'  -- 'granted' | 'unknown' | 'declined'
                 check (consent_status in ('granted', 'unknown', 'declined')),
  opted_out     boolean not null default false,
  opted_out_at  timestamptz,
  notes         text,
  created_at    timestamptz not null default now()
);

-- ── Campaigns ─────────────────────────────────────────────────────────────────
create table if not exists public.outreach_campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  message      text not null,                  -- may contain {company} placeholder
  audience     text not null default 'consented'  -- 'consented' | 'all_not_opted_out'
               check (audience in ('consented', 'all_not_opted_out')),
  status       text not null default 'draft'   -- draft|sending|sent|failed
               check (status in ('draft', 'sending', 'sent', 'failed')),
  total        int not null default 0,
  sent_count   int not null default 0,
  failed_count int not null default 0,
  error        text,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);

-- ── Per-recipient messages (delivery log) ─────────────────────────────────────
create table if not exists public.outreach_messages (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid references public.outreach_campaigns(id) on delete cascade,
  contact_id          uuid references public.outreach_contacts(id) on delete set null,
  phone               text not null,
  company_name        text,
  body                text,
  provider_message_id text,                    -- Infobip messageId, for webhook matching
  status              text not null default 'pending'  -- pending|sent|delivered|seen|failed
                      check (status in ('pending', 'sent', 'delivered', 'seen', 'failed')),
  error               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists outreach_messages_campaign_idx on public.outreach_messages(campaign_id);
create index if not exists outreach_messages_provider_idx on public.outreach_messages(provider_message_id);
create index if not exists outreach_contacts_optout_idx    on public.outreach_contacts(opted_out);

alter table public.outreach_contacts  enable row level security;
alter table public.outreach_campaigns enable row level security;
alter table public.outreach_messages  enable row level security;

-- These tables are admin-only (the app reaches them via the service role, which
-- bypasses RLS). Explicit admin policies document that and clear the
-- rls_enabled_no_policy advisor suggestion.
drop policy if exists "Admins manage outreach contacts" on outreach_contacts;
create policy "Admins manage outreach contacts" on outreach_contacts
  for all using (private.get_user_role() = 'admin');
drop policy if exists "Admins manage outreach campaigns" on outreach_campaigns;
create policy "Admins manage outreach campaigns" on outreach_campaigns
  for all using (private.get_user_role() = 'admin');
drop policy if exists "Admins manage outreach messages" on outreach_messages;
create policy "Admins manage outreach messages" on outreach_messages
  for all using (private.get_user_role() = 'admin');
-- ============================================================================
-- DATA API GRANTS (required for tables created on/after 2026-10-30)
-- Supabase stopped auto-granting Data API access to new public tables. Without
-- these, a table returns "permission denied" through supabase-js/PostgREST.
-- authenticated + service_role get full CRUD (RLS still gates rows); anon is
-- read-only. Idempotent — safe to re-run. Also in supabase/data-api-grants.sql.
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;
