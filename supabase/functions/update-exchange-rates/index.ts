import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Free-forever Currency API endpoints (no API key needed)
const API_URLS = [
  "https://open.er-api.com/v6/latest/USD",
  "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
  "https://api.frankfurter.dev/v1/latest?base=USD",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching exchange rates...");

    const rates: Record<string, number> = {};
    for (const url of API_URLS) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) continue;
        const data = await response.json();
        // open.er-api / frankfurter format: { rates: { INR: 90.5, ... } }
        if (data?.rates && !rates.INR) {
          for (const [k, v] of Object.entries(data.rates)) {
            if (typeof v === "number") rates[k.toUpperCase()] = v;
          }
        }
        // fawazahmed0 format: { usd: { inr: 90.5, ... } }
        if (data?.usd && !rates.INR) {
          for (const [k, v] of Object.entries(data.usd)) {
            if (typeof v === "number") rates[k.toUpperCase()] = v;
          }
        }
        if (rates.INR) break;
      } catch {
        continue;
      }
    }

    if (!rates.INR) {
      throw new Error("Failed to fetch exchange rates from all sources");
    }

    console.log("Received rates for", Object.keys(rates).length, "currencies. INR:", rates["INR"]);

    // Insert as a single JSONB row (matches frontend schema in CurrencyContext + useRefreshExchangeRates)
    const { error } = await supabase
      .from("exchange_rates")
      .insert({
        base_currency: "USD",
        rates,
        source: "currency-api (fawazahmed0)",
        fetched_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Clean up old rows to prevent unbounded table growth
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("exchange_rates").delete().lt("fetched_at", sevenDaysAgo);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Exchange rates updated successfully",
        count: Object.keys(rates).length,
        inr: rates["INR"],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error updating exchange rates:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to update exchange rates",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
