import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateEmail } from '../_shared/validation.ts';
import { checkIPRateLimit, logIPAttempt, getClientIP } from '../_shared/ip-rate-limiter.ts';
import { getEmailTemplate } from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // IP-based rate limiting (10 invitations per hour)
    const clientIP = getClientIP(req);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const rateLimitCheck = await checkIPRateLimit(
      clientIP,
      'create-invitation-request',
      supabaseUrl,
      supabaseKey,
      { maxAttempts: 10, windowMinutes: 60 }
    );

    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many invitation requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { inviter_email, invitee_email, invitee_name } = await req.json();

    // Validate inputs
    if (!inviter_email || !invitee_email || !invitee_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    if (!validateEmail(invitee_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const normalizedEmail = invitee_email.trim().toLowerCase();
    const normalizedInviterEmail = inviter_email.trim().toLowerCase();
    console.log('Creating invitation request for:', normalizedEmail, 'from inviter:', normalizedInviterEmail);

    // Look up inviter by email
    const { data: inviterProfile, error: inviterError } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .ilike('email', normalizedInviterEmail)
      .single();

    if (inviterError || !inviterProfile) {
      console.error('Inviter not found:', inviterError);
      return new Response(
        JSON.stringify({ error: 'Inviter not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .ilike('invitee_email', normalizedEmail)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: 'Pending invitation already exists' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the invitation
    const { data, error } = await supabaseAdmin
      .from('invitations')
      .insert({
        inviter_id: inviterProfile.id,
        invitee_email: normalizedEmail,
        invitee_name: invitee_name.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Invitation created successfully:', data.id);

    // Log successful attempt
    await logIPAttempt(clientIP, 'create-invitation-request', supabaseUrl, supabaseKey);

    // Send notification email to the invitee (best-effort, never blocks the response)
    try {
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      const APP_URL = 'https://www.trusticket.com';

      if (RESEND_API_KEY) {
        const dbTemplate = await getEmailTemplate('invitation-invitee-notification', {
          inviter_name: inviterProfile.name,
          invitee_name: invitee_name.trim(),
          app_url: APP_URL,
        });

        const subject = dbTemplate?.subject ?? `${inviterProfile.name} te ha invitado a Trusticket`;
        const html = dbTemplate?.html ?? `<p>Hola ${invitee_name.trim()}, ${inviterProfile.name} te ha invitado a Trusticket. Recibirás un email para registrarte cuando apruebe tu acceso.</p>`;

        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Trusticket <noreply@trusticket.com>',
            to: [normalizedEmail],
            subject,
            html,
          }),
        });

        if (!emailResp.ok) {
          const errBody = await emailResp.text();
          console.error('Resend invitee email error:', errBody);
        } else {
          console.log('Invitee notification email sent to', normalizedEmail);
        }
      } else {
        console.warn('RESEND_API_KEY not set, skipping invitee email');
      }
    } catch (emailErr) {
      console.error('Failed to send invitee notification (non-blocking):', emailErr);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        invitation: data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in create-invitation-request function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
