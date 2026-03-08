-- ==========================================
-- SETUP: admin_notes + coupons table + RLS
-- Run this in Supabase Dashboard: SQL Editor → New Query → Paste → Run
-- ==========================================

-- 1. Add admin_notes column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Create coupons table if it doesn't exist
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_usd', 'fixed_inr')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_discount_inr NUMERIC,
  max_discount_usd NUMERIC,
  minimum_order_inr NUMERIC NOT NULL DEFAULT 0,
  minimum_order_usd NUMERIC NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON coupons TO anon;
GRANT SELECT ON coupons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON coupons TO authenticated;

DROP POLICY IF EXISTS "Anyone can read active coupons" ON coupons;
CREATE POLICY "Anyone can read active coupons" ON coupons
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert coupons" ON coupons;
CREATE POLICY "Admin can insert coupons" ON coupons
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update coupons" ON coupons;
CREATE POLICY "Admin can update coupons" ON coupons
  FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete coupons" ON coupons;
CREATE POLICY "Admin can delete coupons" ON coupons
  FOR DELETE USING (is_admin(auth.uid()));
