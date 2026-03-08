import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      if (signature !== expectedSignature) {
        console.error('[webhook-razorpay] Invalid signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[webhook-razorpay] Event: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const razorpayOrderId = payload.payment?.entity?.order_id || payload.order?.entity?.id;
      const razorpayPaymentId = payload.payment?.entity?.id;

      if (!razorpayOrderId) {
        console.error('[webhook-razorpay] No order_id in payload');
        return new Response(JSON.stringify({ status: 'skipped', reason: 'no order_id' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Find the order
      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, shipping_email')
        .eq('payment_order_id', razorpayOrderId)
        .single();

      if (findError || !order) {
        console.error('[webhook-razorpay] Order not found for:', razorpayOrderId);
        return new Response(JSON.stringify({ status: 'skipped', reason: 'order not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Already processed — idempotent
      if (order.payment_status === 'paid') {
        return new Response(JSON.stringify({ status: 'already_processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update order
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_id: razorpayPaymentId || null,
          paid_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Add status history
      await supabase.from('order_status_history').insert({
        order_id: order.id,
        status: 'confirmed',
        previous_status: order.status,
        note: `Payment confirmed via Razorpay webhook (${eventType})`,
        is_customer_visible: true,
      });

      // Send confirmation email
      try {
        const emailResp = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          },
          body: JSON.stringify({ order_id: order.id, email_type: 'confirmation' }),
        });
        if (!emailResp.ok) {
          const errBody = await emailResp.text();
          console.error('[webhook-razorpay] Email fn error:', emailResp.status, errBody);
        } else {
          console.log('[webhook-razorpay] Email sent for order', order.order_number);
        }
      } catch (emailErr) {
        console.error('[webhook-razorpay] Email fetch failed:', emailErr);
      }

      console.log(`[webhook-razorpay] Order ${order.order_number} confirmed via webhook`);
      return new Response(JSON.stringify({ status: 'processed', order_number: order.order_number }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (eventType === 'payment.failed') {
      const razorpayOrderId = payload.payment?.entity?.order_id;
      if (razorpayOrderId) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, status')
          .eq('payment_order_id', razorpayOrderId)
          .single();

        if (order && order.status === 'pending') {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', order.id);

          await supabase.from('order_status_history').insert({
            order_id: order.id,
            status: 'pending',
            note: `Payment failed: ${payload.payment?.entity?.error_description || 'Unknown error'}`,
            is_customer_visible: false,
          });
        }
      }

      return new Response(JSON.stringify({ status: 'processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Unhandled event type
    return new Response(JSON.stringify({ status: 'ignored', event: eventType }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[webhook-razorpay] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
