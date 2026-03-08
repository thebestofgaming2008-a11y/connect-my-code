-- ============================================================================
-- COMPLETE E-COMMERCE BACKEND FOR PHYSICAL BOOK STORE
-- Run this SQL in Supabase SQL Editor (supabase.com/dashboard -> SQL Editor)
-- ============================================================================

-- ============================================================================
-- PART 1: ENUMS (Run this first, wait for it to complete)
-- ============================================================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create enum for order statuses
CREATE TYPE public.order_status AS ENUM (
  'pending',      -- Order created, awaiting payment
  'paid',         -- Payment received
  'processing',   -- Being prepared for shipping
  'shipped',      -- Shipped, in transit
  'delivered',    -- Delivered to customer
  'cancelled'     -- Order cancelled
);

-- ============================================================================
-- PART 2: TABLES
-- ============================================================================

-- USER ROLES TABLE (Separate from profiles for security - prevents privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,                            -- Can use ISBN for books
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,                          -- e.g., 'books', 'tafsir', 'hadith'
  subcategory TEXT,                                -- e.g., 'aqeedah', 'fiqh', 'seerah'
  author TEXT,                                     -- Book author
  publisher TEXT,                                  -- Publisher name
  language TEXT DEFAULT 'English',                 -- Book language
  pages INTEGER,                                   -- Number of pages
  isbn TEXT,                                       -- ISBN number
  weight_grams INTEGER,                            -- Weight for shipping calculations
  images TEXT[] DEFAULT '{}',                      -- Array of image URLs
  price NUMERIC NOT NULL,                          -- Regular price
  sale_price NUMERIC,                              -- Sale price (if on sale)
  cost_price NUMERIC,                              -- Your cost (for profit calculations)
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,                -- Inventory count
  low_stock_threshold INTEGER DEFAULT 5,           -- Alert when stock falls below this
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  badge TEXT,                                      -- e.g., 'Bestseller', 'New', 'Sale'
  featured BOOLEAN DEFAULT FALSE,                  -- Show on homepage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDERS TABLE
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,                        -- Human-readable order number (e.g., ORD-2024-0001)
  user_id UUID,                                    -- NULL for guest checkout
  status order_status DEFAULT 'pending',
  
  -- Pricing
  subtotal NUMERIC NOT NULL,
  shipping_cost NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Shipping information
  shipping_name TEXT,
  shipping_email TEXT,
  shipping_phone TEXT,
  shipping_address TEXT,
  shipping_address_line2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT,
  
  -- Billing information (if different from shipping)
  billing_name TEXT,
  billing_email TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  
  -- Shipping tracking
  shipping_method TEXT,                            -- e.g., 'standard', 'express', 'international'
  tracking_number TEXT,
  tracking_url TEXT,
  estimated_delivery DATE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_method TEXT,                             -- e.g., 'card', 'paypal'
  payment_status TEXT DEFAULT 'unpaid',            -- 'unpaid', 'paid', 'refunded', 'partial_refund'
  
  -- Admin notes
  notes TEXT,                                      -- Internal notes visible to admin only
  customer_notes TEXT,                             -- Notes from customer
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,                     -- Price at time of purchase
  price NUMERIC NOT NULL,                          -- Total line price (unit_price * quantity)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COUPONS TABLE
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL,                     -- 'percentage' or 'fixed'
  discount_value NUMERIC NOT NULL,                 -- Percentage (0-100) or fixed amount
  minimum_order NUMERIC DEFAULT 0,                 -- Minimum order value to apply
  max_uses INTEGER,                                -- Max total uses
  used_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REVIEWS TABLE
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID,
  customer_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,                  -- Moderation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WISHLIST TABLE
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADMIN ACTIVITY LOG
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,                            -- e.g., 'order_status_changed', 'product_updated'
  entity_type TEXT,                                -- e.g., 'order', 'product'
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_in_stock ON public.products(in_stock);
CREATE INDEX idx_products_featured ON public.products(featured);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);

