import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAnon } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

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
  helpful_count: number;
  not_helpful_count: number;
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

export type ReviewSortOption = 'newest' | 'highest' | 'lowest' | 'helpful';

export interface ReviewStats {
  average: number;
  total: number;
  distribution: { stars: number; count: number; percent: number }[];
}

/**
 * Compute review statistics from a list of reviews
 */
export function computeReviewStats(reviews: Review[]): ReviewStats {
  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      distribution: [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, percent: 0 })),
    };
  }

  const total = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / total) * 10) / 10;

  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { counts[r.rating] = (counts[r.rating] || 0) + 1; });

  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: counts[stars],
    percent: Math.round((counts[stars] / total) * 100),
  }));

  return { average, total, distribution };
}

/**
 * Sort reviews by the given option
 */
export function sortReviews(reviews: Review[], sort: ReviewSortOption): Review[] {
  const sorted = [...reviews];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'highest':
      return sorted.sort((a, b) => b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'lowest':
      return sorted.sort((a, b) => a.rating - b.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'helpful':
      return sorted.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    default:
      return sorted;
  }
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
 * Hook to get computed review stats (derived from useProductReviews)
 */
export function useReviewStats(reviews: Review[]): ReviewStats {
  return useMemo(() => computeReviewStats(reviews), [reviews]);
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
        const { data: existing } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .maybeSingle();

        if (existing) {
          return { canReview: false, hasReviewed: true };
        }

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
          // Non-critical
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
      if (!user) throw new Error('You must be logged in to write a review');
      if (!isValidUUID(review.product_id)) throw new Error('Reviews are not available for this product yet');

      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', review.product_id)
        .maybeSingle();

      if (existing) throw new Error('You have already reviewed this product');

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          product_id: review.product_id,
          rating: review.rating,
          title: review.title,
          content: review.content,
          is_approved: true,
          is_verified_purchase: false,
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

/**
 * Hook to vote on a review (helpful / not helpful)
 */
export function useVoteReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reviewId, helpful }: { reviewId: string; helpful: boolean }) => {
      // Check localStorage to prevent duplicate votes
      const voteKey = `review-vote-${reviewId}`;
      const existingVote = localStorage.getItem(voteKey);
      if (existingVote) throw new Error('You have already voted on this review');

      const column = helpful ? 'helpful_count' : 'not_helpful_count';

      // Fetch current count
      const { data: current, error: fetchError } = await supabaseAnon
        .from('reviews')
        .select(`${column}, product_id`)
        .eq('id', reviewId)
        .single();

      if (fetchError || !current) throw new Error('Review not found');

      const newCount = ((current as any)[column] || 0) + 1;

      const { error } = await supabase
        .from('reviews')
        .update({ [column]: newCount } as any)
        .eq('id', reviewId);

      if (error) throw error;

      // Store vote in localStorage
      localStorage.setItem(voteKey, helpful ? 'helpful' : 'not_helpful');

      return { productId: (current as any).product_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', data.productId] });
    },
    onError: (error: Error) => {
      if (error.message === 'You have already voted on this review') {
        toast({ title: 'Already voted', description: 'You have already voted on this review.' });
      }
    },
  });
}
