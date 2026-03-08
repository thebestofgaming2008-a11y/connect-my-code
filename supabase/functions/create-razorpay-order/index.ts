import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  id: string;
  quantity: number;
  name?: string;
  price?: number;
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

interface OrderRequest {
  items: CartItem[];
  shipping_info: ShippingInfo;
  currency: 'USD' | 'INR';
  user_id?: string;
  coupon_code?: string;
  shipping_cost?: number;
}

const isValidUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!razorpayKeyId || !razorpayKeySecret) throw new Error("Razorpay keys not configured");

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const { items, shipping_info, currency, user_id, coupon_code, shipping_cost: clientShippingCost }: OrderRequest = await req.json();

    if (!items?.length) throw new Error("No items in cart");

    if (!shipping_info?.name || !shipping_info?.email || !shipping_info?.phone) {
      throw new Error("Missing required shipping information");
    }

    // Fetch current INR exchange rate from DB (fallback 90)
    let inrRate = 90;
    const { data: rateRow } = await supabase
      .from('exchange_rates')
      .select('rates')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (rateRow?.rates?.INR) inrRate = Number(rateRow.rates.INR);

    // Fetch product prices from database for validation
    const productIds = items.map((item: any) => item.id);
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, price_inr, sale_price, sale_price_inr, stock_quantity, cover_image_url')
      .in('id', productIds);

    const isINR = currency === 'INR';
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = products?.find((p: any) => p.id === item.id);
      
      if (product) {
        let unitPrice = isINR 
          ? (product.sale_price_inr || product.price_inr || Math.round(product.price * inrRate))
          : (product.sale_price || product.price);

        subtotal += unitPrice * item.quantity;
        validatedItems.push({
          id: product.id,
          name: product.name,
          qty: item.quantity,
          price: unitPrice,
          image: product.cover_image_url
        });
      } else if (item.price && item.name) {
        subtotal += item.price * item.quantity;
        validatedItems.push({
          id: item.id,
          name: item.name,
          qty: item.quantity,
          price: item.price,
          image: item.image || null
        });
      }
    }

    if (validatedItems.length === 0) {
      throw new Error("No valid items found. Please try again.");
    }

    // Validate and apply coupon if provided
    let discount = 0;
    let couponId = null;
    
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase().trim())
        .eq('is_active', true)
        .single();
      
      if (coupon) {
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
        
        if (now >= validFrom && (!validUntil || now <= validUntil)) {
          const minOrder = isINR ? coupon.minimum_order_inr : coupon.minimum_order_usd;
          if (subtotal >= minOrder) {
            couponId = coupon.id;
            if (coupon.discount_type === 'percentage') {
              discount = (subtotal * coupon.discount_value) / 100;
              const maxDiscount = isINR ? coupon.max_discount_inr : coupon.max_discount_usd;
              if (maxDiscount && discount > maxDiscount) discount = maxDiscount;
            } else if (coupon.discount_type === 'fixed_inr' && isINR) {
              discount = coupon.discount_value;
            } else if (coupon.discount_type === 'fixed_usd' && !isINR) {
              discount = coupon.discount_value;
            }
            if (discount > subtotal) discount = subtotal;
          }
        }
      }
    }

    // Shipping calculation — accept client-provided cost (from admin-configured zones),
    // with server-side bounds check to prevent abuse. Max ₹2000 / $25.
    const maxShipping = isINR ? 2000 : 25;
    let shippingCost = 0;
    if (typeof clientShippingCost === 'number' && clientShippingCost >= 0 && clientShippingCost <= maxShipping) {
      shippingCost = clientShippingCost;
    } else {
      // Fallback flat rate: India ₹50, International ₹1000 (no free shipping)
      const isIndiaOrder = (shipping_info.country || '').toLowerCase().includes('india');
      shippingCost = isIndiaOrder ? 50 : 1000;
    }
    const total = subtotal + shippingCost - discount;

    // Create Razorpay order — only store minimal reference data in notes (256 char limit per value)
    const razorpayOrder = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`),
      },
      body: JSON.stringify({
        amount: Math.round(total * 100),
        currency: isINR ? 'INR' : 'USD',
        receipt: `rcpt_${Date.now()}`,
        notes: {
          user_id: user_id || '',
          coupon_code: coupon_code || '',
        }
      }),
    });

    const orderData = await razorpayOrder.json();
    if (orderData.error) throw new Error(orderData.error.description);

    // Create pending order in Supabase (all data stored here, not in Razorpay notes)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user_id || null,
        payment_order_id: orderData.id,
        payment_method: 'razorpay',
        payment_provider: 'razorpay',
        status: 'pending',
        payment_status: 'pending',
        currency,
        subtotal,
        discount,
        shipping_cost: shippingCost,
        total,
        coupon_id: couponId,
        coupon_code: coupon_code || null,
        coupon_discount: discount,
        shipping_name: shipping_info.name,
        shipping_email: shipping_info.email,
        shipping_phone: shipping_info.phone,
        shipping_address_line_1: shipping_info.address,
        shipping_city: shipping_info.city,
        shipping_state: shipping_info.state,
        shipping_postal_code: shipping_info.postal_code,
        shipping_country: shipping_info.country || 'India',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items — use null for product_id if it's not a valid UUID (static products)
    for (const item of validatedItems) {
      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: isValidUUID(item.id) ? item.id : null,
        product_name: item.name,
        product_image: item.image,
        quantity: item.qty,
        unit_price: item.price,
        total_price: item.price * item.qty,
        currency,
      });
      if (itemError) {
        console.error('[CREATE-ORDER] Error inserting order item:', itemError);
      }
    }

    // Add status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: 'pending',
      note: 'Order created, awaiting payment',
      is_customer_visible: true,
    });

    // Record coupon usage
    if (couponId) {
      await supabase.from('coupon_usage').insert({
        coupon_id: couponId,
        user_id: user_id || null,
        order_id: order.id,
        discount_applied: discount,
      });
    }

    return new Response(JSON.stringify({
      order_id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      key_id: razorpayKeyId,
      subtotal,
      shipping_cost: shippingCost,
      discount,
      total,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
