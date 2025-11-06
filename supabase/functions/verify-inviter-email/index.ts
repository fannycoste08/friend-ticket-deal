import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkIPRateLimit, logIPAttempt, getClientIP } from '../_shared/ip-rate-limiter.ts';

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
    // IP-based rate limiting (20 requests per 15 minutes)
    const clientIP = getClientIP(req);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const rateLimitCheck = await checkIPRateLimit(
      clientIP,
      'verify-inviter-email',
      supabaseUrl,
      supabaseKey,
      { maxAttempts: 20, windowMinutes: 15 }
    );

    if (!rateLimitCheck.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.', exists: false }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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

    // Search for the email (case-insensitive)
    const normalizedEmail = email.trim().toLowerCase();
    console.log('Verifying inviter email:', normalizedEmail);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Error verifying inviter email:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', exists: false }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Inviter found:', data ? 'yes' : 'no');

    // Log successful attempt
    await logIPAttempt(clientIP, 'verify-inviter-email', supabaseUrl, supabaseKey);

    // Only return existence status and basic info, no email
    return new Response(
      JSON.stringify({ 
        exists: !!data,
        inviter: data ? { id: data.id, name: data.name } : null
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-inviter-email function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', exists: false }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
