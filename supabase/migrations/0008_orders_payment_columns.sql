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
