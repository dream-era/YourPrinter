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
