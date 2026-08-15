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
