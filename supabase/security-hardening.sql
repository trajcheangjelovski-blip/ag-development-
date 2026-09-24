-- ============================================================================
-- SECURITY HARDENING — clears the Supabase advisor warnings & suggestions
-- ============================================================================
-- Run this ONCE in the Supabase SQL editor on the live project. Idempotent —
-- safe to re-run. Clears everything in the Advisors → Security export except
-- `auth_leaked_password_protection`, which is a dashboard toggle (see step 6).
--
--   function_search_path_mutable ........ 4 functions           (step 1)
--   anon/authenticated definer-exec ..... get_user_role/_client_id (step 2)
--   anon/authenticated definer-exec ..... handle_new_user        (step 3)
--   rls_policy_always_true .............. leads INSERT policy    (step 4)
--   rls_enabled_no_policy ............... 3 outreach tables      (step 5)
-- ----------------------------------------------------------------------------

-- 1) The two RLS helper functions move into a `private` schema the Data API does
--    NOT expose, so they can no longer be called as REST RPCs. `set schema`
--    preserves each function's identity (OID), so all ~45 policies that call them
--    keep working with no change. Do the MOVE first (guarded), then replace the
--    body in place — so the script is re-runnable with no duplicate functions.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

do $$
begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'get_user_role') then
    alter function public.get_user_role() set schema private;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname = 'get_user_client_id') then
    alter function public.get_user_client_id() set schema private;
  end if;
end $$;

-- 2) Pin search_path + schema-qualify bodies (fixes function_search_path_mutable).
--    CREATE OR REPLACE keeps the same OID, so policies stay bound to these.
create or replace function private.get_user_role()
  returns text language sql security definer set search_path = ''
  as $$ select role from public.profiles where id = auth.uid(); $$;

create or replace function private.get_user_client_id()
  returns uuid language sql security definer set search_path = ''
  as $$ select client_id from public.profiles where id = auth.uid(); $$;

create or replace function public.update_updated_at()
  returns trigger language plpgsql set search_path = ''
  as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = ''
  as $$
  begin
    insert into public.profiles (id, email, full_name, role)
    values (
      new.id, new.email,
      coalesce(new.raw_user_meta_data->>'full_name', new.email),
      coalesce(new.raw_user_meta_data->>'role', 'client')
    );
    return new;
  end; $$;

-- Policy evaluation runs the helpers as the querying role, so it needs EXECUTE.
grant execute on function private.get_user_role()      to anon, authenticated, service_role;
grant execute on function private.get_user_client_id() to anon, authenticated, service_role;

-- 3) handle_new_user runs only via its trigger, never as an RPC — drop the API
--    roles' default EXECUTE so it stops showing as publicly executable.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 4) leads: every insert goes through the service role (bypasses RLS), so the
--    always-true public INSERT policy is unused. Drop it.
drop policy if exists "Anyone can insert leads" on leads;

-- 5) outreach_* had RLS on but no policies. They're admin-only (service role).
--    Add explicit admin policies to document intent and satisfy the linter.
drop policy if exists "Admins manage outreach campaigns" on outreach_campaigns;
create policy "Admins manage outreach campaigns" on outreach_campaigns
  for all using (private.get_user_role() = 'admin');
drop policy if exists "Admins manage outreach contacts" on outreach_contacts;
create policy "Admins manage outreach contacts" on outreach_contacts
  for all using (private.get_user_role() = 'admin');
drop policy if exists "Admins manage outreach messages" on outreach_messages;
create policy "Admins manage outreach messages" on outreach_messages
  for all using (private.get_user_role() = 'admin');

-- 6) NOT fixable in SQL: enable "Leaked password protection" in
--    Dashboard → Authentication → Sign In / Providers → Password protection.
-- ----------------------------------------------------------------------------
-- ROLLBACK (if ever needed): move the helpers back and they work as before —
--   alter function private.get_user_role() set schema public;
--   alter function private.get_user_client_id() set schema public;
