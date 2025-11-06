import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateEmail, validateName, validatePassword, sanitizeString } from '../_shared/validation.ts';
import { checkIPRateLimit, logIPAttempt, getClientIP } from '../_shared/ip-rate-limiter.ts';

// Helper to check if user is admin
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .single();
  
  return !error && data !== null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetFounderRequest {
  email: string;
  password: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // IP-based rate limiting (3 attempts per hour)
    const clientIP = getClientIP(req);
    const rateLimitCheck = await checkIPRateLimit(
      clientIP,
      'reset-founder',
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!rateLimitCheck.allowed) {
      console.warn('Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: rateLimitCheck.error }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Log this attempt
    await logIPAttempt(
      clientIP,
      'reset-founder',
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
    
    // Verify the user is authenticated
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user is admin
    const hasAdminRole = await isAdmin(supabase, user.id);
    if (!hasAdminRole) {
      console.error('Unauthorized access attempt by user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, password, name }: ResetFounderRequest = await req.json();

    // Input validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      console.error('Email validation failed');
      return new Response(
        JSON.stringify({ error: 'Invalid input provided' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      console.error('Name validation failed');
      return new Response(
        JSON.stringify({ error: 'Invalid input provided' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.error('Password validation failed');
      return new Response(
        JSON.stringify({ error: 'Invalid input provided' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeString(email.toLowerCase());
    const sanitizedName = sanitizeString(name);

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

    // First, try to find the user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === sanitizedEmail);

    if (existingUser) {
      // Delete existing user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error('Error deleting user:', deleteError);
      } else {
        console.log('Deleted existing user:', sanitizedEmail);
      }
    }

    // Create new founder user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: sanitizedName
      }
    });

    if (userError) {
      console.error('Error creating founder user:', userError);
      return new Response(
        JSON.stringify({ error: 'User creation failed' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('Founder user created successfully:', userData.user.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario fundador creado correctamente',
        email: sanitizedEmail,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in reset-founder function:", error);
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
