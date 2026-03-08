/**
 * Shared pricing and shipping calculation logic
 * Uses admin-configured shipping zones from localStorage
 */

export interface ShippingZoneConfig {
  id: string;
  name: string;
  base_rate_inr: number;
  free_shipping_threshold_inr: number;
  estimated_days_min: number;
  estimated_days_max: number;
}

const DEFAULT_ZONES: ShippingZoneConfig[] = [
  { id: 'india', name: 'India', base_rate_inr: 50, free_shipping_threshold_inr: 0, estimated_days_min: 3, estimated_days_max: 7 },
  { id: 'rest-of-world', name: 'Rest of World', base_rate_inr: 1000, free_shipping_threshold_inr: 0, estimated_days_min: 10, estimated_days_max: 21 },
];

export function getShippingZones(): ShippingZoneConfig[] {
  try {
    const saved = localStorage.getItem('admin_shipping_zones');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_ZONES;
}

export function getZoneForCountry(countryCode: string): ShippingZoneConfig {
  const zones = getShippingZones();
  if (countryCode === 'IN') return zones.find(z => z.id === 'india') || zones[0];
  return zones.find(z => z.id === 'rest-of-world') || zones[zones.length - 1];
}

/**
 * Calculate shipping cost based on subtotal and country.
 * Shipping rates are stored in INR. Converts to target currency using exchangeRates.
 */
export function calculateShipping(subtotal: number, currency: string = 'INR', countryCode: string = 'IN', exchangeRates: Record<string, number> = {}): number {
  const zone = getZoneForCountry(countryCode);
  const inrRate = exchangeRates['INR'] || 90;

  let thresholdInLocal: number;
  let baseRateInLocal: number;

  if (currency === 'INR') {
    thresholdInLocal = zone.free_shipping_threshold_inr;
    baseRateInLocal = zone.base_rate_inr;
  } else {
    const rate = currency === 'USD' ? 1 : (exchangeRates[currency] || 1);
    thresholdInLocal = (zone.free_shipping_threshold_inr / inrRate) * rate;
    baseRateInLocal = (zone.base_rate_inr / inrRate) * rate;
  }

  if (thresholdInLocal > 0 && subtotal >= thresholdInLocal) {
    return 0;
  }
  return baseRateInLocal;
}

/**
 * Format a currency amount for display using Intl.NumberFormat.
 * Works for any ISO currency code stored on orders (INR, USD, etc.).
 */
export function formatOrderCurrency(currency: string | null | undefined, amount: number | string): string {
  const code = currency || 'INR';
  const num = Number(amount);
  try {
    return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    const sym = code === 'INR' ? '₹' : '$';
    return `${sym}${num.toFixed(2)}`;
  }
}

/**
 * Get shipping info for display
 */
export function getShippingInfo(countryCode: string = 'IN') {
  const zone = getZoneForCountry(countryCode);
  return {
    baseRate: zone.base_rate_inr,
    freeThreshold: zone.free_shipping_threshold_inr,
    estimatedDays: `${zone.estimated_days_min}-${zone.estimated_days_max}`,
    zoneName: zone.name,
  };
}

