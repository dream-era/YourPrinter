-- Add storage_provider column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_provider text NOT NULL DEFAULT 'supabase';
