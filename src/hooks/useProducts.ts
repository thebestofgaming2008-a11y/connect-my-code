import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAnon } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { products as staticProducts } from '@/data/products';

export type Product = Tables<'products'>;
export type ProductInsert = TablesInsert<'products'>;
export type ProductUpdate = TablesUpdate<'products'>;

interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  author?: string;
  language?: string;
  inStock?: boolean;
  featured?: boolean;
  onSale?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'bestselling' | 'rating' | 'name';
}

// Fixed timestamp for static product conversion — avoids React Query cache churn from new Date() on every call
const STATIC_TIMESTAMP = '2024-01-01T00:00:00.000Z';

// Convert static product to match database schema
const convertStaticProduct = (product: any): Product => ({
  id: product.id,
  name: product.name,
  slug: product.id,
  short_description: null,
  description: product.description || null,
  author: product.author || null,
  publisher: product.publisher || null,
  language: product.language || null,
  pages: product.pages || null,
  isbn: null,
  isbn_13: null,
  binding: product.binding || null,
  edition: null,
  publication_date: null,
  price: product.price,
  price_inr: product.priceInr || Math.round(product.price * 83.5),
  sale_price: product.salePrice || null,
  sale_price_inr: product.salePriceInr || null,
  cost_price: null,
  cost_price_inr: null,
  sku: null,
  barcode: null,
  stock_quantity: product.inStock ? 100 : 0,
  low_stock_threshold: null,
  weight_grams: null,
  dimensions_cm: null,
  category: product.category || null,
  category_id: null,
  tags: product.tags || null,
  cover_image_url: product.images?.[0] || null,
  images: product.images || [],
  preview_pdf_url: null,
  video_url: null,
  badge: null,
  ribbon_text: null,
  rating: 0,
  reviews_count: 0,
  in_stock: product.inStock ?? true,
  is_active: true,
  is_featured: false,
  is_new_arrival: false,
  is_bestseller: false,
  is_on_sale: !!product.salePrice,
  is_digital: false,
  is_preorder: false,
  preorder_date: null,
  meta_title: null,
  meta_description: null,
  meta_keywords: null,
  views_count: null,
  sales_count: product.reviews || 0,
  wishlist_count: null,
  created_at: STATIC_TIMESTAMP,
  updated_at: STATIC_TIMESTAMP,
  published_at: null,
});

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let dbProducts: Product[] = [];
      try {
        const { data, error } = await supabaseAnon
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (!error && data) dbProducts = data as Product[];
      } catch {}

      const staticConverted = staticProducts.map(convertStaticProduct);
      const staticBySlug = new Map(staticProducts.map(p => [p.id, p]));
      // Merge: zero out fake ratings on DB products + overlay static tags for variant linking
      const cleanedDb = dbProducts.map(p => {
        const staticMatch = p.slug ? staticBySlug.get(p.slug) : undefined;
        return {
          ...p,
          rating: 0,
          reviews_count: 0,
          ...(staticMatch?.tags && !p.tags?.length ? { tags: staticMatch.tags } : {}),
        };
      });
      const dbSlugs = new Set(cleanedDb.map(p => p.slug).filter(Boolean));
      const merged = [...cleanedDb, ...staticConverted.filter(p => !dbSlugs.has(p.slug))];
      return getFilteredProducts(merged, filters);
    },
    retry: 1,
  });
};

