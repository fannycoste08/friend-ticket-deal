import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailTemplate } from '../_shared/email-templates.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationAcceptedRequest {
  invitation_id: string;
  password_reset_link: string;
}

// Fallback HTML template
function getFallbackHtml(inviteeName: string, inviterName: string, passwordResetLink: string, inviteeEmail: string): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
      .highlight-box { background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; margin: 20px 0; }
      .info-box { background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
      .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header"><h1 style="margin: 0;">🎉 ¡Tu cuenta ha sido aprobada!</h1></div>
      <div class="content">
        <p>Hola <strong>${inviteeName}</strong>,</p>
        <p>¡Buenas noticias! <strong>${inviterName}</strong> ha aprobado tu solicitud de registro en <strong>TrusTicket</strong>.</p>
        <div class="highlight-box">
          <p style="margin: 0; font-weight: bold; color: #16a34a;">✅ Tu cuenta ha sido creada</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Ahora solo necesitas establecer tu contraseña para acceder.</p>
        </div>
        <div class="info-box">
          <p style="margin: 0; font-weight: bold; color: #1e40af;">🔐 Crear tu contraseña:</p>
          <p style="margin: 10px 0 20px 0; font-size: 14px;">Haz clic en el botón de abajo para crear tu contraseña de acceso:</p>
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
            <tr>
              <td align="center" bgcolor="#3b82f6" style="border-radius: 8px;">
                <a href="${passwordResetLink}" target="_blank" style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; background-color: #3b82f6; border-radius: 8px;">Crear mi contraseña</a>
              </td>
            </tr>
          </table>
          <p style="margin: 15px 0 0 0; font-size: 13px; color: #6b7280;"><strong>Importante:</strong> Necesitarás el email de tu padrino para verificar tu identidad.</p>
        </div>
        <p style="color: #374151; font-size: 14px; margin-top: 20px;">Una vez que hayas creado tu contraseña, podrás iniciar sesión con:</p>
        <ul style="color: #6b7280; font-size: 14px; margin: 10px 0 0 20px;">
          <li>Email: <strong style="color: #374151;">${inviteeEmail}</strong></li>
          <li>La contraseña que crees</li>
        </ul>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">Si no solicitaste esta cuenta, puedes ignorar este email.</p>
      </div>
      <div class="footer"><p>© 2025 TrusTicket. Compra y vende entradas de forma segura.</p></div>
    </div>
  </body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { invitation_id, password_reset_link }: InvitationAcceptedRequest = await req.json();
    
    if (!invitation_id || !password_reset_link) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const allowedDomains = [supabaseUrl, 'https://ystnsszlaqhwysgptysd.supabase.co'];
    const linkUrl = new URL(password_reset_link);
    const isValidDomain = allowedDomains.some(domain => password_reset_link.startsWith(domain));
    if (!isValidDomain) {
      console.error('Invalid password reset link domain:', linkUrl.hostname);
      return new Response(JSON.stringify({ error: 'Invalid password reset link' }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('id, invitee_email, invitee_name, inviter_id, status')
      .eq('id', invitation_id)
      .eq('inviter_id', user.id)
      .eq('status', 'approved')
      .single();

    if (invitationError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found or unauthorized' }), {
        status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: inviterProfile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const inviterName = inviterProfile?.name || 'Tu padrino';

    console.log('Sending invitation accepted email:', { 
      invitee_email: invitation.invitee_email, 
      invitee_name: invitation.invitee_name, 
      inviter_name: inviterName 
    });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    // Try DB template first, fallback to hardcoded
    const dbTemplate = await getEmailTemplate('invitation-accepted', {
      invitee_name: invitation.invitee_name,
      inviter_name: inviterName,
      password_reset_link,
      invitee_email: invitation.invitee_email,
    });

    const subject = dbTemplate?.subject ?? '¡Tu solicitud de registro ha sido aprobada!';
    const html = dbTemplate?.html ?? getFallbackHtml(
      invitation.invitee_name,
      inviterName,
      password_reset_link,
      invitation.invitee_email
    );

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrusTicket <info@trusticket.com>',
        to: [invitation.invitee_email],
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

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-accepted function:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
