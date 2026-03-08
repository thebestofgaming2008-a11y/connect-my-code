import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  country_codes: string[];
  base_rate_inr: number;
  base_rate_usd: number;
  per_kg_rate_inr: number;
  per_kg_rate_usd: number;
  free_shipping_threshold_inr?: number;
  free_shipping_threshold_usd?: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

// Static shipping zones fallback
const staticShippingZones: ShippingZone[] = [
  {
    id: 'india',
    name: 'India',
    countries: ['India'],
    country_codes: ['IN'],
    base_rate_inr: 50,
    base_rate_usd: 0.60,
    per_kg_rate_inr: 30,
    per_kg_rate_usd: 0.36,
    free_shipping_threshold_inr: 0,
    free_shipping_threshold_usd: 0,
    estimated_days_min: 3,
    estimated_days_max: 7,
  },
  {
    id: 'usa',
    name: 'United States',
    countries: ['United States'],
    country_codes: ['US'],
    base_rate_inr: 800,
    base_rate_usd: 9.99,
    per_kg_rate_inr: 400,
    per_kg_rate_usd: 4.99,
    free_shipping_threshold_inr: 0,
    free_shipping_threshold_usd: 0,
    estimated_days_min: 7,
    estimated_days_max: 14,
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    countries: ['United Kingdom'],
    country_codes: ['GB'],
    base_rate_inr: 700,
    base_rate_usd: 8.99,
    per_kg_rate_inr: 350,
    per_kg_rate_usd: 4.49,
    free_shipping_threshold_inr: 0,
    free_shipping_threshold_usd: 0,
    estimated_days_min: 7,
    estimated_days_max: 14,
  },
  {
    id: 'uae',
    name: 'UAE',
    countries: ['United Arab Emirates'],
    country_codes: ['AE'],
    base_rate_inr: 500,
    base_rate_usd: 5.99,
    per_kg_rate_inr: 250,
    per_kg_rate_usd: 2.99,
    free_shipping_threshold_inr: 0,
    free_shipping_threshold_usd: 0,
    estimated_days_min: 5,
    estimated_days_max: 10,
  },
  {
    id: 'rest-of-world',
    name: 'Rest of World',
    countries: ['*'],
    country_codes: ['*'],
    base_rate_inr: 1000,
    base_rate_usd: 12.99,
    per_kg_rate_inr: 500,
    per_kg_rate_usd: 5.99,
    free_shipping_threshold_inr: 0,
    free_shipping_threshold_usd: 0,
    estimated_days_min: 10,
    estimated_days_max: 21,
  },
];

/**
 * Hook to fetch all active shipping zones
 */
export function useShippingZones() {
  return useQuery({
    queryKey: ['shipping-zones'],
    queryFn: async () => {
      // ALWAYS use static shipping zones - DB may be empty
      if (import.meta.env.DEV) console.log('[useShippingZones] Using static shipping zones');
      return staticShippingZones;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Calculate shipping cost for a country
 */
export function calculateShippingForCountry(
  countryCode: string,
  currency: 'USD' | 'INR',
  weightGrams: number = 0,
  subtotal: number = 0,
  zones: ShippingZone[]
): { cost: number; zone: ShippingZone | null; freeShipping: boolean } {
  // Find matching zone
  const zone = zones.find(z => 
    z.country_codes?.includes(countryCode) || 
    z.countries?.some(c => c.toLowerCase() === countryCode.toLowerCase())
  ) || zones.find(z => z.country_codes?.includes('*') || z.countries?.includes('*'));

  if (!zone) {
    // Default fallback
    return {
      cost: currency === 'INR' ? 150 : 5.99,
      zone: null,
      freeShipping: false,
    };
  }

  // Check free shipping threshold
  const threshold = currency === 'INR' 
    ? (zone.free_shipping_threshold_inr || 0)
    : (zone.free_shipping_threshold_usd || 0);
  
  if (subtotal >= threshold && threshold > 0) {
    return {
      cost: 0,
      zone,
      freeShipping: true,
    };
  }

  // Calculate cost
  const baseRate = currency === 'INR' ? zone.base_rate_inr : zone.base_rate_usd;
  const perKgRate = currency === 'INR' ? zone.per_kg_rate_inr : zone.per_kg_rate_usd;
  const weightKg = weightGrams / 1000;
  const cost = baseRate + (weightKg * perKgRate);

  return {
    cost: Math.max(0, cost),
    zone,
    freeShipping: false,
  };
}

