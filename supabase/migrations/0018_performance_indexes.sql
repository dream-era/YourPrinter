-- ==========================================
-- File: 0018_performance_indexes.sql
-- Description: Adds B-tree indexes on frequently queried columns to prevent sequential scans
-- ==========================================

-- 1. Index on orders(shop_id) to speed up shop dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);

-- 2. Index on orders(student_id) to speed up customer dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_student_id ON public.orders(student_id);

-- 3. Composite index on orders(status, created_at DESC) for dashboard pipeline sorting
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders(status, created_at DESC);

-- 4. Removed index on orders(order_number) because column doesn't exist in our schema

-- 5. Index on orders(paid_at) or payment_status if applicable
-- In our schema, we use 'status' (pending_payment vs accepted) but paid_at is often checked
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at);

-- 6. Index on documents(shop_id) to quickly find shop's documents
CREATE INDEX IF NOT EXISTS idx_documents_shop_id ON public.documents(shop_id);

-- 7. Index on documents(uploaded_by) for customer document history
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

-- 8. Index on order_status_history(order_id, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id, created_at DESC);

-- 9. Index on print_jobs(shop_id, status) for print agent queue polling
CREATE INDEX IF NOT EXISTS idx_print_jobs_shop_status ON public.print_jobs(shop_id, status);

-- 10. Index on print_jobs(order_id)
CREATE INDEX IF NOT EXISTS idx_print_jobs_order_id ON public.print_jobs(order_id);
