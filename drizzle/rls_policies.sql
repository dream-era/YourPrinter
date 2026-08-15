-- Enable Row Level Security (RLS) on all YourPrinter tables

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
-- Users can view their own profile, admins can view all profiles
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 2. SHOPS POLICIES
-- Anyone can view active shops
CREATE POLICY "Anyone can view active shops" ON shops
  FOR SELECT USING (is_active = true OR owner_id = auth.uid() OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Shop owners can insert & update their shops
CREATE POLICY "Shop owners can insert shops" ON shops
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Shop owners can update own shops" ON shops
  FOR UPDATE USING (auth.uid() = owner_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- 3. STAFF POLICIES
-- Shop owners and admins can manage staff
CREATE POLICY "Shop owners can manage staff" ON staff
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = staff.shop_id AND shops.owner_id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    OR staff.user_id = auth.uid()
  );

-- 4. DOCUMENTS POLICIES
-- Users can manage their own documents
CREATE POLICY "Users can access own documents" ON documents
  FOR ALL USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- 5. PRICING POLICIES
-- Anyone can view pricing
CREATE POLICY "Anyone can view pricing" ON pricing
  FOR SELECT USING (true);

-- Shop owners/staff can manage pricing
CREATE POLICY "Shop owners can manage pricing" ON pricing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = pricing.shop_id AND shops.owner_id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- 6. ORDERS POLICIES
-- Customers can view their orders; Shop owners/staff can view orders for their shop
CREATE POLICY "Users and Shops can view orders" ON orders
  FOR SELECT USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM staff WHERE staff.shop_id = orders.shop_id AND staff.user_id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Customers can create orders" ON orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Shop owners/staff can update order status" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM shops WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM staff WHERE staff.shop_id = orders.shop_id AND staff.user_id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- 7. PAYMENTS POLICIES
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- 8. RATINGS POLICIES
CREATE POLICY "Anyone can view ratings" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Customers can post ratings" ON ratings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- 9. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- 10. AUDIT LOGS POLICIES
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
