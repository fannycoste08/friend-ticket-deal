import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getEmailTemplate } from '../_shared/email-templates.ts';
import { checkRateLimit, logEmail } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  seller_id: string;
  seller_name: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  message: string;
  artist: string;
  ticket_id: string;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 6 && phone.length <= 20;
}

// Fallback HTML
function getFallbackHtml(vars: Record<string, string>): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#8B5CF6 0%,#D946EF 100%);color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}.info-box{background:#f9fafb;padding:15px;border-radius:6px;margin:20px 0}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px}</style></head>
<body><div class="container">
<div class="header"><h1 style="margin:0">¡Alguien está interesado en tu entrada!</h1></div>
<div class="content">
<p>Hola <strong>${vars.seller_name}</strong>,</p>
<p><strong>${vars.buyer_name}</strong> está interesado en tu entrada para <strong>${vars.artist}</strong> y te ha enviado el siguiente mensaje:</p>
<div class="info-box"><p style="margin:0"><strong>Mensaje:</strong></p><p style="margin:10px 0 0 0">${vars.message}</p></div>
<div class="info-box"><p style="margin:0"><strong>Datos de contacto:</strong></p><p style="margin:10px 0 0 0"><strong>Nombre:</strong> ${vars.buyer_name}<br><strong>Email:</strong> <a href="mailto:${vars.buyer_email}">${vars.buyer_email}</a><br><strong>Teléfono:</strong> <a href="tel:${vars.buyer_phone}">${vars.buyer_phone}</a></p></div>
<p>Puedes ponerte en contacto directamente con ${vars.buyer_name} usando los datos de contacto proporcionados.</p>
</div>
<div class="footer"><p>© 2025 TrusTicket. Compra y vende entradas de forma segura.</p></div>
</div></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: falta token de autenticación' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: token inválido' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { seller_id, seller_name, buyer_name, buyer_email, buyer_phone, message, artist, ticket_id }: ContactEmailRequest = await req.json();

    if (!seller_id || !buyer_name || !buyer_email || !buyer_phone || !message || !artist || !ticket_id) {
      return new Response(
        JSON.stringify({ error: 'Request could not be processed' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidEmail(buyer_email) || buyer_email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Invalid input provided' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidPhone(buyer_phone) || buyer_phone.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid input provided' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (message.length > 1000 || buyer_name.length > 100 || seller_name.length > 100 || artist.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid input provided' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: sellerProfile, error: sellerError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', seller_id)
      .single();

    if (sellerError || !sellerProfile?.email) {
      return new Response(
        JSON.stringify({ error: 'Seller not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const seller_email = sellerProfile.email;

    const rateLimitCheck = await checkRateLimit(
      user.id, seller_email, 'send-contact-email',
      Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('id, user_id')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Unable to process request' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (ticket.user_id !== seller_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid seller' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const safeSeller = escapeHtml(seller_name);
    const safeBuyer = escapeHtml(buyer_name);
    const safeMessage = escapeHtml(message);
    const safeArtist = escapeHtml(artist);
    const safeBuyerEmail = escapeHtml(buyer_email);
    const safeBuyerPhone = escapeHtml(buyer_phone);

    const templateVars = {
      seller_name: safeSeller,
      buyer_name: safeBuyer,
      buyer_email: safeBuyerEmail,
      buyer_phone: safeBuyerPhone,
      message: safeMessage,
      artist: safeArtist,
    };

    const dbTemplate = await getEmailTemplate('contact-email', templateVars);

    const subject = dbTemplate?.subject ?? `Interés en tu entrada para ${safeArtist}`;
    const html = dbTemplate?.html ?? getFallbackHtml(templateVars);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrusTicket <info@trusticket.com>',
        to: [seller_email],
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    await logEmail(
      user.id, seller_email, 'send-contact-email',
      Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
