-- ============================================================================
-- DATA API GRANTS
-- ============================================================================
-- From 2026-10-30 Supabase no longer auto-grants Data API (PostgREST/supabase-js)
-- access to newly created tables in the public schema. Without an explicit GRANT,
-- a new table returns "permission denied" through the API even though it exists.
--
-- This script (re)applies the grants Supabase used to add automatically:
--   • authenticated + service_role  → full CRUD (row access is still gated by RLS)
--   • anon                          → read-only SELECT
-- and sets DEFAULT PRIVILEGES so every FUTURE table in public is covered too.
--
-- Existing tables in the live project already have their grants and are unaffected.
-- Safe to run any time and as many times as you like (idempotent). Run it after
-- adding a new table via the dashboard or a script that lacks its own grant block.
-- ----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

-- Existing tables
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;

-- Sequences (needed for inserts on any serial/identity columns)
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Future tables & sequences created by this role are granted automatically
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;
