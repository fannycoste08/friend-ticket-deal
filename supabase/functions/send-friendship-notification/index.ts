import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getEmailTemplate } from '../_shared/email-templates.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FriendshipNotificationRequest {
  recipient_id: string;
  recipient_name: string;
  requester_name: string;
}

// Fallback HTML
function getFallbackHtml(recipientName: string, requesterName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:linear-gradient(135deg,#8B5CF6 0%,#D946EF 100%);color:white;padding:30px 20px;text-align:center;border-radius:8px 8px 0 0}.content{background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}.button{display:inline-block;background:linear-gradient(135deg,#8B5CF6 0%,#D946EF 100%);color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px}</style></head>
<body><div class="container">
<div class="header"><h1 style="margin:0">¡Nueva solicitud de amistad!</h1></div>
<div class="content">
<p>Hola <strong>${recipientName}</strong>,</p>
<p><strong>${requesterName}</strong> te ha enviado una solicitud de amistad en TrusTicket.</p>
<p>Puedes aceptar o rechazar esta solicitud desde tu perfil:</p>
<div style="text-align:center"><a href="${appUrl}/profile" class="button">Ver solicitud</a></div>
<p style="color:#6b7280;font-size:14px">Al aceptar la solicitud, podrás ver las entradas que publica ${requesterName} y ampliar tu red de confianza.</p>
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
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { recipient_id, recipient_name, requester_name }: FriendshipNotificationRequest = await req.json();

    const { data: friendshipRequest, error: friendshipError } = await supabaseAdmin
      .from('friendships')
      .select('id, friend_id')
      .eq('user_id', user.id)
      .eq('friend_id', recipient_id)
      .eq('status', 'pending')
      .single();

    if (friendshipError || !friendshipRequest) {
      return new Response(
        JSON.stringify({ error: 'No valid friendship request found' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: recipientProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', recipient_id)
      .single();

    if (profileError || !recipientProfile?.email) {
      return new Response(
        JSON.stringify({ error: 'Invalid recipient' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const recipient_email = recipientProfile.email;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const APP_URL = 'https://trusticket.lovable.app';

    const dbTemplate = await getEmailTemplate('friendship-notification', {
      recipient_name,
      requester_name,
      app_url: APP_URL,
    });

    const subject = dbTemplate?.subject ?? 'Nueva solicitud de amistad en TrusTicket';
    const html = dbTemplate?.html ?? getFallbackHtml(recipient_name, requester_name, APP_URL);

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

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-friendship-notification function:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
