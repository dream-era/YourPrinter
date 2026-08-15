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
