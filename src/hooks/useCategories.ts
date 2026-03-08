import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAnon } from '@/integrations/supabase/client';
import { categories as staticCategories } from '@/data/products';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryInsert {
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CategoryUpdate {
  name?: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

const STATIC_TIMESTAMP = '2024-01-01T00:00:00.000Z';

// Convert static category to match database schema
const convertStaticCategory = (cat: { id: string; name: string }, index: number): Category => ({
  id: cat.id,
  name: cat.name,
  slug: cat.id,
  description: null,
  image_url: null,
  sort_order: index,
  is_active: true,
  created_at: STATIC_TIMESTAMP,
  updated_at: STATIC_TIMESTAMP,
});

export const useCategories = (activeOnly = false) => {
  return useQuery({
    queryKey: ['categories', activeOnly],
    queryFn: async () => {
      let dbCategories: Category[] = [];
      try {
        let query = supabaseAnon
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (activeOnly) query = query.eq('is_active', true);
        const { data, error } = await query;
        if (!error && data) dbCategories = data as Category[];
      } catch {}

      const staticConverted = staticCategories.map(convertStaticCategory);
      const dbSlugs = new Set(dbCategories.map(c => c.slug));
      return [...dbCategories, ...staticConverted.filter(c => !dbSlugs.has(c.slug))];
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: CategoryInsert) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useCreateCategory] Error:', error);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CategoryUpdate }) => {
      const { data, error } = await supabase
        .from('categories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useUpdateCategory] Error:', error);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useDeleteCategory] Error:', error);
    },
  });
};
