import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAnon } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title?: string;
  content?: string;
  is_approved: boolean;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

export interface ReviewInput {
  product_id: string;
  rating: number;
  title?: string;
  content?: string;
}

/**
 * Hook to fetch reviews for a product
 */
export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async (): Promise<Review[]> => {
      if (!isValidUUID(productId)) return [];

      try {
        const { data, error } = await supabaseAnon
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (error) {
          if (import.meta.env.DEV) console.error('Error fetching reviews:', error);
          return [];
        }

        return (data || []) as unknown as Review[];
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching reviews:', error);
        return [];
      }
    },
    enabled: !!productId,
  });
}

/**
 * Hook to check if user can review a product
 */
export function useCanReviewProduct(productId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['can-review', productId, user?.id],
    queryFn: async () => {
      if (!user) return { canReview: false, hasReviewed: false };
      if (!isValidUUID(productId)) return { canReview: false, hasReviewed: false, hasPurchased: false };

      try {
        // Check if user already reviewed
        const { data: existing } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .maybeSingle();

        if (existing) {
          return { canReview: false, hasReviewed: true };
        }

        // Check if user has purchased (for verified purchase badge)
        let hasPurchased = false;
        try {
          const { data: userOrders } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'delivered' as any);

          if (userOrders && userOrders.length > 0) {
            const orderIds = userOrders.map(o => o.id);
            const { data: items } = await supabase
              .from('order_items')
              .select('order_id')
              .eq('product_id', productId)
              .in('order_id', orderIds);
            hasPurchased = (items?.length || 0) > 0;
          }
        } catch {
          // Non-critical - just skip purchase check
        }

        return { canReview: true, hasReviewed: false, hasPurchased };
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error checking review eligibility:', error);
        return { canReview: true, hasReviewed: false, hasPurchased: false };
      }
    },
    enabled: !!user && !!productId,
  });
}

/**
 * Hook to create a review
 */
export function useCreateReview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (review: ReviewInput) => {
      if (!user) {
        throw new Error('You must be logged in to write a review');
      }

      if (!isValidUUID(review.product_id)) {
        throw new Error('Reviews are not available for this product yet');
      }

      // Check if already reviewed
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', review.product_id)
        .maybeSingle();

      if (existing) {
        throw new Error('You have already reviewed this product');
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          product_id: review.product_id,
          rating: review.rating,
          title: review.title,
          content: review.content,
          is_approved: true,
          is_verified_purchase: false, // Can be updated later based on purchase history
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', data.product_id] });
      toast({
        title: 'Review submitted',
        description: 'Your review has been published. Thank you for your feedback!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

