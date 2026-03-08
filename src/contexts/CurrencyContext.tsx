import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseAnon } from '@/integrations/supabase/client';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  userCountry: string;
  currencySymbol: string;
  isIndia: boolean;
  exchangeRate: number;
  exchangeRates: Record<string, number>;
  formatPrice: (priceUSD: number, priceINR?: number | null, saleUSD?: number | null, saleINR?: number | null) => {
    displayPrice: string;
    originalPrice: string | null;
    currencySymbol: string;
    numericPrice: number;
    numericOriginal: number | null;
  };
  formatAmount: (amount: number) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'user_currency_preference';

function getSavedCurrency(): string | null {
  try { return localStorage.getItem(CURRENCY_STORAGE_KEY); } catch { return null; }
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: 'INR', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', LT: 'EUR', LV: 'EUR', EE: 'EUR', SK: 'EUR', SI: 'EUR', CY: 'EUR', MT: 'EUR', LU: 'EUR',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
  PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
  MY: 'MYR', ID: 'IDR', SG: 'SGD', TH: 'THB', PH: 'PHP', VN: 'VND',
  TR: 'TRY', EG: 'EGP', NG: 'NGN', KE: 'KES', ZA: 'ZAR', GH: 'GHS', TZ: 'TZS',
  JP: 'JPY', KR: 'KRW', CN: 'CNY', HK: 'HKD', TW: 'TWD',
  BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP',
  NZ: 'NZD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
  RU: 'RUB', UA: 'UAH', IL: 'ILS', JO: 'JOD', LB: 'LBP', IQ: 'IQD', IR: 'IRR',
  MA: 'MAD', TN: 'TND', DZ: 'DZD', LY: 'LYD', SD: 'SDG', SO: 'SOS',
  MM: 'MMK', KH: 'KHR', LA: 'LAK', BN: 'BND',
  AF: 'AFN', UZ: 'UZS', KZ: 'KZT', AZ: 'AZN', GE: 'GEL',
};

export const POPULAR_CURRENCIES: { code: string; name: string }[] = [
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'EUR', name: 'Euro' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'QAR', name: 'Qatari Riyal' },
  { code: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'ZAR', name: 'South African Rand' },
];

function getCurrencySymbol(code: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find(p => p.type === 'currency')?.value || code;
  } catch {
    return code;
  }
}

