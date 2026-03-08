-- =====================================================
-- MAKTABA MUHAMMADIYAH - COMPLETE E-COMMERCE BACKEND
-- Production-Ready SQL Migration
-- =====================================================

-- =====================================================
-- PART 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- 1.1 Add tracking and payment fields to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS tracking_carrier text,
ADD COLUMN IF NOT EXISTS tracking_url text,
ADD COLUMN IF NOT EXISTS estimated_delivery date,
ADD COLUMN IF NOT EXISTS razorpay_order_id text,
ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
ADD COLUMN IF NOT EXISTS razorpay_signature text,
ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason text,
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod',
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancel_reason text;

-- 1.2 Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_razorpay ON public.orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_refund_status ON public.orders(refund_status) WHERE refund_status != 'none';

-- 1.3 Add author and ISBN to products (books need these)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS author text,
ADD COLUMN IF NOT EXISTS isbn text,
ADD COLUMN IF NOT EXISTS publisher text,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'English',
ADD COLUMN IF NOT EXISTS pages integer,
ADD COLUMN IF NOT EXISTS binding text;

-- =====================================================
-- PART 2: CREATE NEW TABLES
-- =====================================================

-- 2.1 Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL,
  discount_value numeric NOT NULL,
  minimum_order_usd numeric DEFAULT 0,
  minimum_order_inr numeric DEFAULT 0,
  max_uses integer,
  current_uses integer DEFAULT 0,
  max_uses_per_user integer DEFAULT 1,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  applies_to_categories text[],
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2.2 Coupon Usage Tracking
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  discount_applied numeric NOT NULL,
  used_at timestamp with time zone DEFAULT now()
);

-- 2.3 Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  title text,
  content text,
  status text DEFAULT 'pending',
  admin_response text,
  helpful_count integer DEFAULT 0,
  verified_purchase boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- 2.4 Review Helpful Votes
CREATE TABLE IF NOT EXISTS public.review_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- 2.5 Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 2.6 Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  subscribed_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  unsubscribed_at timestamp with time zone,
  source text DEFAULT 'website'
);

-- 2.7 Admin Activity Log
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2.8 Shipping Zones
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  countries text[] NOT NULL,
  base_rate_usd numeric NOT NULL DEFAULT 0,
  base_rate_inr numeric NOT NULL DEFAULT 0,
  free_shipping_threshold_usd numeric,
  free_shipping_threshold_inr numeric,
  per_kg_rate_usd numeric DEFAULT 0,
  per_kg_rate_inr numeric DEFAULT 0,
  estimated_days_min integer,
  estimated_days_max integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2.9 Contact Messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'new',
  admin_notes text,
  replied_at timestamp with time zone,
  replied_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- PART 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON public.wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_admin_log_admin ON public.admin_activity_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_log_entity ON public.admin_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_countries ON public.shipping_zones USING GIN(countries);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status, created_at DESC);

-- =====================================================
-- PART 4: FUNCTIONS
-- =====================================================

