-- ============================================================================
-- ADDITIONAL TABLES FOR E-COMMERCE BOOKSTORE
-- Run this SQL in Supabase SQL Editor to add missing tables and make admin
-- ============================================================================

-- ============================================================================
-- 1. SUPPORT MESSAGES TABLE (for contact form)
-- ============================================================================
-- Check if contact_messages table exists, if not create it
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',  -- 'unread', 'read', 'replied', 'archived'
  admin_notes TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  replied_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies for contact_messages
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- 2. EXCHANGE RATES TABLE
-- ============================================================================
-- Check if exchange_rates needs unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'exchange_rates_base_target_unique'
  ) THEN
    -- Try to add unique constraint if the columns exist
    BEGIN
      ALTER TABLE public.exchange_rates
        ADD CONSTRAINT exchange_rates_base_target_unique 
        UNIQUE (base_currency, target_currency);
    EXCEPTION WHEN OTHERS THEN
      -- Constraint might already exist with different name, ignore
      NULL;
    END;
  END IF;
END $$;

-- Insert default INR rate if not exists
INSERT INTO public.exchange_rates (base_currency, target_currency, rate, updated_at)
VALUES ('USD', 'INR', 83.50, NOW())
ON CONFLICT DO NOTHING;

-- Enable RLS on exchange_rates if not already
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read exchange rates
DROP POLICY IF EXISTS "Exchange rates are publicly readable" ON public.exchange_rates;
CREATE POLICY "Exchange rates are publicly readable"
  ON public.exchange_rates FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Admins can update exchange rates
DROP POLICY IF EXISTS "Admins can update exchange rates" ON public.exchange_rates;
CREATE POLICY "Admins can update exchange rates"
  ON public.exchange_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- 3. MAKE USER ADMIN
-- Replace the email below with your admin email
-- ============================================================================
-- First, make sure the user exists and get their user_id
-- Then update or insert their role

-- For thebestofgaming2008@gmail.com
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user_id from auth.users (or from profiles if auth.users isn't accessible)
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'thebestofgaming2008@gmail.com'
  LIMIT 1;
  
  IF target_user_id IS NOT NULL THEN
    -- Update existing role or insert new one
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Successfully set admin role for user: %', target_user_id;
  ELSE
    RAISE NOTICE 'User with email thebestofgaming2008@gmail.com not found. Please create the account first, then run this script again.';
  END IF;
END $$;

-- ============================================================================
-- 4. ADD MISSING COLUMNS TO PRODUCTS TABLE (if needed)
-- ============================================================================
DO $$
BEGIN
  -- Add low_stock_threshold if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE public.products ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
  END IF;
END $$;

-- ============================================================================
-- 5. VERIFY SETUP
-- ============================================================================
-- Check if admin user exists
SELECT 
  ur.user_id,
  ur.role,
  p.email,
  p.full_name
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE ur.role = 'admin';
