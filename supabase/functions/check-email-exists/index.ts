import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkIPRateLimit, logIPAttempt, getClientIP } from '../_shared/ip-rate-limiter.ts';
import { checkSessionRateLimit, logSessionAttempt, generateSessionFingerprint, logSuspiciousActivity } from '../_shared/session-rate-limiter.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
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
      'check-email-exists',
      supabaseUrl,
      supabaseKey,
      { maxAttempts: 5, windowMinutes: 15 }
    );

    if (!ipRateLimitCheck.allowed) {
      console.warn(`IP rate limit exceeded for check-email-exists: ${clientIP}`);
      await logSuspiciousActivity(
        clientIP,
        'check-email-exists',
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
      'check-email-exists',
      supabaseUrl,
      supabaseKey,
      { maxAttempts: 3, windowMinutes: 15 }
    );

    if (!sessionRateLimitCheck.allowed) {
      console.warn(`Session rate limit exceeded for check-email-exists: ${sessionId}`);
      await logSuspiciousActivity(
        sessionId,
        'check-email-exists',
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

    const { email }: CheckEmailRequest = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Email is required", exists: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format", exists: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if email exists in profiles table
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("Error checking email:", error);
      return new Response(
        JSON.stringify({ error: "Error checking email", exists: false }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailExists = !!profile;

    // Log attempts for both IP and session tracking
    await Promise.all([
      logIPAttempt(clientIP, 'check-email-exists', supabaseUrl, supabaseKey),
      logSessionAttempt(sessionId, 'check-email-exists', supabaseUrl, supabaseKey, { 
        ip: clientIP,
        email_checked: normalizedEmail,
        exists: emailExists
      })
    ]);

    // Log suspicious activity if checking multiple emails that don't exist
    if (!emailExists && (sessionRateLimitCheck.attempts ?? 0) >= 2) {
      await logSuspiciousActivity(
        sessionId,
        'check-email-exists',
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

    // Only return whether email exists, no other details
    return new Response(
      JSON.stringify({ exists: emailExists }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in check-email-exists function:", error);
    return new Response(
      JSON.stringify({ error: error.message, exists: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