-- ============================================================================
-- PART 4: FUNCTIONS
-- ============================================================================

-- Function to check if a user has a specific role (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default customer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(NULLIF(SPLIT_PART(order_number, '-', 3), '') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.orders
  WHERE order_number LIKE 'ORD-' || year_part || '-%';
  
  NEW.order_number := 'ORD-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$;

-- Function to update product rating when review is added
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE product_id = NEW.product_id AND approved = TRUE
    ),
    reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE product_id = NEW.product_id AND approved = TRUE
    )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 5: TRIGGERS
-- ============================================================================

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating timestamps on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updating timestamps on products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger for updating timestamps on orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger to generate order number
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.generate_order_number();

-- Trigger to update product rating when review approved
CREATE TRIGGER update_product_rating_trigger
  AFTER INSERT OR UPDATE OF approved ON public.reviews
  FOR EACH ROW
  WHEN (NEW.approved = TRUE)
  EXECUTE FUNCTION public.update_product_rating();

-- ============================================================================
-- PART 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER_ROLES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PRODUCTS POLICIES
-- ============================================================================

CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================

-- Guests and users can create orders (user_id can be NULL for guests)
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update orders
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- ORDER_ITEMS POLICIES
-- ============================================================================

-- Users can create order items for their own orders or guest orders
CREATE POLICY "Users can create own order items"
  ON public.order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND ((orders.user_id = auth.uid()) OR (orders.user_id IS NULL))
    )
  );

-- Users can view their own order items
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- COUPONS POLICIES
-- ============================================================================

-- Active coupons are publicly readable for validation
CREATE POLICY "Active coupons are readable"
  ON public.coupons FOR SELECT
  TO anon, authenticated
  USING (active = TRUE AND (valid_until IS NULL OR valid_until > NOW()));

-- Admins have full access to coupons
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- REVIEWS POLICIES
-- ============================================================================

-- Approved reviews are publicly readable
CREATE POLICY "Approved reviews are readable"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (approved = TRUE);

-- Users can create reviews
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- WISHLISTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON public.wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist"
  ON public.wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- NEWSLETTER POLICIES
-- ============================================================================

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Admins can view/manage subscribers
CREATE POLICY "Admins can manage newsletter"
  ON public.newsletter_subscribers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- ADMIN ACTIVITY LOG POLICIES
-- ============================================================================

CREATE POLICY "Admins can insert activity logs"
  ON public.admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PART 7: CREATE ADMIN USER
-- After running this SQL, create your admin account:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Add User" and create your admin account with email/password
-- 3. Copy the user's UUID from the table
-- 4. Run this SQL (replace YOUR_USER_UUID with actual UUID):
-- 
-- UPDATE public.user_roles 
-- SET role = 'admin' 
-- WHERE user_id = 'YOUR_USER_UUID';
-- ============================================================================

-- ============================================================================
-- PART 8: SAMPLE PRODUCTS (Optional - for testing)
-- ============================================================================

-- INSERT INTO public.products (id, name, description, category, author, language, price, in_stock, stock_quantity, images, featured) VALUES
-- ('book-001', 'Sample Book 1', 'Description for sample book 1', 'books', 'Author Name', 'English', 29.99, true, 50, ARRAY['/placeholder.svg'], true),
-- ('book-002', 'Sample Book 2', 'Description for sample book 2', 'books', 'Author Name', 'English', 24.99, true, 30, ARRAY['/placeholder.svg'], true);

-- ============================================================================
-- PART 9: ENABLE REALTIME (Optional - for live order updates)
-- ============================================================================

-- Enable realtime for orders (admin dashboard will see live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ============================================================================
-- DONE! Your e-commerce backend is ready.
-- 
-- NEXT STEPS:
-- 1. Create your admin account in Authentication > Users
-- 2. Run the UPDATE query to set your account as admin (Part 7)
-- 3. Add your STRIPE_SECRET_KEY in the Supabase secrets
-- 4. Add products to your products table
-- 5. Test the checkout flow
-- ============================================================================
