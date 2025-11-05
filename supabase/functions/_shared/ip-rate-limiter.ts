import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface IPRateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
}

const DEFAULT_CONFIG: IPRateLimitConfig = {
  maxAttempts: 3,
  windowMinutes: 60
};

/**
 * Check if an IP address has exceeded rate limits for a specific function
 * This prevents abuse from unauthenticated requests
 */
export async function checkIPRateLimit(
  ipAddress: string,
  functionName: string,
  supabaseUrl: string,
  supabaseKey: string,
  config: IPRateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Calculate time window
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  // Check attempts from this IP in the time window
  const { data, error } = await supabase
    .from('ip_rate_limits')
    .select('id')
    .eq('ip_address', ipAddress)
    .eq('function_name', functionName)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Error checking IP rate limit:', error);
    return { allowed: true }; // Fail open to not block legitimate requests
  }

  const attemptCount = data?.length || 0;

  if (attemptCount >= config.maxAttempts) {
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${config.maxAttempts} attempts per ${config.windowMinutes} minutes.`
    };
  }

  return { allowed: true };
}

/**
 * Log an IP rate limit attempt
 */
export async function logIPAttempt(
  ipAddress: string,
  functionName: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from('ip_rate_limits')
    .insert({
      ip_address: ipAddress,
      function_name: functionName
    });

  if (error) {
    console.error('Error logging IP attempt:', error);
  }
}

/**
 * Get client IP from request
 */
export function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}
