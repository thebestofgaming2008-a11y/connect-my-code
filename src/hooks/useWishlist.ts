import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { products as staticProducts } from '@/data/products';
import { supabaseAnon } from '@/integrations/supabase/client';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  notify_on_sale: boolean;
  notify_on_stock: boolean;
  product?: {
    id: string;
    name: string;
    price: number;
    price_inr: number;
    sale_price?: number;
    sale_price_inr?: number;
    cover_image_url?: string;
    images?: string[];
    in_stock: boolean;
  };
}

// --- localStorage-based wishlist ---
// Supabase wishlists table has FK to products table (which is empty).
// Static product IDs are string slugs, not UUIDs, so all DB operations fail.
// Using localStorage as the persistent store instead.

const WISHLIST_KEY = 'wishlist_items';

interface StoredWishlistEntry {
  product_id: string;
  created_at: string;
}

function getStoredWishlist(userId: string): StoredWishlistEntry[] {
  try {
    const raw = localStorage.getItem(`${WISHLIST_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredWishlist(userId: string, items: StoredWishlistEntry[]) {
  localStorage.setItem(`${WISHLIST_KEY}_${userId}`, JSON.stringify(items));
}

const getStaticProduct = (productId: string) => {
  const p = staticProducts.find(sp => sp.id === productId);
  if (!p) return undefined;
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    price_inr: p.priceInr || Math.round(p.price * 83.5),
    sale_price: (p as any).salePrice,
    sale_price_inr: (p as any).salePriceInr,
    cover_image_url: p.images?.[0],
    images: p.images,
    in_stock: p.inStock ?? true,
  };
};

/**
 * Hook to fetch user's wishlist items (localStorage-backed)
 */
export function useWishlistItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Sync across tabs: when another tab writes to localStorage, refetch here
  useEffect(() => {
    if (!user) return;
    const key = `${WISHLIST_KEY}_${user.id}`;
    const handler = (e: StorageEvent) => {
      if (e.key === key) {
        queryClient.invalidateQueries({ queryKey: ['wishlist', user.id] });
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async (): Promise<WishlistItem[]> => {
      if (!user) return [];
      const stored = getStoredWishlist(user.id);
      if (stored.length === 0) return [];

      // Resolve static products and collect DB IDs that need fetching
      const staticMap = new Map<string, NonNullable<ReturnType<typeof getStaticProduct>>>();
      const dbIds: string[] = [];

      for (const entry of stored) {
        const sp = getStaticProduct(entry.product_id);
        if (sp) {
          staticMap.set(entry.product_id, sp);
        } else {
          dbIds.push(entry.product_id);
        }
      }

      // Fetch DB products in one query
      const dbMap = new Map<string, WishlistItem['product']>();
      if (dbIds.length > 0) {
        const { data: dbProducts } = await supabaseAnon
          .from('products')
          .select('id, name, price, price_inr, sale_price, sale_price_inr, cover_image_url, images, stock_quantity')
          .in('id', dbIds);

        if (dbProducts) {
          for (const p of dbProducts) {
            dbMap.set(p.id, {
              id: p.id,
              name: p.name,
              price: p.price,
              price_inr: p.price_inr || Math.round(p.price * 83.5),
              sale_price: p.sale_price ?? undefined,
              sale_price_inr: p.sale_price_inr ?? undefined,
              cover_image_url: p.cover_image_url ?? undefined,
              images: p.images as string[] | undefined,
              in_stock: (p.stock_quantity ?? 1) > 0,
            });
          }
        }
      }

      return stored.map((entry, idx) => ({
        id: `wl-${idx}-${entry.product_id}`,
        user_id: user.id,
        product_id: entry.product_id,
        created_at: entry.created_at,
        notify_on_sale: false,
        notify_on_stock: false,
        product: staticMap.get(entry.product_id) || dbMap.get(entry.product_id),
      }));
    },
    enabled: !!user,
  });
}

/**
 * Hook to check if a product is in wishlist
 */
export function useIsInWishlist(productId: string) {
  const { user } = useAuth();
  const { data: wishlistItems } = useWishlistItems();

  return {
    isInWishlist: wishlistItems?.some(item => item.product_id === productId) ?? false,
    isLoading: !wishlistItems,
  };
}

/**
 * Hook to toggle wishlist item (add/remove)
 */
export function useToggleWishlistItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ productId }: {
      productId: string;
      notifyOnSale?: boolean;
      notifyOnStock?: boolean;
    }) => {
      if (!user) {
        throw new Error('You must be logged in to add items to wishlist');
      }

      const stored = getStoredWishlist(user.id);
      const existingIdx = stored.findIndex(e => e.product_id === productId);

      if (existingIdx >= 0) {
        stored.splice(existingIdx, 1);
        setStoredWishlist(user.id, stored);
        return { added: false };
      } else {
        stored.unshift({ product_id: productId, created_at: new Date().toISOString() });
        setStoredWishlist(user.id, stored);
        return { added: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      toast({
        title: result.added ? 'Added to wishlist' : 'Removed from wishlist',
        description: result.added
          ? 'This item has been added to your wishlist.'
          : 'This item has been removed from your wishlist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update wishlist. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to remove wishlist item by product_id
 */
export function useRemoveWishlistItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Not logged in');
      const stored = getStoredWishlist(user.id);
      const filtered = stored.filter(e => e.product_id !== productId);
      setStoredWishlist(user.id, filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove item from wishlist. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
