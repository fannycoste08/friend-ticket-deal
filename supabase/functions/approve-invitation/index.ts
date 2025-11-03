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
    const { invitation_id }: ApproveInvitationRequest = await req.json();

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

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .single();

    if (invitationError || !invitation) {
      console.error('Error fetching invitation:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invitación no encontrada' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create the user in auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.invitee_email,
      password: invitation.invitee_password,
      email_confirm: true,
      user_metadata: {
        name: invitation.invitee_name,
        inviter_id: invitation.inviter_id,
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return new Response(
        JSON.stringify({ error: 'Error al crear el usuario: ' + userError.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('User created successfully:', userData.user.email);

    // Update invitation status to approved
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({ status: 'approved' })
      .eq('id', invitation_id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario creado y invitación aprobada',
        user_id: userData.user.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in approve-invitation function:", error);
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
