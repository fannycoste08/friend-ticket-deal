import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminDeleteUserRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Manually decode JWT to extract user id (SDK getUser has been unreliable)
    let requesterId: string | null = null;
    try {
      const payloadPart = token.split('.')[1];
      const padded = payloadPart.padEnd(payloadPart.length + ((4 - (payloadPart.length % 4)) % 4), '=');
      const decoded = JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
      if (decoded?.sub) requesterId = decoded.sub;
    } catch (e) {
      console.error('Failed to decode JWT:', e);
    }

    if (!requesterId) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the requester is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requesterId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Unauthorized admin delete attempt by:', requesterId);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId }: AdminDeleteUserRequest = await req.json();

    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Prevent admin from deleting themselves through this endpoint
    if (userId === requesterId) {
      return new Response(
        JSON.stringify({ error: 'No puedes eliminar tu propia cuenta desde el panel admin' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Admin', requesterId, 'deleting user:', userId);

    // Delete all user data in correct order
    const tables = [
      { name: 'ticket_requests', filter: (q: any) => q.or(`requester_id.eq.${userId},seller_id.eq.${userId}`) },
      { name: 'tickets', filter: (q: any) => q.eq('user_id', userId) },
      { name: 'wanted_tickets', filter: (q: any) => q.eq('user_id', userId) },
      { name: 'friendships', filter: (q: any) => q.or(`user_id.eq.${userId},friend_id.eq.${userId}`) },
      { name: 'invitations', filter: (q: any) => q.eq('inviter_id', userId) },
      { name: 'email_logs', filter: (q: any) => q.eq('user_id', userId) },
      { name: 'user_roles', filter: (q: any) => q.eq('user_id', userId) },
      { name: 'profiles', filter: (q: any) => q.eq('id', userId) },
    ];

    for (const t of tables) {
      const { error } = await t.filter(supabaseAdmin.from(t.name).delete());
      if (error) {
        console.error(`Error deleting from ${t.name}:`, error);
        throw error;
      }
      console.log(`Deleted ${t.name} for user:`, userId);
    }

    // Finally, delete the auth user
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      throw deleteAuthError;
    }

    console.log('Successfully deleted user:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in admin-delete-user function:", error);
    return new Response(
      JSON.stringify({ error: 'Error al eliminar el usuario' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);