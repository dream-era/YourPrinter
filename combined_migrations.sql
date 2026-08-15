-- ==========================================
-- File: 0007_core_schema.sql
-- ==========================================

-- ============================================================================
-- Migration: core schema (profiles, shops, pricing, documents, orders,
-- order_status_history, notifications)
--
-- This is genuinely new — run this BEFORE 0008/0009 from the payment layer
-- package if you haven't already, since those migrations assume `orders`
-- and `shops` already exist. Recommended order:
--   0007_core_schema.sql  (this file)
--   0008_shop_payment_settings.sql
--   0009_orders_payment_columns.sql   (safe no-op if columns already match)
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists postgis;

-- (safe to define again if 0008 hasn't run yet)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- profiles — thin wrapper over auth.users carrying role + display info.
-- A row should be created here right after Supabase Auth sign-up (via a
-- trigger on auth.users, or explicitly in your sign-up route — pick one and
-- be consistent; a trigger is shown at the bottom of this file, commented out
-- since you may already handle this in your auth flow).
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('student', 'owner', 'staff')),
  full_name   text,
  phone       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- shops
-- ----------------------------------------------------------------------------
create table if not exists shops (
  id                     uuid primary key default gen_random_uuid(),
  owner_id               uuid not null references profiles(id) on delete cascade,
  name                   text not null,
  slug                   text not null unique,
  description            text,
  address                text,
  latitude               double precision not null,
  longitude              double precision not null,
  location               geography(Point, 4326) generated always as (
                           ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
                         ) stored,
  logo_url               text,
  business_hours         jsonb, -- e.g. {"mon": {"open":"09:00","close":"21:00"}, ...}
  status                 text not null default 'pending'
                           check (status in ('pending', 'active', 'disabled')),
  -- Crowd-level thresholds, tunable per shop. crowd = count of active orders
  -- (accepted/printing) in a rolling window.
  crowd_threshold_medium integer not null default 3,
  crowd_threshold_high   integer not null default 8,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_shops_location on shops using gist (location);
create index if not exists idx_shops_owner_id on shops (owner_id);
create index if not exists idx_shops_status on shops (status);

-- ----------------------------------------------------------------------------
-- shop_staff — links additional staff accounts to a shop (owner is implicit
-- via shops.owner_id and doesn't need a row here, though you may add one).
-- Full invite/PIN-login flow is a separate module — this table is just the
-- membership record the order-lifecycle routes check against.
-- ----------------------------------------------------------------------------
create table if not exists shop_staff (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references shops(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       text not null check (role in ('manager', 'printer_operator', 'cashier')),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

-- ----------------------------------------------------------------------------
-- pricing — one row per shop. Referenced directly by lib/pricing/calculate.ts.
-- ----------------------------------------------------------------------------
create table if not exists pricing (
  id                       uuid primary key default gen_random_uuid(),
  shop_id                  uuid not null unique references shops(id) on delete cascade,
  color_rate_paise         integer not null default 500,  -- ₹5.00/page default
  bw_rate_paise            integer not null default 100,  -- ₹1.00/page default
  staple_rate_paise        integer not null default 0,
  spiral_binding_rate_paise integer not null default 3000,
  hardbound_rate_paise     integer not null default 15000,
  lamination_rate_paise    integer not null default 1000,
  urgent_fee_percent       integer not null default 20,
  updated_at               timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- documents
-- ----------------------------------------------------------------------------
create table if not exists documents (
  id               uuid primary key default gen_random_uuid(),
  uploaded_by      uuid not null references profiles(id) on delete cascade,
  shop_id          uuid not null references shops(id) on delete cascade,
  storage_path     text not null, -- path within Supabase Storage 'documents' bucket
  original_filename text not null,
  mime_type        text not null,
  size_bytes       integer not null,
  page_count       integer,
  status           text not null default 'processing'
                     check (status in ('processing', 'ready', 'failed')),
  processing_error text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_documents_uploaded_by on documents (uploaded_by);
create index if not exists idx_documents_shop_id on documents (shop_id);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create table if not exists orders (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references shops(id) on delete cascade,
  student_id           uuid not null references profiles(id) on delete cascade,
  document_id          uuid not null references documents(id),
  print_options        jsonb not null,
  amount_paise         integer not null,
  status               text not null default 'pending_payment'
                         check (status in (
                           'pending_payment', 'accepted', 'printing',
                           'ready', 'completed', 'cancelled', 'failed'
                         )),

  pickup_code          text,           -- short code shown to student, entered/scanned at counter
  assigned_staff_id    uuid references profiles(id),

  razorpay_order_id    text,
  razorpay_payment_id  text,

  paid_at              timestamptz,
  accepted_at          timestamptz,
  printing_started_at  timestamptz,
  ready_at             timestamptz,
  completed_at         timestamptz,
  cancelled_at         timestamptz,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_orders_shop_status on orders (shop_id, status);
create index if not exists idx_orders_student_id on orders (student_id);
create index if not exists idx_orders_razorpay_order_id on orders (razorpay_order_id);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at(); -- defined in 0008 migration; create here too if run standalone


-- ----------------------------------------------------------------------------
-- order_status_history — audit trail of every transition
-- ----------------------------------------------------------------------------
create table if not exists order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references profiles(id), -- null = system (e.g. webhook)
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_order_status_history_order_id on order_status_history (order_id);

-- ----------------------------------------------------------------------------
-- notifications — persistent, queryable notification history. Supabase
-- Realtime clients subscribe to this table filtered by user_id for live push.
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  order_id   uuid references orders(id) on delete cascade,
  type       text not null, -- e.g. 'order_accepted' | 'order_ready' | 'new_order' | 'order_cancelled'
  title      text not null,
  body       text,
  data       jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on notifications (user_id, created_at desc);

-- ============================================================================
-- Nearby shops search with live crowd level, callable via
-- supabase.rpc('shops_nearby', { lat, lng, radius_meters })
-- ============================================================================
create or replace function shops_nearby(
  lat double precision,
  lng double precision,
  radius_meters double precision default 3000
)
returns table (
  id uuid,
  name text,
  slug text,
  address text,
  logo_url text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  active_order_count bigint,
  crowd_level text
)
language sql
stable
as $$
  select
    s.id,
    s.name,
    s.slug,
    s.address,
    s.logo_url,
    s.latitude,
    s.longitude,
    ST_Distance(s.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distance_meters,
    coalesce(oc.active_order_count, 0) as active_order_count,
    case
      when coalesce(oc.active_order_count, 0) >= s.crowd_threshold_high then 'high'
      when coalesce(oc.active_order_count, 0) >= s.crowd_threshold_medium then 'medium'
      else 'low'
    end as crowd_level
  from shops s
  left join (
    select shop_id, count(*) as active_order_count
    from orders
    where status in ('accepted', 'printing')
      and created_at > now() - interval '2 hours'
    group by shop_id
  ) oc on oc.shop_id = s.id
  where s.status = 'active'
    and ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
  order by distance_meters asc;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table shops enable row level security;
alter table shop_staff enable row level security;
alter table pricing enable row level security;
alter table documents enable row level security;
alter table orders enable row level security;
alter table order_status_history enable row level security;
alter table notifications enable row level security;

-- profiles: users can read/update their own row only
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for select using (id = auth.uid());
drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles
  for update using (id = auth.uid());

-- shops: anyone can view active shops; owners see/manage their own regardless of status
drop policy if exists "public can view active shops" on shops;
create policy "public can view active shops" on shops
  for select using (status = 'active' or owner_id = auth.uid());

-- shop_staff: owner and the staff member themself can view; only owner manages (via service role in API)
drop policy if exists "view own shop staff" on shop_staff;
create policy "view own shop staff" on shop_staff
  for select using (
    user_id = auth.uid()
    or shop_id in (select id from shops where owner_id = auth.uid())
  );

-- pricing: public read (needed to show prices before ordering); write via service role only
drop policy if exists "public can view pricing" on pricing;
create policy "public can view pricing" on pricing
  for select using (true);

-- documents: uploader can see their own; shop owner/staff can see documents for their shop
drop policy if exists "view own or shop documents" on documents;
create policy "view own or shop documents" on documents
  for select using (
    uploaded_by = auth.uid()
    or shop_id in (select id from shops where owner_id = auth.uid())
    or shop_id in (select shop_id from shop_staff where user_id = auth.uid() and active)
  );

-- orders: student sees own; shop owner/staff sees shop's orders
drop policy if exists "view own or shop orders" on orders;
create policy "view own or shop orders" on orders
  for select using (
    student_id = auth.uid()
    or shop_id in (select id from shops where owner_id = auth.uid())
    or shop_id in (select shop_id from shop_staff where user_id = auth.uid() and active)
  );

drop policy if exists "view related order history" on order_status_history;
create policy "view related order history" on order_status_history
  for select using (
    order_id in (
      select id from orders where
        student_id = auth.uid()
        or shop_id in (select id from shops where owner_id = auth.uid())
        or shop_id in (select shop_id from shop_staff where user_id = auth.uid() and active)
    )
  );

drop policy if exists "own notifications" on notifications;
create policy "own notifications" on notifications
  for select using (user_id = auth.uid());
drop policy if exists "mark own notifications read" on notifications;
create policy "mark own notifications read" on notifications
  for update using (user_id = auth.uid());

-- ============================================================================
-- Optional: auto-create a profile row when a new auth user signs up.
-- Uncomment if you want this handled at the DB level instead of your
-- sign-up API route. Defaults everyone to 'student' — adjust as needed,
-- e.g. by reading a role from raw_user_meta_data.
-- ============================================================================
-- create or replace function handle_new_user()
-- returns trigger as $$
-- begin
--   insert into profiles (id, role, full_name)
--   values (new.id, coalesce(new.raw_user_meta_data->>'role', 'student'), new.raw_user_meta_data->>'full_name');
--   return new;
-- end;
-- $$ language plpgsql security definer;
--
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function handle_new_user();


-- ==========================================
-- File: 0008_shop_payment_settings.sql
-- ==========================================

-- ============================================================================
-- Migration: shop_payment_settings
-- Replaces the platform-level Razorpay Route split model with per-shop
-- Razorpay accounts. Each shop connects its own Razorpay Key ID / Key Secret /
-- Webhook Secret. Secrets are stored ENCRYPTED at rest (AES-256-GCM) — the
-- app layer never returns plaintext secrets to any client.
-- ============================================================================

create table if not exists shop_payment_settings (
  id                    uuid primary key default gen_random_uuid(),
  shop_id               uuid not null references shops(id) on delete cascade,

  -- Razorpay identifiers
  razorpay_merchant_name text,
  razorpay_key_id        text not null,          -- not secret, safe to read
  razorpay_key_secret_enc text not null,          -- AES-256-GCM ciphertext (base64)
  razorpay_key_secret_iv  text not null,          -- IV used for encryption (base64)
  razorpay_key_secret_tag text not null,          -- GCM auth tag (base64)
  razorpay_webhook_secret_enc text not null,
  razorpay_webhook_secret_iv  text not null,
  razorpay_webhook_secret_tag text not null,

  -- Onboarding / verification state
  status                text not null default 'pending'
                          check (status in ('pending', 'verifying', 'active', 'failed', 'disabled')),
  verified_at           timestamptz,
  last_verification_error text,

  -- Commission (platform's cut, since there's no auto-Route split anymore —
  -- this is now collected via periodic invoicing/settlement, not per-txn split)
  commission_bps        integer not null default 1000, -- 1000 bps = 10%

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (shop_id)
);

create index if not exists idx_shop_payment_settings_shop_id
  on shop_payment_settings (shop_id);

create index if not exists idx_shop_payment_settings_status
  on shop_payment_settings (status);

-- updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_shop_payment_settings_updated_at on shop_payment_settings;
create trigger trg_shop_payment_settings_updated_at
  before update on shop_payment_settings
  for each row execute function set_updated_at();

-- ============================================================================
-- Ledger: tracks platform commission owed per completed order, since there's
-- no automatic Route split anymore. This is what your settlement/invoicing
-- job reads from to bill shops periodically (e.g. weekly).
-- ============================================================================

create table if not exists platform_commission_ledger (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references shops(id) on delete cascade,
  order_id          uuid not null references orders(id) on delete cascade,
  order_amount_paise integer not null,
  commission_bps    integer not null,
  commission_paise  integer not null,
  settled           boolean not null default false,
  settled_at        timestamptz,
  settlement_batch_id uuid,
  created_at        timestamptz not null default now()
);

create index if not exists idx_commission_ledger_shop_id
  on platform_commission_ledger (shop_id);

create index if not exists idx_commission_ledger_settled
  on platform_commission_ledger (settled);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table shop_payment_settings enable row level security;
alter table platform_commission_ledger enable row level security;

-- Shop owners can see their own payment settings row, but the encrypted
-- columns are useless without the server-side master key, so this is safe
-- even though owners can technically SELECT the ciphertext.
drop policy if exists "owners can view own payment settings" on shop_payment_settings;
create policy "owners can view own payment settings"
  on shop_payment_settings for select
  using (
    shop_id in (
      select id from shops where owner_id = auth.uid()
    )
  );

-- Only server-side (service role) can insert/update — never direct from client.
-- No insert/update/delete policies for authenticated role means those
-- operations only succeed via the service-role key, which is what the
-- payment-settings API route uses server-side.

drop policy if exists "owners can view own commission ledger" on platform_commission_ledger;
create policy "owners can view own commission ledger"
  on platform_commission_ledger for select
  using (
    shop_id in (
      select id from shops where owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Guard: orders cannot be created for a shop whose payment settings are not
-- 'active'. Enforced at the application layer (route handler), but this
-- comment documents the invariant for anyone reading the schema later.
-- ============================================================================


-- ==========================================
-- File: 0009_orders_payment_columns.sql
-- ==========================================

-- ============================================================================
-- Migration: align orders table with per-shop Razorpay flow
-- Safe to run even if some columns already exist from Phase 0 (Route model) —
-- uses IF NOT EXISTS throughout. Review before running if your existing
-- orders table used different column names for the Razorpay order/payment id.
-- ============================================================================

alter table orders
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists print_options jsonb,
  add column if not exists amount_paise integer;

-- Order status should cover the full PRD lifecycle. If you already have a
-- CHECK constraint or enum type from Phase 0 with different values
-- (e.g. Route model may have used 'paid' instead of 'accepted'), reconcile
-- manually rather than blindly applying this constraint.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_status_check'
  ) then
    alter table orders
      add constraint orders_status_check
      check (status in (
        'pending_payment', 'accepted', 'printing', 'ready', 'completed', 'cancelled', 'failed'
      ));
  end if;
end $$;

create index if not exists idx_orders_razorpay_order_id on orders (razorpay_order_id);
create index if not exists idx_orders_shop_status on orders (shop_id, status);


-- ==========================================
-- File: 0010_staff_management.sql
-- ==========================================

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


-- ==========================================
-- File: 0011_refunds_disputes.sql
-- ==========================================

-- ============================================================================
-- Migration: refunds & disputes
-- Refunds are issued from the SHOP'S OWN Razorpay account (same principle
-- as everything else in the per-shop model) — the platform never touches
-- shop funds, including to give them back.
-- ============================================================================

alter table orders
  add column if not exists refund_status text not null default 'none'
    check (refund_status in ('none', 'partial', 'full')),
  add column if not exists refunded_amount_paise integer not null default 0;

create table if not exists refunds (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  shop_id            uuid not null references shops(id) on delete cascade,
  razorpay_refund_id text,
  amount_paise       integer not null,
  reason             text,
  status             text not null default 'processing'
                       check (status in ('processing', 'completed', 'failed')),
  initiated_by       uuid references profiles(id), -- null if system-initiated
  created_at         timestamptz not null default now()
);

create index if not exists idx_refunds_order_id on refunds (order_id);
create index if not exists idx_refunds_shop_id on refunds (shop_id);

create table if not exists disputes (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  shop_id        uuid not null references shops(id) on delete cascade,
  raised_by      uuid not null references profiles(id),
  reason         text not null,
  status         text not null default 'open'
                   check (status in ('open', 'resolved_refunded', 'resolved_rejected')),
  resolution_note text,
  refund_id      uuid references refunds(id),
  resolved_by    uuid references profiles(id),
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

create index if not exists idx_disputes_shop_id on disputes (shop_id, status);
create index if not exists idx_disputes_order_id on disputes (order_id);

alter table refunds enable row level security;
alter table disputes enable row level security;

drop policy if exists "view own or shop refunds" on refunds;
create policy "view own or shop refunds" on refunds
  for select using (
    order_id in (
      select id from orders where
        student_id = auth.uid()
        or shop_id in (select id from shops where owner_id = auth.uid())
        or shop_id in (select shop_id from shop_staff where user_id = auth.uid() and active)
    )
  );

drop policy if exists "view own or shop disputes" on disputes;
create policy "view own or shop disputes" on disputes
  for select using (
    raised_by = auth.uid()
    or shop_id in (select id from shops where owner_id = auth.uid())
    or shop_id in (select shop_id from shop_staff where user_id = auth.uid() and active)
  );


-- ==========================================
-- File: 0012_settlement_batches.sql
-- ==========================================

-- ============================================================================
-- Migration: settlement_batches
-- Since per-shop Razorpay accounts have no automatic Route split, PrintQ
-- collects its commission periodically by sending each shop a Razorpay
-- Payment Link (paid INTO the platform's own Razorpay account, separate
-- from every shop's account) for their accumulated unsettled commission.
-- ============================================================================

create table if not exists settlement_batches (
  id                    uuid primary key default gen_random_uuid(),
  shop_id               uuid not null references shops(id) on delete cascade,
  period_start          timestamptz not null,
  period_end            timestamptz not null,
  total_commission_paise integer not null,
  status                text not null default 'pending'
                          check (status in ('pending', 'invoiced', 'paid', 'failed')),
  razorpay_payment_link_id  text,
  razorpay_payment_link_url text,
  created_at            timestamptz not null default now(),
  paid_at               timestamptz
);

create index if not exists idx_settlement_batches_shop_id on settlement_batches (shop_id);
create index if not exists idx_settlement_batches_status on settlement_batches (status);

-- Link the ledger rows created back in 0008 to their settlement batch once one exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_commission_ledger_settlement_batch'
  ) then
    alter table platform_commission_ledger
      add constraint fk_commission_ledger_settlement_batch
      foreign key (settlement_batch_id) references settlement_batches(id)
      on delete set null;
  end if;
end $$;

alter table settlement_batches enable row level security;

drop policy if exists "owner views own settlement batches" on settlement_batches;
create policy "owner views own settlement batches" on settlement_batches
  for select using (
    shop_id in (select id from shops where owner_id = auth.uid())
  );


-- ==========================================
-- File: 0013_print_agents.sql
-- ==========================================

-- ============================================================================
-- Migration: print agents & print jobs
--
-- shop_agents: a long-lived device credential for the small background
-- service running on a shop's PC (see the standalone printq-print-agent
-- package). This is deliberately NOT the same auth as staff PIN sessions —
-- an agent is a machine, not a person on a shift, and its key shouldn't
-- expire every 12 hours.
--
-- print_jobs: decouples "staff clicked Start Printing" (orders.status =
-- 'printing') from "the physical printer actually finished" — printing can
-- fail for hardware reasons independent of the order workflow, and this
-- table is what the agent reports into.
-- ============================================================================

create table if not exists shop_agents (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references shops(id) on delete cascade,
  name           text not null, -- e.g. "Front counter PC"
  agent_key_hash text not null,
  active         boolean not null default true,
  last_seen_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists idx_shop_agents_shop_id on shop_agents (shop_id);

create table if not exists print_jobs (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references orders(id) on delete cascade,
  shop_id          uuid not null references shops(id) on delete cascade,
  document_id      uuid not null references documents(id),
  status           text not null default 'queued'
                     check (status in ('queued', 'claimed', 'printing', 'completed', 'failed')),
  attempts         integer not null default 0,
  last_error       text,
  claimed_by_agent_id uuid references shop_agents(id),
  created_at       timestamptz not null default now(),
  claimed_at       timestamptz,
  completed_at     timestamptz
);

create index if not exists idx_print_jobs_shop_status on print_jobs (shop_id, status);
create index if not exists idx_print_jobs_order_id on print_jobs (order_id);

alter table shop_agents enable row level security;
alter table print_jobs enable row level security;

drop policy if exists "owner manages own agents" on shop_agents;
create policy "owner manages own agents" on shop_agents
  for all
  using (shop_id in (select id from shops where owner_id = auth.uid()))
  with check (shop_id in (select id from shops where owner_id = auth.uid()));

drop policy if exists "shop team views print jobs" on print_jobs;
create policy "shop team views print jobs" on print_jobs
  for select using (
    shop_id in (select id from shops where owner_id = auth.uid())
    or shop_id in (select shop_id from shop_staff where user_id = auth.uid() and active)
  );

-- Note: shop_agents.agent_key_hash is never selected by any client-facing
-- policy path above other than the owner viewing their own row (harmless —
-- it's a bcrypt hash, useless without the plaintext key, same reasoning as
-- shop_payment_settings). Agent-authenticated routes use the service-role
-- client exclusively and never expose this column.


-- ==========================================
-- File: 0014_analytics_functions.sql
-- ==========================================

-- ============================================================================
-- Migration: analytics functions
-- All read-only aggregation over `orders` — no new tables needed. Each is a
-- SQL function callable via supabase.rpc(), same pattern as shops_nearby().
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Dashboard overview: today's counts + revenue by status. Powers the top-of-
-- dashboard summary cards (PRD: "Today's Orders / Revenue / Pending /
-- Printing / Ready / Completed").
-- ----------------------------------------------------------------------------
create or replace function shop_dashboard_overview(p_shop_id uuid)
returns table (
  orders_today bigint,
  revenue_today_paise bigint,
  pending_count bigint,
  accepted_count bigint,
  printing_count bigint,
  ready_count bigint,
  completed_today_count bigint,
  cancelled_today_count bigint
)
language sql
stable
as $$
  select
    count(*) filter (where created_at >= date_trunc('day', now())) as orders_today,
    coalesce(sum(amount_paise) filter (
      where created_at >= date_trunc('day', now()) and status in ('accepted','printing','ready','completed')
    ), 0) as revenue_today_paise,
    count(*) filter (where status = 'pending_payment') as pending_count,
    count(*) filter (where status = 'accepted') as accepted_count,
    count(*) filter (where status = 'printing') as printing_count,
    count(*) filter (where status = 'ready') as ready_count,
    count(*) filter (where status = 'completed' and completed_at >= date_trunc('day', now())) as completed_today_count,
    count(*) filter (where status = 'cancelled' and cancelled_at >= date_trunc('day', now())) as cancelled_today_count
  from orders
  where shop_id = p_shop_id;
$$;

-- ----------------------------------------------------------------------------
-- Revenue over time, bucketed by day. `days_back` controls the window
-- (e.g. 30 for "last 30 days"); the frontend can bucket further into
-- weeks/months client-side if needed, or call this with a larger window.
-- ----------------------------------------------------------------------------
create or replace function shop_revenue_timeseries(p_shop_id uuid, days_back integer default 30)
returns table (
  day date,
  revenue_paise bigint,
  order_count bigint
)
language sql
stable
as $$
  select
    date_trunc('day', created_at)::date as day,
    coalesce(sum(amount_paise), 0) as revenue_paise,
    count(*) as order_count
  from orders
  where shop_id = p_shop_id
    and status in ('accepted', 'printing', 'ready', 'completed')
    and created_at >= now() - (days_back || ' days')::interval
  group by day
  order by day asc;
$$;

-- ----------------------------------------------------------------------------
-- Peak hours: order counts by hour-of-day (0-23), for "when is this shop
-- actually busy" — feeds both owner analytics and could later inform
-- smarter crowd-level defaults.
-- ----------------------------------------------------------------------------
create or replace function shop_peak_hours(p_shop_id uuid, days_back integer default 30)
returns table (
  hour_of_day integer,
  order_count bigint
)
language sql
stable
as $$
  select
    extract(hour from created_at)::integer as hour_of_day,
    count(*) as order_count
  from orders
  where shop_id = p_shop_id
    and status in ('accepted', 'printing', 'ready', 'completed')
    and created_at >= now() - (days_back || ' days')::interval
  group by hour_of_day
  order by hour_of_day asc;
$$;

-- ----------------------------------------------------------------------------
-- Popular services: breakdown by print_options fields (jsonb), since there's
-- no separate normalized "service" table — options live directly on the order.
-- ----------------------------------------------------------------------------
create or replace function shop_popular_services(p_shop_id uuid, days_back integer default 90)
returns table (
  color_orders bigint,
  bw_orders bigint,
  double_sided_orders bigint,
  single_sided_orders bigint,
  binding_none bigint,
  binding_staple bigint,
  binding_spiral bigint,
  binding_hardbound bigint,
  lamination_orders bigint,
  urgent_orders bigint
)
language sql
stable
as $$
  select
    count(*) filter (where print_options->>'color' = 'color') as color_orders,
    count(*) filter (where print_options->>'color' = 'bw') as bw_orders,
    count(*) filter (where print_options->>'sides' = 'double') as double_sided_orders,
    count(*) filter (where print_options->>'sides' = 'single') as single_sided_orders,
    count(*) filter (where print_options->>'binding' = 'none') as binding_none,
    count(*) filter (where print_options->>'binding' = 'staple') as binding_staple,
    count(*) filter (where print_options->>'binding' = 'spiral') as binding_spiral,
    count(*) filter (where print_options->>'binding' = 'hardbound') as binding_hardbound,
    count(*) filter (where (print_options->>'lamination')::boolean is true) as lamination_orders,
    count(*) filter (where (print_options->>'urgent')::boolean is true) as urgent_orders
  from orders
  where shop_id = p_shop_id
    and status in ('accepted', 'printing', 'ready', 'completed')
    and created_at >= now() - (days_back || ' days')::interval;
$$;

-- ----------------------------------------------------------------------------
-- Repeat customers: students with more than one completed/paid order at
-- this shop, ranked by order count then total spend.
-- ----------------------------------------------------------------------------
create or replace function shop_repeat_customers(p_shop_id uuid, min_orders integer default 2, result_limit integer default 20)
returns table (
  student_id uuid,
  full_name text,
  order_count bigint,
  total_spent_paise bigint,
  last_order_at timestamptz
)
language sql
stable
as $$
  select
    o.student_id,
    p.full_name,
    count(*) as order_count,
    coalesce(sum(o.amount_paise), 0) as total_spent_paise,
    max(o.created_at) as last_order_at
  from orders o
  join profiles p on p.id = o.student_id
  where o.shop_id = p_shop_id
    and o.status in ('accepted', 'printing', 'ready', 'completed')
  group by o.student_id, p.full_name
  having count(*) >= min_orders
  order by order_count desc, total_spent_paise desc
  limit result_limit;
$$;


-- ==========================================
-- File: 0015_autoprint.sql
-- ==========================================

-- ============================================================================
-- Migration: autoprint eligibility
-- The print-agent code has been ready for this since it was built — the
-- only missing piece was WHAT triggers a print_jobs row automatically
-- instead of waiting for a staff click. This column is that trigger's flag.
-- ============================================================================

alter table shops
  add column if not exists autoprint_enabled boolean not null default false,
  add column if not exists autoprint_enabled_at timestamptz;