function formatCurrencyAmount(amount: number, code: string): string {
  try {
    const isZeroDecimal = ['JPY', 'KRW', 'VND', 'CLP', 'IDR', 'IRR', 'IQD'].includes(code);
    const isWholeNumber = amount === Math.floor(amount);
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: isZeroDecimal || (isWholeNumber && ['INR', 'PKR', 'BDT', 'NPR', 'LKR'].includes(code)) ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

function countryToCurrency(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode] || 'USD';
}

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<string>(getSavedCurrency() || 'INR');
  const [userCountry, setUserCountry] = useState<string>('IN');
  const [detectedOnce, setDetectedOnce] = useState(!!getSavedCurrency());

  // Auto-detect country via IP on first visit (no saved currency preference)
  useEffect(() => {
    if (detectedOnce) return;
    const controller = new AbortController();
    const detect = async () => {
      try {
        const res = await fetch('https://api.country.is', { signal: controller.signal, cache: 'force-cache' });
        if (res.ok) {
          const data = await res.json();
          const code = data?.country || 'IN';
          setUserCountry(code);
          const detectedCurrency = countryToCurrency(code);
          setCurrencyState(detectedCurrency);
          localStorage.setItem(CURRENCY_STORAGE_KEY, detectedCurrency);
        }
      } catch { /* use default INR */ }
      setDetectedOnce(true);
    };
    const timer = setTimeout(detect, 100);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [detectedOnce]);

  const isIndia = currency === 'INR';
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  const setCurrency = useCallback((newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  }, []);

  // Fetch exchange rates: try DB first, fallback to free API, cache in localStorage
  const { data: ratesResult, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async (): Promise<Record<string, number>> => {
      // 1. Check localStorage cache (valid for 1 hour)
      try {
        const cached = localStorage.getItem('exchange_rates_cache');
        if (cached) {
          const { rates, ts } = JSON.parse(cached);
          if (Date.now() - ts < 1 * 60 * 60 * 1000 && rates?.INR) return rates;
        }
      } catch { /* ignore */ }

      // 2. Try Supabase DB
      try {
        const { data } = await supabaseAnon
          .from('exchange_rates')
          .select('rates, fetched_at')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.rates) {
          const rates = data.rates as Record<string, number>;
          const age = Date.now() - new Date(data.fetched_at || 0).getTime();
          if (rates.INR && age < 24 * 60 * 60 * 1000) {
            localStorage.setItem('exchange_rates_cache', JSON.stringify({ rates, ts: Date.now() }));
            return rates;
          }
        }
      } catch { /* continue to API fallback */ }

      // 3. Fallback: fetch live rates from multiple free APIs
      const urls = [
        'https://open.er-api.com/v6/latest/USD',
        'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
        'https://api.frankfurter.dev/v1/latest?base=USD',
      ];
      for (const url of urls) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
          if (res.ok) {
            const json = await res.json();
            const rates: Record<string, number> = {};
            // open.er-api / frankfurter format: { rates: { INR: 90.5, ... } }
            if (json?.rates) {
              for (const [k, v] of Object.entries(json.rates)) {
                if (typeof v === 'number') rates[k.toUpperCase()] = v;
              }
            }
            // fawazahmed0 format: { usd: { inr: 90.5, ... } }
            if (json?.usd && !rates.INR) {
              for (const [k, v] of Object.entries(json.usd)) {
                if (typeof v === 'number') rates[k.toUpperCase()] = v;
              }
            }
            if (rates.INR) {
              localStorage.setItem('exchange_rates_cache', JSON.stringify({ rates, ts: Date.now() }));
              return rates;
            }
          }
        } catch { continue; }
      }

      // 4. Last resort: return whatever we have cached even if stale
      try {
        const cached = localStorage.getItem('exchange_rates_cache');
        if (cached) return JSON.parse(cached).rates;
      } catch { /* ignore */ }

      return { INR: 90, EUR: 0.92, GBP: 0.79, AED: 3.67, SAR: 3.75, PKR: 278, BDT: 121, MYR: 4.47, IDR: 15800, CAD: 1.36, AUD: 1.55, SGD: 1.34, QAR: 3.64, KWD: 0.31, TRY: 36.2, EGP: 50.5, ZAR: 18.1 };
    },
    staleTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 60 * 30,
  });

  const exchangeRates: Record<string, number> = ratesResult || { INR: 90, EUR: 0.92, GBP: 0.79 };
  const exchangeRate = exchangeRates['INR'] || 90;

  const rateForCurrency = useCallback((code: string): number => {
    if (code === 'USD') return 1;
    return exchangeRates[code] || 1;
  }, [exchangeRates]);

  const formatPrice = useCallback((
    priceUSD: number,
    priceINR?: number | null,
    saleUSD?: number | null,
    saleINR?: number | null
  ) => {
    const rate = rateForCurrency(currency);
    const sym = getCurrencySymbol(currency);

    if (currency === 'INR') {
      const inrPrice = priceINR ?? Math.round(priceUSD * exchangeRate);
      const inrSale = saleINR ?? (saleUSD ? Math.round(saleUSD * exchangeRate) : null);
      const displayAmount = inrSale ?? inrPrice;
      const originalAmount = inrSale ? inrPrice : null;
      return {
        displayPrice: formatCurrencyAmount(displayAmount, 'INR'),
        originalPrice: originalAmount ? formatCurrencyAmount(originalAmount, 'INR') : null,
        currencySymbol: sym,
        numericPrice: displayAmount,
        numericOriginal: originalAmount,
      };
    }

    const convertedPrice = priceUSD * rate;
    const convertedSale = saleUSD ? saleUSD * rate : null;
    const displayAmount = convertedSale ?? convertedPrice;
    const originalAmount = convertedSale ? convertedPrice : null;
    return {
      displayPrice: formatCurrencyAmount(displayAmount, currency),
      originalPrice: originalAmount ? formatCurrencyAmount(originalAmount, currency) : null,
      currencySymbol: sym,
      numericPrice: displayAmount,
      numericOriginal: originalAmount,
    };
  }, [currency, exchangeRate, rateForCurrency]);

  const formatAmount = useCallback((amount: number) => {
    return formatCurrencyAmount(amount, currency);
  }, [currency]);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    userCountry,
    currencySymbol,
    isIndia,
    exchangeRate,
    exchangeRates,
    formatPrice,
    formatAmount,
    loading: ratesLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrencyContext = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
};

// Re-export as useCurrency for backwards compatibility
export const useCurrency = useCurrencyContext;
