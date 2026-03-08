import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature }: VerifyRequest = await req.json();
    
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ verified: false, error: "Missing payment details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(keySecret!),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC", key, encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
    );
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (razorpay_signature !== expectedSignature) {
      return new Response(JSON.stringify({ verified: false, error: "Invalid signature" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the pending order that was created during create-razorpay-order
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status")
      .eq("payment_order_id", razorpay_order_id)
      .single();

    if (findError || !order) {
      return new Response(
        JSON.stringify({ verified: false, error: "Order not found for this payment" }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If already paid, return it (idempotent — safe to call multiple times)
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ verified: true, order }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update order to confirmed with payment details
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_id: razorpay_payment_id,
        payment_signature: razorpay_signature,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .select("id, order_number")
      .single();

    if (updateError) throw updateError;

    // Add status history
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: "confirmed",
      previous_status: "pending",
      note: "Payment verified via Razorpay",
      is_customer_visible: true,
    });

    // Send order confirmation email
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
        console.error('[verify-payment] Email fn error:', emailResp.status, errBody);
      } else {
        console.log('[verify-payment] Email sent for order', order.id);
      }
    } catch (emailErr) {
      console.error('[verify-payment] Email fetch failed:', emailErr);
    }

    return new Response(JSON.stringify({ verified: true, order: updatedOrder }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ verified: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
