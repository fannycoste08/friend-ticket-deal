import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateInvitationRequest {
  invitee_email: string;
}

/**
 * Validates whether an invitation can be created for the given email.
 *
 * Decision tree:
 *  1) Email already a Trusticket user → create friendship request (no invitation)
 *  2) Email has a pending invitation from the SAME inviter → block
 *  3) Email has a pending invitation from ANOTHER inviter → block
 *  4) Email has a rejected invitation → allow new invitation flow
 *  5) No prior record → allow normal invitation flow
 */
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { invitee_email }: ValidateInvitationRequest = await req.json();
    if (!invitee_email || typeof invitee_email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'invitee_email requerido' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = invitee_email.trim().toLowerCase();

    // Get inviter profile
    const { data: inviterProfile, error: inviterErr } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .eq('id', user.id)
      .single();

    if (inviterErr || !inviterProfile) {
      return new Response(
        JSON.stringify({ error: 'Inviter profile not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prevent self-invite
    if (inviterProfile.email.toLowerCase() === normalizedEmail) {
      return new Response(
        JSON.stringify({ action: 'blocked', reason: 'self', message: 'No puedes invitarte a ti mismo.' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 1) Check if email is already a registered user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      const recipientId = existingProfile.id;

      // Check if friendship already exists in either direction
      const { data: existingFriendship } = await supabaseAdmin
        .from('friendships')
        .select('id, status, user_id, friend_id')
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${recipientId}),and(user_id.eq.${recipientId},friend_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          return new Response(
            JSON.stringify({
              action: 'blocked',
              reason: 'already_friends',
              message: 'Ya sois amigos en Trusticket.',
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        if (existingFriendship.status === 'pending') {
          return new Response(
            JSON.stringify({
              action: 'blocked',
              reason: 'friend_request_pending',
              message: 'Ya existe una solicitud de amistad pendiente con este usuario.',
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        // status 'rejected' → allow recreating the request below
      }

      // Create the friendship request (or recreate if previously rejected)
      if (existingFriendship && existingFriendship.status === 'rejected') {
        await supabaseAdmin
          .from('friendships')
          .update({ status: 'pending', user_id: user.id, friend_id: recipientId })
          .eq('id', existingFriendship.id);
      } else {
        const { error: friendshipErr } = await supabaseAdmin
          .from('friendships')
          .insert({
            user_id: user.id,
            friend_id: recipientId,
            status: 'pending',
          });

        if (friendshipErr) {
          console.error('Error creating friendship:', friendshipErr);
          return new Response(
            JSON.stringify({ error: 'No se pudo crear la solicitud de amistad' }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      // Send friendship notification email (best-effort)
      try {
        await supabaseAdmin.functions.invoke('send-friendship-notification', {
          body: {
            recipient_id: recipientId,
            recipient_name: existingProfile.name,
            requester_name: inviterProfile.name,
          },
          headers: { Authorization: authHeader },
        });
      } catch (e) {
        console.error('Friendship email failed (non-fatal):', e);
      }

      return new Response(
        JSON.stringify({
          action: 'friend_request_created',
          message: 'Este usuario ya está en Trusticket. Le hemos enviado una solicitud de amistad.',
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2 & 3) Check pending invitations for this email
    const { data: pendingInvitations } = await supabaseAdmin
      .from('invitations')
      .select('id, inviter_id, status')
      .ilike('invitee_email', normalizedEmail)
      .eq('status', 'pending');

    if (pendingInvitations && pendingInvitations.length > 0) {
      const sameInviter = pendingInvitations.find(i => i.inviter_id === user.id);
      if (sameInviter) {
        return new Response(
          JSON.stringify({
            action: 'blocked',
            reason: 'pending_same_inviter',
            message: 'Ya tienes una invitación pendiente para este email.',
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      return new Response(
        JSON.stringify({
          action: 'blocked',
          reason: 'pending_other_inviter',
          message: 'Esta persona ya tiene una invitación pendiente de aceptar.',
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 4 & 5) Rejected or no record → allow normal flow
    return new Response(
      JSON.stringify({ action: 'allow_invitation' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in validate-invitation function:", error);
    return new Response(
      JSON.stringify({ error: 'Validation failed' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);