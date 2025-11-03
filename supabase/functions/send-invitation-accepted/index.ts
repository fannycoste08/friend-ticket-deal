import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationAcceptedRequest {
  invitee_email: string;
  invitee_name: string;
  inviter_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitee_email, invitee_name, inviter_name }: InvitationAcceptedRequest = await req.json();
    
    console.log('Processing invitation accepted notification:', { invitee_email, invitee_name, inviter_name });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrusTicket <info@trusticket.com>',
        to: [invitee_email],
        subject: '¡Tu solicitud ha sido aprobada! - TrusTicket',
        html: `
          <h1>¡Bienvenido a TrusTicket!</h1>
          <p>Hola ${invitee_name},</p>
          <p>¡Buenas noticias! <strong>${inviter_name}</strong> ha aprobado tu solicitud de registro.</p>
          <p>Ya puedes acceder a TrusTicket y empezar a comprar y vender entradas de forma segura.</p>
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
    console.error("Error in send-invitation-accepted function:", error);
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
