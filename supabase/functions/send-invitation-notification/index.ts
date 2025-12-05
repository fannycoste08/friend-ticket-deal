import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getInvitationPendingEmail } from './_templates/invitation-pending.ts';
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

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    
    // Check IP-based rate limit: max 10 attempts per 15 minutes
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
    
    // Validate required fields
    if (!inviter_email || !invitee_email || !invitee_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create admin client for database queries
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify that a pending invitation exists for this invitee_email
    // This validates the request without requiring authentication
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

    // Get the inviter's profile to verify email matches
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

    // Verify that the provided inviter_email matches the actual inviter
    if (inviterProfile.email.toLowerCase() !== inviter_email.trim().toLowerCase()) {
      console.error('Inviter email mismatch');
      return new Response(
        JSON.stringify({ error: 'Invalid inviter email' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log successful rate limit check
    await logIPAttempt(clientIP, 'send-invitation-notification', supabaseUrl, supabaseServiceKey);
    
    console.log('Processing invitation notification:', { inviter_email: inviterProfile.email, invitee_name, invitee_email });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const APP_URL = 'https://www.trusticket.com';

    // Generate HTML email from template - use actual inviter name from profile
    const html = getInvitationPendingEmail(
      inviterProfile.name,
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
        to: [inviterProfile.email],
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
