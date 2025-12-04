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

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === invitation.invitee_email);

    let passwordResetLink = '';
    
    // Get the app URL from environment or use a default
    const appUrl = 'https://friend-ticket-deal.lovable.app';
    const redirectUrl = `${appUrl}/create-password`;

    if (userExists) {
      console.log('User already exists, generating password setup link');
      // User already exists, generate a recovery link WITHOUT sending the default email
      const { data: resetLinkData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: invitation.invitee_email
      });

      if (resetError) {
        console.error('Error generating password setup link:', resetError);
      } else {
        // Modify the action link to redirect to our custom page
        const originalLink = resetLinkData?.properties?.action_link || '';
        if (originalLink) {
          const url = new URL(originalLink);
          url.searchParams.set('redirect_to', redirectUrl);
          passwordResetLink = url.toString();
        }
      }
    } else {
      console.log('Creating new user account');
      // Create user account now that invitation is approved
      const tempPassword = crypto.randomUUID();
      
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: invitation.invitee_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: invitation.invitee_name,
          inviter_email: user.email,
        }
      });

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        // Revert invitation status if user creation fails
        await supabaseAdmin
          .from('invitations')
          .update({ status: 'pending' })
          .eq('id', invitation_id);
        
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log('User account created:', newUser.user?.id);

      // Generate recovery link WITHOUT sending the default email
      const { data: resetLinkData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: invitation.invitee_email
      });

      if (resetError) {
        console.error('Error generating password setup link:', resetError);
      } else {
        // Modify the action link to redirect to our custom page
        const originalLink = resetLinkData?.properties?.action_link || '';
        if (originalLink) {
          const url = new URL(originalLink);
          url.searchParams.set('redirect_to', redirectUrl);
          passwordResetLink = url.toString();
        }
      }
    }

    console.log('Generated password reset link:', passwordResetLink ? 'YES' : 'NO');

    // Send acceptance notification email with password reset link
    // Pass the auth header so send-invitation-accepted can verify the caller
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-invitation-accepted', {
      body: {
        invitation_id: invitation_id,
        password_reset_link: passwordResetLink
      },
      headers: {
        Authorization: authHeader
      }
    });

    if (emailError) {
      console.error('Error sending acceptance email:', emailError);
      // Don't fail the approval if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitación aprobada. Se ha enviado un email al usuario para establecer su contraseña.',
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
