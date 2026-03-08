import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format } from 'date-fns';

// Dashboard Statistics
export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  todayRevenueCurrency: string;
  totalCustomers: number;
  lowStockCount: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const today = startOfDay(new Date()).toISOString();
        
        // Parallel fetch: today's orders+revenue, customer count, low stock count
        const [ordersResult, customersResult, lowStockResult] = await Promise.all([
          supabase
            .from('orders')
            .select('total, currency')
            .gte('created_at', today)
            .neq('status', 'cancelled'),
          supabase
            .from('profiles')
            .select('user_id', { count: 'exact', head: true }),
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .lt('stock_quantity', 10)
            .gt('stock_quantity', 0)
            .eq('is_active', true),
        ]);

        const todayRevenueData = ordersResult.data || [];
        const todayOrders = todayRevenueData.length;
        const todayRevenue = todayRevenueData.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const todayRevenueCurrency = todayRevenueData[0]?.currency || 'USD';

        return {
          todayOrders,
          todayRevenue,
          todayRevenueCurrency,
          totalCustomers: customersResult.count || 0,
          lowStockCount: lowStockResult.count || 0,
        };
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useAdmin] Error fetching dashboard stats:', error);
        return { todayOrders: 0, todayRevenue: 0, todayRevenueCurrency: 'USD', totalCustomers: 0, lowStockCount: 0 };
      }
    },
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
};

// Revenue Chart Data
export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export const useRevenueChart = (days: 7 | 30 = 7) => {
  return useQuery({
    queryKey: ['admin-revenue-chart', days],
    queryFn: async (): Promise<RevenueDataPoint[]> => {
      try {
        const startDate = subDays(new Date(), days).toISOString();
        
        const { data: orders } = await supabase
          .from('orders')
          .select('created_at, total')
          .gte('created_at', startDate)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: true });

        // Group by date
        const grouped: Record<string, { revenue: number; orders: number }> = {};
        
        // Initialize all dates
        for (let i = 0; i < days; i++) {
          const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
          grouped[date] = { revenue: 0, orders: 0 };
        }

        // Fill in actual data
        orders?.forEach(order => {
          const date = format(new Date(order.created_at), 'yyyy-MM-dd');
          if (grouped[date]) {
            grouped[date].revenue += Number(order.total) || 0;
            grouped[date].orders += 1;
          }
        });

        // Convert to array and sort
        return Object.entries(grouped)
          .map(([date, data]) => ({
            date: format(new Date(date), 'MMM d'),
            ...data,
          }))
          .reverse();
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useAdmin] Error fetching revenue chart:', error);
        return Array.from({ length: days }, (_, i) => ({
          date: format(subDays(new Date(), days - 1 - i), 'MMM d'),
          revenue: 0,
          orders: 0,
        }));
      }
    },
    retry: 1,
  });
};

// Low Stock Products
export interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  images: string[] | null;
}

export const useLowStockProducts = () => {
  return useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: async (): Promise<LowStockProduct[]> => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, stock_quantity, images, cover_image_url')
          .lt('stock_quantity', 10)
          .gt('stock_quantity', 0)
          .eq('is_active', true)
          .order('stock_quantity', { ascending: true })
          .limit(10);

        if (error) throw error;
        return (data || []) as LowStockProduct[];
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useAdmin] Error fetching low stock products:', error);
        return [];
      }
    },
    retry: 1,
  });
};

// Recent Orders
export interface RecentOrder {
  id: string;
  order_number: string | null;
  shipping_name: string | null;
  shipping_email: string | null;
  total: number;
  currency: string | null;
  status: string | null;
  created_at: string;
}

export const useRecentOrders = (limit = 10) => {
  return useQuery({
    queryKey: ['admin-recent-orders', limit],
    queryFn: async (): Promise<RecentOrder[]> => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, order_number, shipping_name, shipping_email, total, currency, status, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return (data || []) as RecentOrder[];
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useAdmin] Error fetching recent orders:', error);
        return [];
      }
    },
    retry: 1,
  });
};

// Support Messages
export interface SupportMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  replied_at: string | null;
}

export const useSupportMessages = () => {
  return useQuery({
    queryKey: ['admin-support-messages'],
    queryFn: async (): Promise<SupportMessage[]> => {
      try {
        const { data, error } = await supabase
          .from('support_messages')
          .select('id, name, email, phone, subject, message, status, admin_notes, created_at, replied_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as SupportMessage[];
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useAdmin] Error fetching support messages:', error);
        return [];
      }
    },
    retry: 1,
  });
};

export const useUpdateSupportMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('support_messages')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useUpdateSupportMessage] Error:', error);
    },
  });
};

export const useDeleteSupportMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('support_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useDeleteSupportMessage] Error:', error);
    },
  });
};

// Customers
export interface Customer {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  preferred_currency: string | null;
  created_at: string | null;
  orders_count?: number;
  total_spent?: number;
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async (): Promise<Customer[]> => {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, phone, avatar_url, preferred_currency, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!profiles || profiles.length === 0) return [];

        // Single bulk query for all order stats instead of N+1
        const { data: allOrders } = await supabase
          .from('orders')
          .select('user_id, total');

        // Group order stats by user_id
        const orderStats = new Map<string, { count: number; total: number }>();
        allOrders?.forEach(o => {
          const uid = o.user_id;
          if (!uid) return;
          const existing = orderStats.get(uid) || { count: 0, total: 0 };
          existing.count += 1;
          existing.total += Number(o.total) || 0;
          orderStats.set(uid, existing);
        });

