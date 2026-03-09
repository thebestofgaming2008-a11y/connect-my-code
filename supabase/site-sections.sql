-- =============== SITE SECTIONS TABLE ===============
-- Run this in your Supabase SQL Editor to enable the homepage section builder

CREATE TABLE IF NOT EXISTS site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL DEFAULT 'home',
  section_key TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE site_sections ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON site_sections TO anon;
GRANT SELECT ON site_sections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON site_sections TO authenticated;

DROP POLICY IF EXISTS "Anyone can read visible sections" ON site_sections;
CREATE POLICY "Anyone can read visible sections" ON site_sections
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert sections" ON site_sections;
CREATE POLICY "Admin can insert sections" ON site_sections
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can update sections" ON site_sections;
CREATE POLICY "Admin can update sections" ON site_sections
  FOR UPDATE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can delete sections" ON site_sections;
CREATE POLICY "Admin can delete sections" ON site_sections
  FOR DELETE USING (is_admin(auth.uid()));

-- =============== SEED DEFAULT HOMEPAGE SECTIONS ===============
INSERT INTO site_sections (page, section_key, title, subtitle, content, sort_order, is_visible) VALUES
(
  'home', 'hero', 'Authentic Islamic Books', 'Every book sourced from verified publishers. Classical texts to contemporary works, delivered across India.',
  '{"cta_text":"Browse Collection","cta_link":"/shop"}'::jsonb,
  0, true
),
(
  'home', 'trust_indicators', NULL, NULL,
  '{"items":[{"icon":"BadgeCheck","text":"100% Authentic","color":"text-green-600"},{"icon":"Globe","text":"Free Shipping ₹2000+","color":"text-blue-600"},{"icon":"Sparkles","text":"500+ Happy Customers","color":"text-yellow-500"}]}'::jsonb,
  1, true
),
(
  'home', 'featured_products', 'Featured Collection', 'Handpicked selections from our catalog',
  '{"product_count":4}'::jsonb,
  2, true
),
(
  'home', 'categories_carousel', 'Browse by Genre', 'Explore our collection by category',
  '{}'::jsonb,
  3, true
),
(
  'home', 'why_choose_us', 'Why Choose Us', 'We''re committed to excellence in every aspect',
  '{"items":[{"icon":"Package","title":"India-wide Shipping","description":"We deliver across India with order tracking"},{"icon":"Fingerprint","title":"Authenticity Guaranteed","description":"Every book is sourced from verified publishers and distributors"},{"icon":"Gem","title":"Expert Curation","description":"Our team carefully selects each title for quality and relevance"},{"icon":"Headphones","title":"Customer Support","description":"Reach us anytime via WhatsApp or our contact page"}]}'::jsonb,
  4, true
),
(
  'home', 'reviews', 'What Our Customers Say', 'Real feedback from our customers',
  '{"instagram_link":"https://www.instagram.com/hurayrah_essentials/","items":[{"name":"Satisfied Customer","rating":5,"text":"I''m truly delighted to receive my books, honey and saffron along with free miswak. The packaging was so secure and well done. Everything arrived perfectly intact. JazakAllahu khayran!","date":"via Instagram DM"},{"name":"Satisfied Customer","rating":5,"text":"The saffron had a rich, aromatic fragrance, and the packaging was elegant and well-secured. Allahumma baarik. May Allah put barakah in your business.","date":"via Instagram DM"},{"name":"Satisfied Customer","rating":5,"text":"Alhamdulillah! I have received the honey. The taste is truly delightful. Compared to others, this one tastes sweeter, pure and without any adulteration. May Allah accept your efforts.","date":"via Instagram DM"},{"name":"Satisfied Customer","rating":5,"text":"Your book Mukhtasar al-''Uluww is truly amazing — the print, the quality, the content… everything is so pleasing to the eyes and a coolness to the heart especially since it speaks about our Rabb.","date":"via Instagram DM"}]}'::jsonb,
  5, true
)
ON CONFLICT DO NOTHING;
