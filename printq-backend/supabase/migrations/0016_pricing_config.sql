-- Add config column to pricing table to store the complex UI state
alter table pricing add column if not exists config jsonb not null default '{}'::jsonb;