        return profiles.map(profile => {
          const stats = orderStats.get(profile.user_id) || { count: 0, total: 0 };
          return {
            ...profile,
            id: profile.user_id,
            orders_count: stats.count,
            total_spent: stats.total,
          } as Customer;
        });
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useAdmin] Error fetching customers:', error);
        return [];
      }
    },
    retry: 1,
  });
};

// Exchange Rates (new schema with JSONB rates)
export interface ExchangeRateRecord {
  id: string;
  base_currency: string;
  rates: Record<string, number>;
  source: string | null;
  fetched_at: string | null;
  created_at: string | null;
}

export const useExchangeRates = () => {
  return useQuery({
    queryKey: ['exchange-rates-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('id, base_currency, rates, source, fetched_at, created_at')
        .order('fetched_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data as unknown as ExchangeRateRecord[];
    },
    retry: 1,
  });
};

export const useRefreshExchangeRates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Free-forever Currency APIs (no API key needed)
      const urls = [
        'https://open.er-api.com/v6/latest/USD',
        'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
        'https://api.frankfurter.dev/v1/latest?base=USD',
      ];

      const rates: Record<string, number> = {};
      for (const url of urls) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (!response.ok) continue;
          const data = await response.json();
          // open.er-api format: { rates: { INR: 90.5, ... } }
          if (data?.rates && !rates.INR) {
            for (const [k, v] of Object.entries(data.rates)) {
              if (typeof v === 'number') rates[k.toUpperCase()] = v;
            }
          }
          // fawazahmed0 format: { usd: { inr: 90.5, ... } }
          if (data?.usd && !rates.INR) {
            for (const [k, v] of Object.entries(data.usd)) {
              if (typeof v === 'number') rates[k.toUpperCase()] = v;
            }
          }
          if (rates.INR) break;
        } catch {
          continue;
        }
      }

      if (!rates.INR) throw new Error('Failed to fetch exchange rates from all sources');

      const { error } = await supabase
        .from('exchange_rates')
        .insert({
          base_currency: 'USD',
          rates: rates,
          source: 'currency-api (fawazahmed0)',
          fetched_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Clean up old rows to prevent unbounded table growth
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('exchange_rates').delete().lt('fetched_at', sevenDaysAgo);

      return { rates, fetched_at: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      queryClient.invalidateQueries({ queryKey: ['exchange-rates-admin'] });
      try { localStorage.removeItem('exchange_rates_cache'); } catch { /* ignore */ }
    },
  });
};

// Admin Orders with full details
export interface AdminOrder {
  id: string;
  order_number: string | null;
  user_id: string | null;
  status: string | null;
  subtotal: number;
  shipping_cost: number | null;
  discount: number | null;
  total: number;
  currency: string | null;
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  shipping_address_line_1: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  tracking_url: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  payment_method: string | null;
  payment_status: string | null;
  created_at: string;
  updated_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
}

export interface AdminOrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
}

export const useAdminOrders = (filters?: { status?: string; dateRange?: { from: Date; to: Date } }) => {
  return useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async (): Promise<AdminOrder[]> => {
      try {
        let query = supabase
          .from('orders')
          .select('id, order_number, user_id, status, subtotal, shipping_cost, discount, total, currency, shipping_name, shipping_email, shipping_phone, shipping_address_line_1, shipping_city, shipping_state, shipping_postal_code, shipping_country, tracking_number, tracking_carrier, tracking_url, customer_notes, admin_notes, payment_method, created_at, updated_at, paid_at, shipped_at, delivered_at, cancelled_at')
          .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status as any);
        }

        if (filters?.dateRange) {
          query = query
            .gte('created_at', filters.dateRange.from.toISOString())
            .lte('created_at', filters.dateRange.to.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as unknown as AdminOrder[];
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useAdmin] Error fetching admin orders:', error);
        return [];
      }
    },
    retry: 1,
    refetchInterval: 2 * 60 * 1000,
  });
};

export const useOrderDetails = (orderId: string) => {
  return useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      return { order: order as unknown as AdminOrder, items: items as unknown as AdminOrderItem[] };
    },
    enabled: !!orderId,
    retry: 1,
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminOrder> }) => {
      const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
      
      // Handle status-specific timestamps
      if (updates.status === 'shipped' && !updates.shipped_at) {
        updateData.shipped_at = new Date().toISOString();
      }
      if (updates.status === 'delivered' && !updates.delivered_at) {
        updateData.delivered_at = new Date().toISOString();
      }
      if (updates.status === 'cancelled' && !updates.cancelled_at) {
        updateData.cancelled_at = new Date().toISOString();
      }
      if (updates.status === 'confirmed') {
        if (!updateData.payment_status) updateData.payment_status = 'paid';
        if (!updateData.confirmed_at) updateData.confirmed_at = new Date().toISOString();
        if (!updateData.paid_at) updateData.paid_at = new Date().toISOString();
      }
      if (updates.status === 'paid' && !updates.paid_at) {
        updateData.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Order update blocked by permissions. Please check RLS policies in Supabase.');
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) console.error('[useUpdateOrder] Error:', error);
    },
  });
};

// =============== COUPONS ===============
export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_usd' | 'fixed_inr';
  discount_value: number;
  max_discount_inr: number | null;
  max_discount_usd: number | null;
  minimum_order_inr: number;
  minimum_order_usd: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export const useAdminCoupons = () => {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async (): Promise<AdminCoupon[]> => {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []) as unknown as AdminCoupon[];
      } catch (error) {
        if (import.meta.env.DEV) console.error('[useAdmin] Error fetching coupons:', error);
        return [];
      }
    },
    retry: 1,
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: Omit<AdminCoupon, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert(coupon)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminCoupon> }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });
};