const getFilteredProducts = (all: Product[], filters?: ProductFilters): Product[] => {
  let result = [...all];
  
  if (filters?.category && filters.category !== 'all') {
    result = result.filter(p => p.category === filters.category);
  }
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      (p.author?.toLowerCase().includes(searchLower)) ||
      (p.description?.toLowerCase().includes(searchLower)) ||
      (p.publisher?.toLowerCase().includes(searchLower)) ||
      (p.category?.toLowerCase().includes(searchLower)) ||
      ((p.tags as string[] | null)?.some(t => t.toLowerCase().includes(searchLower)))
    );
  }
  
  if (filters?.inStock) {
    result = result.filter(p => (p.stock_quantity ?? 0) > 0);
  }
  
  if (filters?.featured) {
    result = result.filter(p => p.is_featured);
  }
  
  // Sort
  switch (filters?.sort) {
    case 'price_asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  
  return result;
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const staticProduct = staticProducts.find(p => p.id === id);
      if (staticProduct) return convertStaticProduct(staticProduct);

      const { data } = await supabaseAnon
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        // Merge static tags + zero out fake ratings
        const staticMatch = data.slug ? staticProducts.find(p => p.id === data.slug) : undefined;
        return {
          ...data,
          rating: 0,
          reviews_count: 0,
          ...(staticMatch?.tags && !data.tags?.length ? { tags: staticMatch.tags } : {}),
        } as Product;
      }
      throw new Error('Product not found');
    },
    enabled: !!id,
  });
};

export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['product-slug', slug],
    queryFn: async () => {
      const staticProduct = staticProducts.find(p => p.id === slug);
      if (staticProduct) return convertStaticProduct(staticProduct);

      const { data } = await supabaseAnon
        .from('products')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      if (data) return data as Product;
      throw new Error('Product not found');
    },
    enabled: !!slug,
  });
};

export const useRelatedProducts = (productId: string, category: string | null) => {
  return useQuery({
    queryKey: ['related-products', productId, category],
    queryFn: async () => {
      let dbRelated: Product[] = [];
      try {
        let query = supabaseAnon
          .from('products')
          .select('*')
          .eq('is_active', true)
          .neq('id', productId)
          .limit(4);
        if (category) query = query.eq('category', category);
        const { data } = await query;
        if (data) dbRelated = data as Product[];
      } catch {}

      const staticRelated = staticProducts
        .filter(p => p.id !== productId)
        .map(convertStaticProduct)
        .filter(p => !category || p.category === category);

      const dbIds = new Set(dbRelated.map(p => p.id));
      return [...dbRelated, ...staticRelated.filter(p => !dbIds.has(p.id))].slice(0, 4);
    },
    enabled: !!productId,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      let dbFeatured: Product[] = [];
      try {
        const { data } = await supabaseAnon
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_featured', true)
          .limit(8);
        if (data) dbFeatured = data as Product[];
      } catch {}

      const staticFeatured = staticProducts
        .filter(p => p.badge === 'Essential' || p.badge === 'Bestseller' || p.badge === 'Popular')
        .map(convertStaticProduct);

      const dbIds = new Set(dbFeatured.map(p => p.id));
      return [...dbFeatured, ...staticFeatured.filter(p => !dbIds.has(p.id))].slice(0, 8);
    },
  });
};

export const useNewArrivals = () => {
  return useQuery({
    queryKey: ['new-arrivals'],
    queryFn: async () => {
      let dbNew: Product[] = [];
      try {
        const { data } = await supabaseAnon
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_new_arrival', true)
          .limit(8);
        if (data) dbNew = data as Product[];
      } catch {}

      const staticNew = staticProducts
        .filter(p => p.badge === 'New')
        .map(convertStaticProduct);

      const dbIds = new Set(dbNew.map(p => p.id));
      return [...dbNew, ...staticNew.filter(p => !dbIds.has(p.id))].slice(0, 8);
    },
  });
};

export const useVariantProducts = (productId: string, tags: string[] | null) => {
  const variantGroup = tags?.find(t => t.startsWith('vg:'));
  return useQuery({
    queryKey: ['variant-products', variantGroup, productId],
    queryFn: async () => {
      if (!variantGroup) return [];
      let dbProducts: Product[] = [];
      try {
        const { data } = await supabaseAnon
          .from('products')
          .select('*')
          .eq('is_active', true)
          .contains('tags', [variantGroup]);
        if (data) dbProducts = data as Product[];
      } catch {}

      const staticVariants = staticProducts
        .filter(p => p.tags?.includes(variantGroup))
        .map(convertStaticProduct);

      const dbIds = new Set(dbProducts.map(p => p.id));
      const dbSlugs = new Set(dbProducts.map(p => p.slug));
      const merged = [
        ...dbProducts,
        ...staticVariants.filter(p => !dbIds.has(p.id) && !dbSlugs.has(p.slug)),
      ];
      return merged.filter(p => p.id !== productId && p.slug !== productId);
    },
    enabled: !!variantGroup,
  });
};

