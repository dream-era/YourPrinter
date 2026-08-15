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
