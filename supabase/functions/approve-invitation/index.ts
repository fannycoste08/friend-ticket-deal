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

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === invitation.invitee_email);
    
    let userId: string;

    if (existingUser) {
      console.log('User already exists, using existing user:', existingUser.email);
      userId = existingUser.id;
      
      // Update user metadata if needed
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          name: invitation.invitee_name,
          inviter_id: invitation.inviter_id,
        }
      });
    } else {
      // Generate a temporary password for the user
      const tempPassword = crypto.randomUUID();
      
      // Create the user in auth.users with temp password
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: invitation.invitee_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: invitation.invitee_name,
          inviter_id: invitation.inviter_id,
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        return new Response(
          JSON.stringify({ error: 'User creation failed' }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log('User created successfully with temp password:', userData.user.email);
      userId = userData.user.id;
      
      // Send password reset email so user can set their own password
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        invitation.invitee_email,
        {
          redirectTo: `${Deno.env.get('SUPABASE_URL')}/reset-password`
        }
      );
      
      if (resetError) {
        console.error('Error sending password reset email:', resetError);
      }
    }

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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario creado y invitación aprobada. Se ha enviado un email para establecer contraseña.',
        user_id: userId,
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
