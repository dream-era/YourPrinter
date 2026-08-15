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
