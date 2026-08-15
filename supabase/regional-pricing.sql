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
