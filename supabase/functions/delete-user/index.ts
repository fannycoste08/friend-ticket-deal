import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get and verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user is authenticated using service role key for robust token verification
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { userId }: DeleteUserRequest = await req.json();

    // Only allow users to delete their own account
    if (userId !== user.id) {
      console.error('User attempting to delete different account:', { userId, authenticatedUser: user.id });
      return new Response(
        JSON.stringify({ error: 'You can only delete your own account' }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

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

    console.log('Starting account deletion for user:', userId);

    // Delete all user data in the correct order (respecting foreign keys)
    
    // 1. Delete ticket requests (as requester or seller)
    const { error: ticketRequestsError } = await supabaseAdmin
      .from('ticket_requests')
      .delete()
      .or(`requester_id.eq.${userId},seller_id.eq.${userId}`);
    
    if (ticketRequestsError) {
      console.error('Error deleting ticket requests:', ticketRequestsError);
      throw ticketRequestsError;
    }
    console.log('Deleted ticket requests for user:', userId);

    // 4. Delete tickets
    const { error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .delete()
      .eq('user_id', userId);
    
    if (ticketsError) {
      console.error('Error deleting tickets:', ticketsError);
      throw ticketsError;
    }
    console.log('Deleted tickets for user:', userId);

    // 5. Delete wanted tickets
    const { error: wantedTicketsError } = await supabaseAdmin
      .from('wanted_tickets')
      .delete()
      .eq('user_id', userId);
    
    if (wantedTicketsError) {
      console.error('Error deleting wanted tickets:', wantedTicketsError);
      throw wantedTicketsError;
    }
    console.log('Deleted wanted tickets for user:', userId);

    // 6. Delete friendships (in both directions)
    const { error: friendshipsError } = await supabaseAdmin
      .from('friendships')
      .delete()
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    
    if (friendshipsError) {
      console.error('Error deleting friendships:', friendshipsError);
      throw friendshipsError;
    }
    console.log('Deleted friendships for user:', userId);

    // 7. Delete invitations (as inviter)
    const { error: invitationsError } = await supabaseAdmin
      .from('invitations')
      .delete()
      .eq('inviter_id', userId);
    
    if (invitationsError) {
      console.error('Error deleting invitations:', invitationsError);
      throw invitationsError;
    }
    console.log('Deleted invitations for user:', userId);

    // 8. Delete email logs
    const { error: emailLogsError } = await supabaseAdmin
      .from('email_logs')
      .delete()
      .eq('user_id', userId);
    
    if (emailLogsError) {
      console.error('Error deleting email logs:', emailLogsError);
      throw emailLogsError;
    }
    console.log('Deleted email logs for user:', userId);

    // 9. Delete user roles
    const { error: userRolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (userRolesError) {
      console.error('Error deleting user roles:', userRolesError);
      throw userRolesError;
    }
    console.log('Deleted user roles for user:', userId);

    // 10. Delete profile (this will cascade to other tables due to foreign keys)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
      throw profileError;
    }
    console.log('Deleted profile for user:', userId);

    // 11. Finally, delete the auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      throw deleteAuthError;
    }
    console.log('Deleted auth user:', userId);

    console.log('Successfully deleted all data for user:', userId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cuenta eliminada correctamente',
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ error: 'Error al eliminar la cuenta' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
