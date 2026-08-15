-- ============================================================================
-- Migration: 0021_fix_documents_status
-- Fixes the check constraint on documents table to allow 'uploading' status
-- ============================================================================

DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find the auto-generated check constraint for the status column
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'documents'::regclass 
    AND contype = 'c' 
    AND pg_get_constraintdef(oid) ILIKE '%status%';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE documents DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- Add the explicit constraint including 'uploading'
ALTER TABLE documents 
  ADD CONSTRAINT documents_status_check 
  CHECK (status IN ('uploading', 'processing', 'ready', 'failed'));
