-- ============================================================================
-- Migration: autoprint eligibility
-- The print-agent code has been ready for this since it was built — the
-- only missing piece was WHAT triggers a print_jobs row automatically
-- instead of waiting for a staff click. This column is that trigger's flag.
-- ============================================================================

alter table shops
  add column if not exists autoprint_enabled boolean not null default false,
  add column if not exists autoprint_enabled_at timestamptz;
