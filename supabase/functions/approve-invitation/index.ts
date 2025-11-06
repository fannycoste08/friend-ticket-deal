import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApproveInvitationRequest {
  invitation_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: falta token de autenticación' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: token inválido' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { invitation_id }: ApproveInvitationRequest = await req.json();

    if (!invitation_id || typeof invitation_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'ID de invitación inválido' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Processing invitation approval:', invitation_id);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get invitation details and verify ownership
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .single();

    if (invitationError || !invitation) {
      console.error('Invitation verification failed:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Unable to process request' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify that the authenticated user is the inviter
    if (invitation.inviter_id !== user.id) {
      console.error('Unauthorized invitation access');
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // User should already exist (created during registration)
    // We just need to update the invitation status
    console.log('Approving invitation for:', invitation.invitee_email);

    // Update invitation status to approved
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({ status: 'approved' })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update invitation' }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send acceptance notification email
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-invitation-accepted', {
      body: {
        invitee_email: invitation.invitee_email,
        invitee_name: invitation.invitee_name,
        inviter_name: user.user_metadata?.name || 'tu padrino'
      }
    });

    if (emailError) {
      console.error('Error sending acceptance email:', emailError);
      // Don't fail the approval if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitación aprobada. El usuario puede hacer login ahora.',
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in approve-invitation function:", error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
