import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationAcceptedRequest {
  invitee_email: string;
  invitee_name: string;
  inviter_name: string;
  inviter_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitee_email, invitee_name, inviter_name, inviter_email }: InvitationAcceptedRequest = await req.json();
    
    console.log('Processing invitation notification:', { invitee_email, invitee_name, inviter_name, inviter_email });

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
        subject: `¡Tu solicitud de registro ha sido aprobada!`,
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
                .highlight-box { background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; }
                .info-box { background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🎉 ¡Tu cuenta ha sido aprobada!</h1>
                </div>
                <div class="content">
                  <p>Hola <strong>${invitee_name}</strong>,</p>
                  <p>¡Buenas noticias! <strong>${inviter_name}</strong> ha aprobado tu solicitud de registro en <strong>TrusTicket</strong>.</p>
                  
                  <div class="highlight-box">
                    <p style="margin: 0; font-weight: bold; color: #16a34a;">✅ Tu cuenta ha sido creada</p>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">Ahora solo necesitas establecer tu contraseña para acceder.</p>
                  </div>
                  
                  <div class="info-box">
                    <p style="margin: 0; font-weight: bold; color: #1e40af;">🔐 Próximo paso:</p>
                    <p style="margin: 10px 0 5px 0; font-size: 14px;">
                      Recibirás un correo adicional de TrusTicket con un enlace para establecer tu contraseña.
                    </p>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">
                      <strong>Importante:</strong> Revisa también tu carpeta de spam o correo no deseado si no lo ves en tu bandeja de entrada.
                    </p>
                  </div>
                  
                  <p style="color: #374151; font-size: 14px; margin-top: 20px;">
                    Una vez que hayas establecido tu contraseña, podrás iniciar sesión con:
                  </p>
                  <ul style="color: #6b7280; font-size: 14px; margin: 10px 0 0 20px;">
                    <li>Email: <strong style="color: #374151;">${invitee_email}</strong></li>
                    <li>La contraseña que establezcas</li>
                  </ul>
                  
                  <p style="color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 25px;">
                    ¿No encuentras el correo para establecer tu contraseña? Puedes usar la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión.
                  </p>
                  
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">Si no solicitaste esta cuenta, puedes ignorar este email.</p>
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