export const useAdminProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['admin-products', filters],
    queryFn: async () => {
      let dbProducts: Product[] = [];
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) dbProducts = data as Product[];
      } catch {}

      // Merge static products so admin can see ALL products
      const staticConverted = staticProducts.map(convertStaticProduct);
      const dbSlugs = new Set(dbProducts.map(p => p.slug).filter(Boolean));
      const merged = [...dbProducts, ...staticConverted.filter(p => !dbSlugs.has(p.slug))];

      let result = merged;
      if (filters?.category && filters.category !== 'all') {
        result = result.filter(p => p.category === filters.category);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.author?.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      }
      return result;
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useCreateProduct] Error:', error);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProductUpdate }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Product not found or you do not have permission to update it.');
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useUpdateProduct] Error:', error);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useDeleteProduct] Error:', error);
    },
  });
};

export const useImportStaticProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const results = { imported: 0, skipped: 0, errors: 0 };

      // Get existing slugs to avoid duplicates
      const { data: existing } = await supabase
        .from('products')
        .select('slug');
      const existingSlugs = new Set((existing || []).map(p => p.slug));

      const toInsert: ProductInsert[] = [];
      for (const p of staticProducts) {
        if (existingSlugs.has(p.id)) {
          results.skipped++;
          continue;
        }
        toInsert.push({
          name: p.name,
          slug: p.id,
          description: p.description,
          author: p.author || null,
          language: p.language || null,
          pages: p.pages || null,
          binding: p.binding || null,
          publisher: p.publisher || null,
          price: p.price,
          price_inr: p.priceInr || Math.round(p.price * 83.5),
          sale_price: p.salePrice || null,
          sale_price_inr: p.salePriceInr || null,
          category: p.category || null,
          cover_image_url: p.images?.[0] || null,
          images: p.images || [],
          stock_quantity: p.inStock ? 100 : 0,
          is_active: true,
          is_featured: p.badge === 'Essential' || p.badge === 'Bestseller' || p.badge === 'Popular',
          is_new_arrival: p.badge === 'New',
          is_bestseller: p.badge === 'Bestseller',
          is_on_sale: !!p.salePrice,
          badge: p.badge || null,
          rating: p.rating || 0,
          reviews_count: p.reviews || 0,
        });
      }

      if (toInsert.length > 0) {
        // Insert in batches of 20
        for (let i = 0; i < toInsert.length; i += 20) {
          const batch = toInsert.slice(i, i + 20);
          const { error } = await supabase.from('products').insert(batch);
          if (error) {
            if (import.meta.env.DEV) console.error('[Import] Batch error:', error);
            results.errors += batch.length;
          } else {
            results.imported += batch.length;
          }
        }
      }

      // Also import static categories
      const { data: existingCats } = await supabase.from('categories').select('slug');
      const existingCatSlugs = new Set((existingCats || []).map(c => c.slug));

      const { categories: staticCats } = await import('@/data/products');
      const catsToInsert = staticCats
        .filter(c => c.id !== 'all' && !existingCatSlugs.has(c.id))
        .map((c, i) => ({
          name: c.name,
          slug: c.id,
          sort_order: i,
          is_active: true,
        }));

      if (catsToInsert.length > 0) {
        await supabase.from('categories').insert(catsToInsert);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['featured-products'] });
      queryClient.invalidateQueries({ queryKey: ['new-arrivals'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
};