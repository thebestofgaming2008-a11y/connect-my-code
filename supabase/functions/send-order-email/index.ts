import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STORE_NAME = 'Abu Hurayrah Essentials';
const STORE_EMAIL = 'abuhurayrahessentials@gmail.com';

interface EmailRequest {
  order_id: string;
  email_type: 'confirmation' | 'tracking_update' | 'status_update';
}

function currencySymbol(c: string | null) {
  return c === 'INR' ? '₹' : '$';
}

function buildConfirmationHtml(order: any, items: any[]) {
  const sym = currencySymbol(order.currency);
  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.product_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${sym}${Number(i.total_price || i.unit_price * i.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
    <div style="text-align:center;padding:20px 0;border-bottom:2px solid #1a365d;">
      <h1 style="color:#1a365d;margin:0;font-size:24px;">${STORE_NAME}</h1>
    </div>
    <div style="padding:24px 0;">
      <h2 style="color:#1a365d;">Order Confirmed ✓</h2>
      <p>Assalamu Alaikum ${order.shipping_name || 'valued customer'},</p>
      <p>JazakAllahu Khairan for your order! We've received your payment and your order is being prepared.</p>
      <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 4px;"><strong>Order Number:</strong> ${order.order_number || order.id.slice(0, 8)}</p>
        <p style="margin:0;"><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr style="background:#1a365d;color:#fff;">
          <th style="padding:10px 12px;text-align:left;">Item</th>
          <th style="padding:10px 12px;text-align:center;">Qty</th>
          <th style="padding:10px 12px;text-align:right;">Price</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="text-align:right;padding:12px;background:#f8f9fa;border-radius:8px;">
        <p style="margin:4px 0;">Shipping: ${sym}${Number(order.shipping_cost).toFixed(2)}</p>
        ${order.discount > 0 ? `<p style="margin:4px 0;color:#16a34a;">Discount: -${sym}${Number(order.discount).toFixed(2)}</p>` : ''}
        <p style="margin:8px 0 0;font-size:18px;"><strong>Total: ${sym}${Number(order.total).toFixed(2)}</strong></p>
      </div>
      <div style="margin:20px 0;padding:16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #1a365d;">
        <p style="margin:0 0 4px;font-weight:bold;">Shipping To:</p>
        <p style="margin:0;">${order.shipping_name}<br>${order.shipping_address_line_1}<br>${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}<br>${order.shipping_country}</p>
      </div>
      <p>We'll send you another email when your order ships with tracking information.</p>
      <p>If you have any questions, reach us on WhatsApp: <a href="https://wa.me/918491943437">+91 8491943437</a></p>
    </div>
    <div style="text-align:center;padding:16px 0;border-top:1px solid #eee;color:#999;font-size:12px;">
      <p>${STORE_NAME} • Islamic Books & Essentials</p>
    </div>
  </body></html>`;
}

function buildTrackingHtml(order: any) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
    <div style="text-align:center;padding:20px 0;border-bottom:2px solid #1a365d;">
      <h1 style="color:#1a365d;margin:0;font-size:24px;">${STORE_NAME}</h1>
    </div>
    <div style="padding:24px 0;">
      <h2 style="color:#1a365d;">Your Order Has Shipped! 📦</h2>
      <p>Assalamu Alaikum ${order.shipping_name || 'valued customer'},</p>
      <p>Great news! Your order <strong>${order.order_number || order.id.slice(0, 8)}</strong> has been shipped.</p>
      <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #1a365d;">
        ${order.tracking_carrier ? `<p style="margin:0 0 8px;"><strong>Carrier:</strong> ${order.tracking_carrier}</p>` : ''}
        <p style="margin:0 0 8px;"><strong>Tracking Number:</strong> ${order.tracking_number}</p>
        ${order.tracking_url ? `<p style="margin:0;"><a href="${order.tracking_url}" style="color:#1a365d;font-weight:bold;">Track Your Package →</a></p>` : ''}
      </div>
      <p>You can also track your order from your account on our website.</p>
      <p>If you have any questions, reach us on WhatsApp: <a href="https://wa.me/918491943437">+91 8491943437</a></p>
    </div>
    <div style="text-align:center;padding:16px 0;border-top:1px solid #eee;color:#999;font-size:12px;">
      <p>${STORE_NAME} • Islamic Books & Essentials</p>
    </div>
  </body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      console.error('[send-order-email] BREVO_API_KEY not set');
      return new Response(JSON.stringify({ error: 'BREVO_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const { order_id, email_type }: EmailRequest = await req.json();
    console.log('[send-order-email] Called with:', { order_id, email_type });

    if (!order_id || !email_type) {
      return new Response(JSON.stringify({ error: 'Missing order_id or email_type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('[send-order-email] Order not found:', order_id, orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[send-order-email] Order found:', order.order_number, 'email:', order.shipping_email);

    if (!order.shipping_email) {
      console.error('[send-order-email] No email on order', order.order_number);
      return new Response(JSON.stringify({ error: 'No email on order' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let subject = '';
    let html = '';

    if (email_type === 'confirmation') {
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order_id);

      subject = `Order Confirmed — ${order.order_number || order_id.slice(0, 8)} | ${STORE_NAME}`;
      html = buildConfirmationHtml(order, items || []);
    } else if (email_type === 'tracking_update') {
      subject = `Your Order Has Shipped — ${order.order_number || order_id.slice(0, 8)} | ${STORE_NAME}`;
      html = buildTrackingHtml(order);
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported email_type' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send via Brevo (Sendinblue) transactional API
    console.log('[send-order-email] Sending to:', order.shipping_email, 'subject:', subject);
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: STORE_NAME, email: STORE_EMAIL },
        to: [{ email: order.shipping_email, name: order.shipping_name || '' }],
        subject,
        htmlContent: html,
      }),
    });

    const brevoData = await brevoRes.json();

    if (!brevoRes.ok) {
      console.error('[send-order-email] Brevo error:', brevoData);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: brevoData }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message_id: brevoData.messageId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[send-order-email] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
