-- ==========================================
-- File: 0016_order_details_extensions.sql
-- ==========================================

-- ============================================================================
-- Migration: Add missing fields for the redesigned Order Details Panel
-- Adds college, department, year, and student_id_number to profiles.
-- Adds shop_notes, customer_notes, and attachments to orders.
-- ============================================================================

-- Extend profiles for detailed customer information
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS college text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS student_id_number text;

-- Extend orders for shop notes, customer notes, and attachments
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shop_notes text,
  ADD COLUMN IF NOT EXISTS customer_notes text,
  ADD COLUMN IF NOT EXISTS attachments jsonb; -- Array of { name: string, url: string, size: number, type: string }

-- Create storage bucket for order attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order_attachments', 'order_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for order_attachments
-- Owners and staff can upload and read attachments for their shops
-- (We use standard RLS, but since storage policies are tied to auth.uid(), we might need a simpler policy for the prototype)
CREATE POLICY "Shop staff can read order attachments" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'order_attachments');

CREATE POLICY "Shop staff can insert order attachments" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'order_attachments');

CREATE POLICY "Shop staff can delete order attachments" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'order_attachments');
