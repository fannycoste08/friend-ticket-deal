import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateEmail } from '../_shared/validation.ts';

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
    const { inviter_id, invitee_email, invitee_name } = await req.json();

    // Validate inputs
    if (!inviter_id || !invitee_email || !invitee_name) {
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
    console.log('Creating invitation request for:', normalizedEmail);

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
        inviter_id,
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
