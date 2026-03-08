-- =====================================================
-- ABU HURAYRAH ESSENTIALS - DATABASE SCHEMA UPDATE
-- Add dual pricing, categories, exchange rates
-- =====================================================

-- 1. ADD PRICING COLUMNS TO PRODUCTS
-- =====================================================
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS price_inr numeric,
  ADD COLUMN IF NOT EXISTS sale_price_inr numeric,
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight_grams integer,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- 2. CREATE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. CREATE EXCHANGE RATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'USD',
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- 4. ADD ORDER COLUMNS
-- =====================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS shipping_state text,
  ADD COLUMN IF NOT EXISTS shipping_postal_code text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Add product_image to order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_image text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 6. CREATE FUNCTION TO GENERATE ORDER NUMBER
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number = 'AHE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS generate_order_number_trigger ON public.orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- 7. ENABLE RLS ON NEW TABLES
-- =====================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- 8. CREATE RLS POLICIES FOR CATEGORIES
-- =====================================================
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. CREATE RLS POLICIES FOR EXCHANGE RATES
-- =====================================================
DROP POLICY IF EXISTS "Exchange rates are publicly readable" ON public.exchange_rates;
CREATE POLICY "Exchange rates are publicly readable"
  ON public.exchange_rates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service can manage exchange rates" ON public.exchange_rates;
CREATE POLICY "Service can manage exchange rates"
  ON public.exchange_rates FOR ALL
  USING (true);

-- 10. SEED INITIAL CATEGORIES
-- =====================================================
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Books', 'books', 'Islamic books and literature', 1),
  ('Tafsir', 'tafsir', 'Quran interpretation and commentary', 2),
  ('Hadith', 'hadith', 'Prophetic traditions and collections', 3),
  ('Aqeedah', 'aqeedah', 'Islamic creed and theology', 4),
  ('Fiqh', 'fiqh', 'Islamic jurisprudence', 5),
  ('Seerah', 'seerah', 'Biography of the Prophet', 6),
  ('Children', 'children', 'Books for children', 7),
  ('Women', 'women', 'Books for Muslim women', 8)
ON CONFLICT (slug) DO NOTHING;

-- 11. SEED INITIAL EXCHANGE RATES
-- =====================================================
INSERT INTO public.exchange_rates (base_currency, target_currency, rate) VALUES
  ('USD', 'INR', 83.50),
  ('USD', 'GBP', 0.79),
  ('USD', 'EUR', 0.92),
  ('USD', 'AED', 3.67),
  ('USD', 'PKR', 278.50),
  ('USD', 'SAR', 3.75)
ON CONFLICT (base_currency, target_currency) DO UPDATE SET rate = EXCLUDED.rate, updated_at = now();

-- 12. SEED SAMPLE PRODUCTS
-- =====================================================
INSERT INTO public.products (id, name, description, price, price_inr, category, images, in_stock, rating, reviews, badge, is_featured) VALUES
  ('prod-1', 'The Sealed Nectar', 'Award-winning biography of Prophet Muhammad (PBUH). A comprehensive and authentic account of the life of the Prophet.', 24.99, 2085, 'seerah', ARRAY['/images/books/the sealed nectar.jpg'], true, 4.9, 156, 'Bestseller', true),
  ('prod-2', 'Tafsir Ibn Kathir (10 Volume Set)', 'The most renowned and accepted Tafsir of the Quran by Imam Ibn Kathir. Complete 10-volume set with detailed commentary.', 149.99, 12524, 'tafsir', ARRAY['/images/books/Tafsir ibn kathir/photo_72_2025-11-30_15-32-54.jpg'], true, 5.0, 89, 'Popular', true),
  ('prod-3', 'Sahih Al-Bukhari (9 Volume Set)', 'The most authentic collection of Hadith compiled by Imam Bukhari. Complete Arabic-English edition.', 129.99, 10853, 'hadith', ARRAY['/images/books/Sahih Bukhari english/photo_41_2025-11-30_15-31-15.jpg'], true, 4.9, 203, NULL, true),
  ('prod-4', 'Riyad-us-Saliheen', 'Gardens of the Righteous - A collection of hadith covering various aspects of Islamic life and conduct.', 19.99, 1669, 'hadith', ARRAY['/images/books/Ryad-us-Saliheen english/photo_58_2025-11-30_15-31-15.jpg'], true, 4.8, 124, NULL, false),
  ('prod-5', 'Kitab At-Tawhid', 'The Book of Monotheism by Muhammad ibn Abd al-Wahhab. Essential reading on Islamic monotheism.', 14.99, 1252, 'aqeedah', ARRAY['/images/books/kitab at-tawheed/photo_22_2025-11-30_15-31-15.jpg'], true, 4.7, 87, 'Essential', true),
  ('prod-6', 'Stories of the Prophets', 'Tales of the Prophets by Ibn Kathir, perfect for all ages.', 16.99, 1419, 'children', ARRAY['/images/books/imam ibn kathir stories of the prophets in arabic/photo_50_2025-11-30_15-31-15.jpg'], true, 4.9, 178, 'New', false),
  ('prod-7', 'Sahih Muslim (7 Volume Set)', 'The second most authentic collection of Hadith after Sahih Bukhari.', 119.99, 10020, 'hadith', ARRAY['/images/books/Sahih muslim english/photo_37_2025-11-30_15-32-54.jpg'], true, 4.9, 145, NULL, true),
  ('prod-8', 'Tafsir As-Sadi', 'A comprehensive and accessible tafsir by Sheikh As-Sadi.', 89.99, 7515, 'tafsir', ARRAY['/images/books/tafsir Sa''di/tafsirSadi.jpg'], true, 4.8, 92, NULL, false),
  ('prod-9', 'Important Lessons for Muslim Women', 'Essential guidance for Muslim women based on Quran and Sunnah.', 12.99, 1085, 'women', ARRAY['/images/books/Important lessons for muslim women/Important lessons for muslim women.jpg'], true, 4.7, 156, NULL, false),
  ('prod-10', 'When the Moon Split', 'A detailed biography of Prophet Muhammad for young readers.', 18.99, 1586, 'seerah', ARRAY['/images/books/When the moon split/photo_20_2025-11-30_15-32-54.jpg'], true, 4.9, 234, 'Popular', true)
ON CONFLICT (id) DO UPDATE SET 
  price_inr = EXCLUDED.price_inr,
  is_featured = EXCLUDED.is_featured,
  images = EXCLUDED.images;