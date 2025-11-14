import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { checkIPRateLimit, logIPAttempt, getClientIP } from '../_shared/ip-rate-limiter.ts';
import { checkSessionRateLimit, logSessionAttempt, generateSessionFingerprint, logSuspiciousActivity } from '../_shared/session-rate-limiter.ts';

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
    // Get client identifiers
    const clientIP = getClientIP(req);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const sessionId = generateSessionFingerprint(req, clientIP);
    
    // IP-based rate limiting (5 requests per 15 minutes)
    const ipRateLimitCheck = await checkIPRateLimit(
      clientIP,
      'verify-inviter-email',
      supabaseUrl,
      supabaseKey,
      { maxAttempts: 5, windowMinutes: 15 }
    );

    if (!ipRateLimitCheck.allowed) {
      console.warn(`IP rate limit exceeded: ${clientIP}`);
      await logSuspiciousActivity(
        clientIP,
        'verify-inviter-email',
        'IP rate limit exceeded',
        supabaseUrl,
        supabaseKey,
        { attempts: 5, window: '15min' }
      );
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.', exists: false }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Session-based rate limiting (3 requests per 15 minutes)
    const sessionRateLimitCheck = await checkSessionRateLimit(
      sessionId,
      'verify-inviter-email',
      supabaseUrl,
      supabaseKey,
      { maxAttempts: 3, windowMinutes: 15 }
    );

    if (!sessionRateLimitCheck.allowed) {
      console.warn(`Session rate limit exceeded: ${sessionId}`);
      await logSuspiciousActivity(
        sessionId,
        'verify-inviter-email',
        'Session rate limit exceeded',
        supabaseUrl,
        supabaseKey,
        { ip: clientIP, attempts: sessionRateLimitCheck.attempts, window: '15min' }
      );
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

    const emailExists = !!data;
    console.log('Inviter found:', emailExists ? 'yes' : 'no');

    // Log attempts for both IP and session tracking
    await Promise.all([
      logIPAttempt(clientIP, 'verify-inviter-email', supabaseUrl, supabaseKey),
      logSessionAttempt(sessionId, 'verify-inviter-email', supabaseUrl, supabaseKey, { 
        ip: clientIP,
        email_checked: normalizedEmail,
        exists: emailExists
      })
    ]);

    // Log suspicious activity if checking multiple emails that don't exist
    if (!emailExists && (sessionRateLimitCheck.attempts ?? 0) >= 2) {
      await logSuspiciousActivity(
        sessionId,
        'verify-inviter-email',
        'Multiple failed email verification attempts',
        supabaseUrl,
        supabaseKey,
        { 
          ip: clientIP,
          attempts: (sessionRateLimitCheck.attempts ?? 0) + 1,
          last_email: normalizedEmail
        }
      );
    }

    // Return boolean result with inviter data if exists
    // Data is needed for registration flow to work without RLS issues
    return new Response(
      JSON.stringify({ 
        exists: emailExists,
        inviter: emailExists ? data : null
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
