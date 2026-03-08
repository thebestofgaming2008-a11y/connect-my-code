-- ==========================================
-- FIX ALL RLS POLICIES
-- Run this ENTIRE script in Supabase Dashboard:
--   SQL Editor → New Query → Paste → Run
-- ==========================================

-- 0. Ensure is_admin() function is SECURITY DEFINER
--    (bypasses RLS so admin policies can read user_roles)
CREATE OR REPLACE FUNCTION is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = _user_id
    AND user_roles.role IN ('admin', 'super_admin')
  );
END;
$$;

-- 0b. Ensure GRANTs exist for authenticated role
GRANT SELECT, INSERT, UPDATE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT ON order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON exchange_rates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON support_messages TO authenticated;
GRANT SELECT, INSERT ON reviews TO authenticated;
GRANT SELECT, INSERT ON order_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT SELECT ON products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO authenticated;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON exchange_rates TO anon;

-- =============== USER_ROLES ===============
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;
CREATE POLICY "Users can insert own role" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own role" ON user_roles;
CREATE POLICY "Users can update own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- =============== ORDERS ===============
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can read all orders" ON orders;
CREATE POLICY "Admin can read all orders" ON orders
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update orders" ON orders;
CREATE POLICY "Admin can update orders" ON orders
  FOR UPDATE USING (is_admin(auth.uid()));

-- =============== ORDER_ITEMS ===============
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can read all order items" ON order_items;
CREATE POLICY "Admin can read all order items" ON order_items
  FOR SELECT USING (is_admin(auth.uid()));

-- =============== EXCHANGE_RATES ===============
DROP POLICY IF EXISTS "Anyone can read exchange rates" ON exchange_rates;
CREATE POLICY "Anyone can read exchange rates" ON exchange_rates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert exchange rates" ON exchange_rates;
CREATE POLICY "Admin can insert exchange rates" ON exchange_rates
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update exchange rates" ON exchange_rates;
CREATE POLICY "Admin can update exchange rates" ON exchange_rates
  FOR UPDATE USING (is_admin(auth.uid()));

-- =============== PROFILES ===============
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- =============== SUPPORT_MESSAGES ===============
DROP POLICY IF EXISTS "Anyone can insert support messages" ON support_messages;
CREATE POLICY "Anyone can insert support messages" ON support_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own support messages" ON support_messages;
CREATE POLICY "Users can read own support messages" ON support_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can read support messages" ON support_messages;
CREATE POLICY "Admin can read support messages" ON support_messages
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update support messages" ON support_messages;
CREATE POLICY "Admin can update support messages" ON support_messages
  FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete support messages" ON support_messages;
CREATE POLICY "Admin can delete support messages" ON support_messages
  FOR DELETE USING (is_admin(auth.uid()));

-- =============== REVIEWS ===============
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reviews" ON reviews;
CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============== ORDER_STATUS_HISTORY ===============
DROP POLICY IF EXISTS "Users can read own order status history" ON order_status_history;
CREATE POLICY "Users can read own order status history" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can read all order status history" ON order_status_history;
CREATE POLICY "Admin can read all order status history" ON order_status_history
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can insert order status history" ON order_status_history;
CREATE POLICY "Admin can insert order status history" ON order_status_history
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- =============== PRODUCTS ===============
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active products" ON products;
CREATE POLICY "Anyone can read active products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert products" ON products;
CREATE POLICY "Admin can insert products" ON products
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update products" ON products;
CREATE POLICY "Admin can update products" ON products
  FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete products" ON products;
CREATE POLICY "Admin can delete products" ON products
  FOR DELETE USING (is_admin(auth.uid()));

-- =============== CATEGORIES ===============
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert categories" ON categories;
CREATE POLICY "Admin can insert categories" ON categories
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update categories" ON categories;
CREATE POLICY "Admin can update categories" ON categories
  FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete categories" ON categories;
CREATE POLICY "Admin can delete categories" ON categories
  FOR DELETE USING (is_admin(auth.uid()));
