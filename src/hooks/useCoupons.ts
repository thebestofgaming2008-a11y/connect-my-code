import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_usd' | 'fixed_inr';
  discount_value: number;
  max_discount_inr?: number;
  max_discount_usd?: number;
  minimum_order_inr: number;
  minimum_order_usd: number;
  valid_from: string;
  valid_until?: string;
  is_active: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount?: number;
  error?: string;
}

/**
 * Hook to validate a coupon code
 */
export function useValidateCoupon() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ code, subtotal, currency, exchangeRates = {} }: {
      code: string;
      subtotal: number;
      currency: string;
      exchangeRates?: Record<string, number>;
    }): Promise<CouponValidationResult> => {
      if (!code || code.trim() === '') {
        return { valid: false, error: 'Please enter a coupon code' };
      }

      // Fetch coupon from database
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !coupon) {
        return { valid: false, error: 'Invalid or expired coupon code' };
      }

      // Check if coupon is within validity period
      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      if (now < validFrom) {
        return { valid: false, error: 'This coupon is not yet valid' };
      }

      if (coupon.valid_until) {
        const validUntil = new Date(coupon.valid_until);
        if (now > validUntil) {
          return { valid: false, error: 'This coupon has expired' };
        }
      }

      // Check minimum order amount — convert subtotal to USD for comparison if needed
      let subtotalUSD: number;
      if (currency === 'USD') {
        subtotalUSD = subtotal;
      } else if (currency === 'INR') {
        subtotalUSD = subtotal / (exchangeRates['INR'] || 90);
      } else {
        subtotalUSD = subtotal / (exchangeRates[currency] || 1);
      }
      const minOrderUSD = coupon.minimum_order_usd || 0;
      if (subtotalUSD < minOrderUSD) {
        // Format the minimum in the user's currency for a clear error message
        const rate = currency === 'USD' ? 1 : (currency === 'INR' ? (exchangeRates['INR'] || 90) : (exchangeRates[currency] || 1));
        const minLocal = Math.ceil(minOrderUSD * rate);
        try {
          const formatted = new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(minLocal);
          return { valid: false, error: `Minimum order amount of ${formatted} required for this coupon` };
        } catch {
          return { valid: false, error: `Minimum order amount of ${minLocal} ${currency} required for this coupon` };
        }
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (subtotal * coupon.discount_value) / 100;
        // Cap discount: convert max_discount_inr to user's currency
        if (coupon.max_discount_inr) {
          const inrRate = exchangeRates['INR'] || 90;
          const rate = currency === 'INR' ? 1 : currency === 'USD' ? (1 / inrRate) : ((exchangeRates[currency] || 1) / inrRate);
          const maxInLocal = coupon.max_discount_inr * rate;
          if (discount > maxInLocal) discount = maxInLocal;
        }
      } else {
        discount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }

      return {
        valid: true,
        coupon,
        discount: Math.round(discount * 100) / 100,
      };
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to validate coupon. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

