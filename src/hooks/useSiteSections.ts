import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAnon } from '@/integrations/supabase/client';

export interface SiteSection {
  id: string;
  page: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: Record<string, any>;
  sort_order: number;
  is_visible: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const DEFAULT_SECTIONS: SiteSection[] = [
  { id: 'default-hero', page: 'home', section_key: 'hero', title: 'Abu Hurayrah', subtitle: 'Authentic Islamic books from trusted publishers worldwide. From classical texts to contemporary works, find your next meaningful read.', content: { cta_text: 'Shop Collection', cta_link: '/shop' }, sort_order: 0, is_visible: true, created_at: null, updated_at: null },
  { id: 'default-trust', page: 'home', section_key: 'trust_indicators', title: null, subtitle: null, content: { items: [{ icon: 'BadgeCheck', text: '100% Authentic', color: 'text-green-600' }, { icon: 'Globe', text: 'Worldwide Shipping', color: 'text-blue-600' }, { icon: 'Sparkles', text: 'Trusted by Customers', color: 'text-yellow-500' }] }, sort_order: 1, is_visible: true, created_at: null, updated_at: null },
  { id: 'default-featured', page: 'home', section_key: 'featured_products', title: 'Featured Collection', subtitle: 'Handpicked selections from our catalog', content: { product_count: 4 }, sort_order: 2, is_visible: true, created_at: null, updated_at: null },
  { id: 'default-categories', page: 'home', section_key: 'categories_carousel', title: 'Browse by Genre', subtitle: 'Explore our collection by category', content: {}, sort_order: 3, is_visible: true, created_at: null, updated_at: null },
  { id: 'default-why', page: 'home', section_key: 'why_choose_us', title: 'Why Choose Us', subtitle: "We're committed to excellence in every aspect", content: { items: [{ icon: 'Package', title: 'India-wide Shipping', description: 'We deliver across India with order tracking' }, { icon: 'Fingerprint', title: 'Authenticity Guaranteed', description: 'Every book is sourced from verified publishers and distributors' }, { icon: 'Gem', title: 'Expert Curation', description: 'Our team carefully selects each title for quality and relevance' }, { icon: 'Headphones', title: 'Customer Support', description: 'Reach us anytime via WhatsApp or our contact page' }] }, sort_order: 4, is_visible: true, created_at: null, updated_at: null },
  { id: 'default-reviews', page: 'home', section_key: 'reviews', title: 'What Our Customers Say', subtitle: 'Real feedback from our customers', content: { instagram_link: 'https://www.instagram.com/hurayrah_essentials/', items: [
    { name: 'Satisfied Customer', rating: 5, text: 'I\'m truly delighted to receive my books, honey and saffron along with free miswak. The packaging was so secure and well done. Everything arrived perfectly intact. JazakAllahu khayran!', date: 'via Instagram DM' },
    { name: 'Satisfied Customer', rating: 5, text: 'The saffron had a rich, aromatic fragrance, and the packaging was elegant and well-secured. Allahumma baarik. May Allah put barakah in your business.', date: 'via Instagram DM' },
    { name: 'Satisfied Customer', rating: 5, text: 'Alhamdulillah! I have received the honey. The taste is truly delightful. Compared to others, this one tastes sweeter, pure and without any adulteration. May Allah accept your efforts.', date: 'via Instagram DM' },
    { name: 'Satisfied Customer', rating: 5, text: 'Your book Mukhtasar al-\'Uluww is truly amazing — the print, the quality, the content… everything is so pleasing to the eyes and a coolness to the heart especially since it speaks about our Rabb.', date: 'via Instagram DM' },
  ] }, sort_order: 5, is_visible: true, created_at: null, updated_at: null },
];

export { DEFAULT_SECTIONS };

export function useSiteSections(page = 'home') {
  return useQuery({
    queryKey: ['site-sections', page],
    queryFn: async (): Promise<SiteSection[]> => {
      try {
        const { data, error } = await (supabaseAnon as any)
          .from('site_sections')
          .select('*')
          .eq('page', page)
          .order('sort_order', { ascending: true });
        if (error || !data || data.length === 0) return DEFAULT_SECTIONS;
        return data as SiteSection[];
      } catch {
        return DEFAULT_SECTIONS;
      }
    },
    staleTime: 60000,
    placeholderData: DEFAULT_SECTIONS,
  });
}

export function useAdminSiteSections(page = 'home') {
  return useQuery({
    queryKey: ['admin-site-sections', page],
    queryFn: async (): Promise<SiteSection[]> => {
      try {
        const { data, error } = await (supabase as any)
          .from('site_sections')
          .select('*')
          .eq('page', page)
          .order('sort_order', { ascending: true });
        if (error || !data || data.length === 0) return DEFAULT_SECTIONS;
        return data as SiteSection[];
      } catch {
        return DEFAULT_SECTIONS;
      }
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SiteSection> }) => {
      const { error } = await (supabase as any)
        .from('site_sections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-sections'] });
      queryClient.invalidateQueries({ queryKey: ['admin-site-sections'] });
    },
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: Omit<SiteSection, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('site_sections')
        .insert(section)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-sections'] });
      queryClient.invalidateQueries({ queryKey: ['admin-site-sections'] });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('site_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-sections'] });
      queryClient.invalidateQueries({ queryKey: ['admin-site-sections'] });
    },
  });
}
