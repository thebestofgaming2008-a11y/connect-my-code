import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface VerifyResponse {
  verified: boolean;
  order?: {
    id: string;
    order_number: string;
  };
  error?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const initiatePayment = async (
    items: CartItem[],
    shippingInfo: ShippingInfo,
    currency: string = 'INR',
    userId?: string,
    couponCode?: string,
    shippingCost?: number
  ): Promise<VerifyResponse> => {
    setLoading(true);
    setError(null);

    try {
      if (!items || items.length === 0) {
        throw new Error('Cart is empty');
      }

      if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.phone || 
          !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || 
          !shippingInfo.postal_code || !shippingInfo.country) {
        throw new Error('Please fill in all shipping details');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(shippingInfo.email)) {
        throw new Error('Please enter a valid email address');
      }

      const phoneRegex = /^[+]?[\d\s-]{7,}$/;
      if (!phoneRegex.test(shippingInfo.phone)) {
        throw new Error('Please enter a valid phone number');
      }

      // Call edge function directly with fetch for better error visibility
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (import.meta.env.DEV) console.log('[RAZORPAY] Calling create-razorpay-order...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response: Response;
      try {
        response = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          signal: controller.signal,
          body: JSON.stringify({
            items: items.map(i => ({ id: i.id, quantity: i.quantity, name: i.name, price: i.price, image: i.image })),
            shipping_info: shippingInfo,
            currency,
            user_id: userId,
            coupon_code: couponCode,
            shipping_cost: shippingCost,
          }),
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          throw new Error('Payment server timed out (30s). Please try again.');
        }
        if (import.meta.env.DEV) console.error('[RAZORPAY] Network error calling create-order:', fetchErr);
        throw new Error('Could not reach payment server. Check your internet connection.');
      }
      clearTimeout(timeoutId);

      const responseText = await response.text();
      if (import.meta.env.DEV) console.log('[RAZORPAY] create-order response:', response.status, responseText.substring(0, 500));

      if (!response.ok) {
        let errorMsg = `Payment server error (${response.status})`;
        try {
          const errJson = JSON.parse(responseText);
          errorMsg = errJson.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Invalid response from payment server');
      }

      if (!data || !data.order_id) {
        throw new Error(data?.error || 'Invalid response from payment server');
      }

      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.Razorpay) {
          reject(new Error('Payment system not loaded. Please refresh the page.'));
          return;
        }

        let razorpayInstance: any = null;
        let handlerCalled = false;
        let settled = false;

        // Safety timeout — if nothing resolves/rejects within 60s, reject to unblock UI
        const safetyTimer = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error('Payment verification timed out. Please check your orders or contact support.'));
          }
        }, 60000);

        const safeResolve = (value: VerifyResponse) => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          resolve(value);
        };
        const safeReject = (err: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimer);
          reject(err);
        };

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          order_id: data.order_id,
          name: 'Abu Hurayrah Essentials',
          description: 'Islamic Books & Essentials',
          image: undefined,
          prefill: {
            name: shippingInfo.name,
            email: shippingInfo.email,
            contact: shippingInfo.phone,
          },
          notes: {
            shipping_address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.postal_code}, ${shippingInfo.country}`,
          },
          method: {
            card: true,
            upi: true,
            netbanking: true,
            wallet: true,
            paylater: true,
          },
          handler: async (response: RazorpayResponse) => {
            handlerCalled = true;
            if (import.meta.env.DEV) console.log('[RAZORPAY] Payment handler called, verifying...');
            try {
              // Re-fetch session: the original token may have expired during payment
              const freshSession = await supabase.auth.getSession();
              const freshToken = freshSession.data.session?.access_token || token;

              if (import.meta.env.DEV) console.log('[RAZORPAY] Calling verify-razorpay-payment...');
              const verifyController = new AbortController();
              const verifyTimeoutId = setTimeout(() => verifyController.abort(), 30000);

              let verifyResp: Response;
              try {
                verifyResp = await fetch(`${SUPABASE_URL}/functions/v1/verify-razorpay-payment`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${freshToken}`,
                    'apikey': SUPABASE_ANON_KEY,
                  },
                  signal: verifyController.signal,
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                });
              } catch (vErr: any) {
                clearTimeout(verifyTimeoutId);
                if (vErr.name === 'AbortError') {
                  throw new Error('Payment verification timed out. Please check your orders or contact support.');
                }
                throw new Error('Could not reach verification server.');
              }
              clearTimeout(verifyTimeoutId);

              const verifyText = await verifyResp.text();
              if (import.meta.env.DEV) console.log('[RAZORPAY] verify response:', verifyResp.status, verifyText.substring(0, 500));

              let verifyData: any;
              try {
                verifyData = JSON.parse(verifyText);
              } catch {
                throw new Error('Invalid verification response');
              }

              if (!verifyResp.ok || !verifyData?.verified) {
                throw new Error(verifyData?.error || 'Payment could not be verified');
              }

              if (razorpayInstance) {
                try { razorpayInstance.close(); } catch (_) {}
              }

              toast({
                title: 'Payment Successful!',
                description: `Order ${verifyData.order?.order_number || ''} has been placed successfully.`,
              });

              safeResolve(verifyData);
            } catch (err: any) {
              if (import.meta.env.DEV) console.error('[RAZORPAY] Verification error:', err);
              toast({
                title: 'Verification Failed',
                description: err.message || 'Please contact support with your payment details.',
                variant: 'destructive',
              });
              safeReject(err);
            }
          },
          modal: {
            ondismiss: () => {
              if (handlerCalled) return;
              toast({
                title: 'Payment Cancelled',
                description: 'You cancelled the payment. Your cart items are still saved.',
              });
              safeReject(new Error('Payment cancelled by user'));
            },
            escape: true,
            backdropclose: false,
            animation: true,
            confirm_close: true,
          },
          theme: {
            color: '#1a365d',
            backdrop_color: 'rgba(0,0,0,0.6)',
          },
          retry: {
            enabled: true,
            max_count: 3,
          },
          timeout: 300,
          remember_customer: true,
        };

        razorpayInstance = new window.Razorpay(options);
        
        razorpayInstance.on('payment.failed', (response: any) => {
          if (import.meta.env.DEV) console.error('[RAZORPAY] Payment failed:', response.error);
          const errorMessage = response.error?.description || 'Payment failed. Please try again.';
          toast({
            title: 'Payment Failed',
            description: errorMessage,
            variant: 'destructive',
          });
          setError(errorMessage);
          safeReject(new Error(errorMessage));
        });

        razorpayInstance.open();
      });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('[RAZORPAY] Error:', err);
      const errorMessage = err.message || 'Could not initiate payment';
      setError(errorMessage);
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { initiatePayment, loading, error, clearError };
}

export default useRazorpay;
