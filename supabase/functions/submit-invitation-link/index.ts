import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateEmail, validateName, sanitizeString } from '../_shared/validation.ts';
import { checkIPRateLimit, logIPAttempt, getClientIP } from '../_shared/ip-rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const clientIP = getClientIP(req);

    const rate = await checkIPRateLimit(
      clientIP,
      'submit-invitation-link',
      supabaseUrl,
      serviceKey,
      { maxAttempts: 10, windowMinutes: 60 }
    );
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { token, name, email } = await req.json();

    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'Token requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const nameCheck = validateName(name);
    if (!nameCheck.valid) {
      return new Response(JSON.stringify({ error: nameCheck.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return new Response(JSON.stringify({ error: emailCheck.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const normalizedEmail = email.trim().toLowerCase();
    const cleanName = sanitizeString(name);

    // Validate the invitation link
    const { data: linkRow, error: linkErr } = await admin
      .from('invitation_links')
      .select('id, user_id, expires_at, revoked, slug, token')
      .or(`token.eq.${token},slug.eq.${token}`)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (linkErr || !linkRow) {
      return new Response(JSON.stringify({ error: 'invalid', message: 'Este link de invitación no es válido.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (linkRow.revoked) {
      return new Response(JSON.stringify({ error: 'revoked', message: 'Este link de invitación ya no es válido.' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (new Date(linkRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'expired', message: 'Este link de invitación ha caducado.' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check the email is not already a registered user
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'already_user', message: 'Este email ya tiene una cuenta en Trusticket. Inicia sesión.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's already a pending invitation from THIS inviter to this email
    const { data: existingInvitation } = await admin
      .from('invitations')
      .select('id, status')
      .ilike('invitee_email', normalizedEmail)
      .eq('inviter_id', linkRow.user_id)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({
          error: 'duplicate',
          message: 'Ya existe una solicitud para este email con esta persona.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get inviter profile (for the notification email)
    const { data: inviter, error: inviterErr } = await admin
      .from('profiles')
      .select('email, name')
      .eq('id', linkRow.user_id)
      .single();

    if (inviterErr || !inviter) {
      return new Response(JSON.stringify({ error: 'Inviter not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the pending invitation
    const { data: invitation, error: insertErr } = await admin
      .from('invitations')
      .insert({
        inviter_id: linkRow.user_id,
        invitee_email: normalizedEmail,
        invitee_name: cleanName,
        status: 'pending',
      })
      .select()
      .single();

    if (insertErr || !invitation) {
      console.error('Error creating invitation from link:', insertErr);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await logIPAttempt(clientIP, 'submit-invitation-link', supabaseUrl, serviceKey);

    // Notify the inviter via the existing notification function
    try {
      await admin.functions.invoke('send-invitation-notification', {
        body: {
          inviter_email: inviter.email,
          inviter_name: inviter.name,
          invitee_name: cleanName,
          invitee_email: normalizedEmail,
        },
      });
    } catch (notifyErr) {
      console.error('Notification error (non-fatal):', notifyErr);
    }

    return new Response(JSON.stringify({ success: true, invitation_id: invitation.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('submit-invitation-link error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});