-- ============================================================================
-- Regional pricing — BACKWARD-COMPATIBLE (safe for a shared/production DB)
-- Creates a SEPARATE table for Macedonian plans. The existing `plans` table is
-- NOT touched, so the currently-deployed English site is completely unaffected.
-- Run this in the Supabase SQL editor.
-- ============================================================================

-- 1. New table mirroring the structure of `plans` (same columns, PK, defaults).
create table if not exists plans_mk (like plans including all);

-- 2. Seed it by cloning the current US plans. Prices are a PLACEHOLDER — edit
--    them (to MKD amounts) in the admin panel. Re-running is safe.
insert into plans_mk
select * from plans
on conflict (id) do nothing;
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
