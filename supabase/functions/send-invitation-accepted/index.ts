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
        subject: `${inviter_name} te invita a TrusTicket`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
                .highlight-box { background: #f3f4f6; padding: 15px; border-left: 4px solid #8B5CF6; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🎉 ¡Te han invitado a TrusTicket!</h1>
                </div>
                <div class="content">
                  <p>Hola <strong>${invitee_name}</strong>,</p>
                  <p>Buenas noticias: <strong>${inviter_name}</strong> ha aprobado tu solicitud de registro en <strong>TrusTicket</strong>.</p>
                  
                  <div class="highlight-box">
                    <p style="margin: 0; font-weight: bold; color: #8B5CF6;">✨ ¡Tu cuenta está activada!</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Ya puedes iniciar sesión con la contraseña que creaste durante el registro.</p>
                  </div>
                  <p><strong>Recuerda:</strong></p>
                  <ul style="margin: 10px 0;">
                    <li>📧 Email: <strong>${invitee_email}</strong></li>
                    <li>🔑 Contraseña: <strong>La que creaste al registrarte</strong></li>
                  </ul>
                  
                  <p style="text-align: center; margin: 30px 0;">
                    <a href="https://friend-ticket-deal.lovable.app/login" class="button">
                      🚀 Iniciar sesión ahora
                    </a>
                  </p>
                  
                  <p style="color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px;">
                    <strong>¿Olvidaste tu contraseña?</strong> Puedes restablecerla usando la opción "¿Olvidaste tu contraseña?" en la página de login.
                  </p>
                  
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">Si no solicitaste esta invitación, puedes ignorar este email.</p>
                </div>
                <div class="footer">
                  <p>© 2025 TrusTicket. Compra y vende entradas de forma segura.</p>
                </div>
              </div>
            </body>
          </html>
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
      JSON.stringify({ error: 'Failed to send notification' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
