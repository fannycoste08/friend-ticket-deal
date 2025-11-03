import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  seller_email: string;
  seller_name: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  message: string;
  artist: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      seller_email, 
      seller_name, 
      buyer_name, 
      buyer_email, 
      buyer_phone, 
      message, 
      artist 
    }: ContactEmailRequest = await req.json();
    
    console.log('Processing contact email:', { seller_email, buyer_name, artist });

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
        subject: `Interés en tu entrada para ${artist}`,
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
                .info-box { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">¡Alguien está interesado en tu entrada!</h1>
                </div>
                <div class="content">
                  <p>Hola <strong>${seller_name}</strong>,</p>
                  <p><strong>${buyer_name}</strong> está interesado en tu entrada para <strong>${artist}</strong> y te ha enviado el siguiente mensaje:</p>
                  
                  <div class="info-box">
                    <p style="margin: 0;"><strong>Mensaje:</strong></p>
                    <p style="margin: 10px 0 0 0;">${message}</p>
                  </div>

                  <div class="info-box">
                    <p style="margin: 0;"><strong>Datos de contacto:</strong></p>
                    <p style="margin: 10px 0 0 0;">
                      <strong>Nombre:</strong> ${buyer_name}<br>
                      <strong>Email:</strong> <a href="mailto:${buyer_email}">${buyer_email}</a><br>
                      <strong>Teléfono:</strong> <a href="tel:${buyer_phone}">${buyer_phone}</a>
                    </p>
                  </div>

                  <p>Puedes ponerte en contacto directamente con ${buyer_name} usando los datos de contacto proporcionados.</p>
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
    console.error("Error in send-contact-email function:", error);
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
