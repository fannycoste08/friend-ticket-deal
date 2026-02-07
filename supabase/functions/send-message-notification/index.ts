import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getEmailTemplate } from '../_shared/email-templates.ts';
import { checkRateLimit, logEmail } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageNotificationRequest {
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  ticket_artist: string;
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

// Fallback HTML
function getFallbackHtml(recipientName: string, senderName: string, ticketArtist: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body>
<h1>Tienes un nuevo mensaje</h1>
<p>Hola ${recipientName},</p>
<p><strong>${senderName}</strong> te ha enviado un mensaje sobre tu entrada de <strong>${ticketArtist}</strong>.</p>
<p>Entra a TrusTicket para ver el mensaje y responder.</p>
<p>Saludos,<br>El equipo de TrusTicket</p>
</body></html>`;
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: token inválido' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { recipient_email, recipient_name, sender_name, ticket_artist, ticket_id }: MessageNotificationRequest = await req.json();
    
    if (!recipient_email || !recipient_name || !sender_name || !ticket_artist || !ticket_id) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (recipient_name.length > 100 || sender_name.length > 100 || ticket_artist.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Uno de los campos de texto excede el límite permitido' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rateLimitCheck = await checkRateLimit(
      user.id, recipient_email, 'send-message-notification',
      Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
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

    if (ticket.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const safeRecipientName = escapeHtml(recipient_name);
    const safeSenderName = escapeHtml(sender_name);
    const safeTicketArtist = escapeHtml(ticket_artist);

    const dbTemplate = await getEmailTemplate('message-notification', {
      recipient_name: safeRecipientName,
      sender_name: safeSenderName,
      ticket_artist: safeTicketArtist,
    });

    const subject = dbTemplate?.subject ?? 'Nuevo mensaje sobre tu entrada - TrusTicket';
    const html = dbTemplate?.html ?? getFallbackHtml(safeRecipientName, safeSenderName, safeTicketArtist);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrusTicket <info@trusticket.com>',
        to: [recipient_email],
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    await logEmail(
      user.id, recipient_email, 'send-message-notification',
      Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-message-notification function:", error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
