-- ============================================================================
-- Migration: staff management (PIN-based login)
-- Extends shop_staff with what's needed for the invite / PIN-login / reset /
-- disable flow. Staff still get a minimal profiles row (and a corresponding
-- auth.users row created via the admin API with a synthetic email — see
-- app/api/shops/[shopId]/staff/route.ts) so that changed_by / assigned_staff_id
-- foreign keys and existing RLS policies keep working unchanged. They just
-- never log in with that email/password; they use the PIN endpoint instead.
-- ============================================================================

alter table shop_staff
  add column if not exists display_name text not null default '',
  add column if not exists phone text,
  add column if not exists pin_hash text,
  add column if not exists invited_by uuid references profiles(id),
  add column if not exists last_login_at timestamptz;

-- Phone (used to look up which staff row a PIN login is for) must be unique
-- per shop, not globally — the same phone number could staff two shops.
create unique index if not exists idx_shop_staff_shop_phone
  on shop_staff (shop_id, phone)
  where phone is not null;

-- ============================================================================
-- Update RLS: owners need to manage (insert/update) shop_staff, not just
-- view it. The original 0007 policy only covered SELECT — these routes use
-- the service-role client server-side anyway, so this is a defense-in-depth
-- addition, not strictly required for the API routes to function.
-- ============================================================================

drop policy if exists "owner manages shop staff" on shop_staff;
create policy "owner manages shop staff"
  on shop_staff for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));