-- 4.1 Function to validate coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code text,
  p_user_id uuid,
  p_order_total_usd numeric,
  p_order_total_inr numeric,
  p_currency text
)
RETURNS TABLE (
  is_valid boolean,
  coupon_id uuid,
  discount_type text,
  discount_value numeric,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_user_usage integer;
BEGIN
  SELECT * INTO v_coupon FROM coupons c
  WHERE c.code = UPPER(p_code)
    AND c.is_active = true
    AND (c.valid_from IS NULL OR c.valid_from <= now())
    AND (c.valid_until IS NULL OR c.valid_until >= now())
    AND (c.max_uses IS NULL OR c.current_uses < c.max_uses);

  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, 'Invalid or expired coupon code'::text;
    RETURN;
  END IF;

  IF p_currency = 'INR' AND p_order_total_inr < v_coupon.minimum_order_inr THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, 
      format('Minimum order of ₹%s required', v_coupon.minimum_order_inr)::text;
    RETURN;
  END IF;

  IF p_currency = 'USD' AND p_order_total_usd < v_coupon.minimum_order_usd THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric,
      format('Minimum order of $%s required', v_coupon.minimum_order_usd)::text;
    RETURN;
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage FROM coupon_usage cu
    WHERE cu.coupon_id = v_coupon.id AND cu.user_id = p_user_id;
    
    IF v_user_usage >= v_coupon.max_uses_per_user THEN
      RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric,
        'You have already used this coupon'::text;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT true, v_coupon.id, v_coupon.discount_type, v_coupon.discount_value, NULL::text;
END;
$$;

-- 4.2 Function to update product rating from reviews
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_rating numeric;
  v_review_count integer;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO v_avg_rating, v_review_count
  FROM reviews
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND status = 'approved';

  UPDATE products
  SET rating = COALESCE(v_avg_rating, 0),
      reviews = COALESCE(v_review_count, 0),
      updated_at = now()
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4.3 Function to check if user purchased product
CREATE OR REPLACE FUNCTION public.user_purchased_product(p_user_id uuid, p_product_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = p_user_id
      AND oi.product_id = p_product_id
      AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
  );
$$;

-- 4.4 Function to get shipping rate for a country
CREATE OR REPLACE FUNCTION public.get_shipping_rate(
  p_country_code text,
  p_weight_grams integer,
  p_currency text
)
RETURNS TABLE (
  zone_name text,
  shipping_cost numeric,
  estimated_days_min integer,
  estimated_days_max integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_zone RECORD;
  v_cost numeric;
BEGIN
  SELECT * INTO v_zone FROM shipping_zones sz
  WHERE p_country_code = ANY(sz.countries)
    AND sz.is_active = true
  LIMIT 1;

  IF v_zone IS NULL THEN
    SELECT * INTO v_zone FROM shipping_zones sz
    WHERE 'WORLDWIDE' = ANY(sz.countries)
      AND sz.is_active = true
    LIMIT 1;
  END IF;

  IF v_zone IS NULL THEN
    RETURN QUERY SELECT 'Standard'::text, 
      CASE WHEN p_currency = 'INR' THEN 500.00 ELSE 9.99 END,
      7, 14;
    RETURN;
  END IF;

  IF p_currency = 'INR' THEN
    v_cost := v_zone.base_rate_inr + (COALESCE(p_weight_grams, 0) / 1000.0 * v_zone.per_kg_rate_inr);
  ELSE
    v_cost := v_zone.base_rate_usd + (COALESCE(p_weight_grams, 0) / 1000.0 * v_zone.per_kg_rate_usd);
  END IF;

  RETURN QUERY SELECT v_zone.name, v_cost, v_zone.estimated_days_min, v_zone.estimated_days_max;
END;
$$;

-- 4.5 Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action text,
  p_entity_type text,
  p_entity_id text DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO admin_activity_log (admin_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_old_value, p_new_value)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 4.6 Decrement stock on order paid
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE products p
    SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - oi.quantity),
        in_stock = CASE WHEN COALESCE(stock_quantity, 0) - oi.quantity > 0 THEN true ELSE false END
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
  END IF;
  
  IF NEW.status = 'cancelled' AND OLD.status IN ('paid', 'processing', 'shipped') THEN
    UPDATE products p
    SET stock_quantity = COALESCE(stock_quantity, 0) + oi.quantity,
        in_stock = true
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- PART 5: TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_product_rating_trigger ON public.reviews;
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

DROP TRIGGER IF EXISTS decrement_stock_trigger ON public.orders;
CREATE TRIGGER decrement_stock_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_shipping_zones_updated_at ON public.shipping_zones;
CREATE TRIGGER update_shipping_zones_updated_at
  BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PART 6: ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 6.1 Coupons Policies
DROP POLICY IF EXISTS "Active coupons are publicly readable" ON public.coupons;
CREATE POLICY "Active coupons are publicly readable" ON public.coupons
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 6.2 Coupon Usage Policies
DROP POLICY IF EXISTS "Users can view own coupon usage" ON public.coupon_usage;
CREATE POLICY "Users can view own coupon usage" ON public.coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all coupon usage" ON public.coupon_usage;
CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Service can insert coupon usage" ON public.coupon_usage;
CREATE POLICY "Service can insert coupon usage" ON public.coupon_usage
  FOR INSERT WITH CHECK (true);

-- 6.3 Reviews Policies
DROP POLICY IF EXISTS "Approved reviews are publicly readable" ON public.reviews;
CREATE POLICY "Approved reviews are publicly readable" ON public.reviews
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 6.4 Review Votes Policies
DROP POLICY IF EXISTS "Users can vote on reviews" ON public.review_votes;
CREATE POLICY "Users can vote on reviews" ON public.review_votes
  FOR ALL USING (auth.uid() = user_id);

-- 6.5 Wishlist Policies
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage own wishlist" ON public.wishlists
  FOR ALL USING (auth.uid() = user_id);

-- 6.6 Newsletter Policies
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 6.7 Admin Activity Log Policies
DROP POLICY IF EXISTS "Admins can view activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can view activity log" ON public.admin_activity_log
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can insert activity log" ON public.admin_activity_log
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- 6.8 Shipping Zones Policies
DROP POLICY IF EXISTS "Shipping zones are publicly readable" ON public.shipping_zones;
CREATE POLICY "Shipping zones are publicly readable" ON public.shipping_zones
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage shipping zones" ON public.shipping_zones;
CREATE POLICY "Admins can manage shipping zones" ON public.shipping_zones
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 6.9 Contact Messages Policies
DROP POLICY IF EXISTS "Anyone can submit contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact message" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- =====================================================
-- PART 7: INSERT DEFAULT DATA
-- =====================================================

INSERT INTO public.shipping_zones (name, countries, base_rate_usd, base_rate_inr, free_shipping_threshold_usd, free_shipping_threshold_inr, per_kg_rate_usd, per_kg_rate_inr, estimated_days_min, estimated_days_max)
VALUES 
  ('India', ARRAY['IN'], 0, 50, 100, 1500, 0, 30, 3, 7),
  ('USA', ARRAY['US'], 9.99, 830, 100, 8300, 2, 166, 7, 14),
  ('UK', ARRAY['GB'], 12.99, 1080, 120, 10000, 2.5, 208, 7, 14),
  ('Canada', ARRAY['CA'], 11.99, 1000, 110, 9200, 2.5, 208, 7, 14),
  ('Australia', ARRAY['AU'], 14.99, 1250, 130, 10830, 3, 250, 10, 18),
  ('Europe', ARRAY['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL'], 12.99, 1080, 120, 10000, 2.5, 208, 7, 14),
  ('Middle East', ARRAY['AE', 'SA', 'QA', 'KW', 'BH', 'OM'], 11.99, 1000, 100, 8300, 2, 166, 5, 10),
  ('Worldwide', ARRAY['WORLDWIDE'], 19.99, 1660, 150, 12500, 4, 333, 14, 28)
ON CONFLICT DO NOTHING;

INSERT INTO public.coupons (code, description, discount_type, discount_value, minimum_order_usd, minimum_order_inr, max_uses, valid_until)
VALUES 
  ('WELCOME10', 'Welcome discount - 10% off your first order', 'percentage', 10, 20, 1600, 1000, now() + interval '1 year'),
  ('BOOKS20', 'Special 20% discount on all books', 'percentage', 20, 50, 4000, 500, now() + interval '6 months')
ON CONFLICT DO NOTHING;