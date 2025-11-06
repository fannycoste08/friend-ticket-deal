import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getInvitationPendingEmail } from './_templates/invitation-pending.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationNotificationRequest {
  inviter_email: string;
  inviter_name: string;
  invitee_name: string;
  invitee_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviter_email, inviter_name, invitee_name, invitee_email }: InvitationNotificationRequest = await req.json();
    
    console.log('Processing invitation notification:', { inviter_email, inviter_name, invitee_name, invitee_email });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const APP_URL = 'https://trusticket.lovable.app';

    // Generate HTML email from template
    const html = getInvitationPendingEmail(
      inviter_name,
      invitee_name,
      invitee_email,
      APP_URL
    );

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrusTicket <info@trusticket.com>',
        to: [inviter_email],
        subject: 'Nueva solicitud de registro en TrusTicket',
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
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-notification function:", error);
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
