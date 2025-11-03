import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageNotificationRequest {
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  ticket_artist: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipient_email, recipient_name, sender_name, ticket_artist }: MessageNotificationRequest = await req.json();
    
    console.log('Processing message notification:', { recipient_email, recipient_name, sender_name, ticket_artist });

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
        subject: 'Nuevo mensaje sobre tu entrada - TrusTicket',
        html: `
          <h1>Tienes un nuevo mensaje</h1>
          <p>Hola ${recipient_name},</p>
          <p><strong>${sender_name}</strong> te ha enviado un mensaje sobre tu entrada de <strong>${ticket_artist}</strong>.</p>
          <p>Entra a TrusTicket para ver el mensaje y responder.</p>
          <p>Saludos,<br>El equipo de TrusTicket</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-message-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
