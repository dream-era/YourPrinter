-- ============================================================================
-- Migration: 0020_realtime_tables.sql
-- Enables Realtime on critical tables for frontend WebSocket updates
-- ============================================================================

-- Create the realtime publication if it doesn't exist
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      CREATE PUBLICATION supabase_realtime;
    END IF;
  END
  $$;
COMMIT;

-- Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE print_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
