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

-- Link the ledger rows created back in 0007 to their settlement batch once one exists.
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
