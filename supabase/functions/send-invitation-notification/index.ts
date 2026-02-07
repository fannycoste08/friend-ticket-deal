import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getInvitationPendingEmail } from './_templates/invitation-pending.ts';
import { getEmailTemplate } from '../_shared/email-templates.ts';
import { checkIPRateLimit, logIPAttempt, getClientIP } from '../_shared/ip-rate-limiter.ts';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const clientIP = getClientIP(req);
    
    const rateLimitCheck = await checkIPRateLimit(
      clientIP,
      'send-invitation-notification',
      supabaseUrl,
      supabaseServiceKey,
      { maxAttempts: 10, windowMinutes: 15 }
    );

    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for IP ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { inviter_email, inviter_name, invitee_name, invitee_email }: InvitationNotificationRequest = await req.json();
    
    if (!inviter_email || !invitee_email || !invitee_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('id, inviter_id, invitee_email, status')
      .ilike('invitee_email', invitee_email.trim().toLowerCase())
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (invitationError || !invitation) {
      console.error('Invitation validation error:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invalid request - no pending invitation found' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: inviterProfile, error: inviterError } = await supabaseAdmin
      .from('profiles')
      .select('email, name')
      .eq('id', invitation.inviter_id)
      .single();

    if (inviterError || !inviterProfile) {
      console.error('Inviter profile not found:', inviterError);
      return new Response(
        JSON.stringify({ error: 'Inviter not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (inviterProfile.email.toLowerCase() !== inviter_email.trim().toLowerCase()) {
      console.error('Inviter email mismatch');
      return new Response(
        JSON.stringify({ error: 'Invalid inviter email' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await logIPAttempt(clientIP, 'send-invitation-notification', supabaseUrl, supabaseServiceKey);
    
    console.log('Processing invitation notification:', { inviter_email: inviterProfile.email, invitee_name, invitee_email });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const APP_URL = 'https://www.trusticket.com';

    // Try DB template first, fallback to hardcoded
    const dbTemplate = await getEmailTemplate('invitation-pending', {
      inviter_name: inviterProfile.name,
      invitee_name,
      invitee_email,
      app_url: APP_URL,
    });

    const subject = dbTemplate?.subject ?? 'Nueva solicitud de registro en TrusTicket';
    const html = dbTemplate?.html ?? getInvitationPendingEmail(
      inviterProfile.name,
      invitee_name,
      invitee_email,
      APP_URL
    );

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TrusTicket <info@trusticket.com>',
        to: [inviterProfile.email],
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
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-notification function:", error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
