import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface SessionRateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
}

const DEFAULT_CONFIG: SessionRateLimitConfig = {
  maxAttempts: 3,
  windowMinutes: 15
};

/**
 * Generate a session fingerprint from request headers
 * Uses a combination of IP, User-Agent, and other identifiers
 */
export function generateSessionFingerprint(req: Request, ipAddress: string): string {
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const acceptLanguage = req.headers.get('accept-language') || 'unknown';
  
  // Create a simple hash-like fingerprint
  const fingerprint = `${ipAddress}:${userAgent}:${acceptLanguage}`;
  
  // Simple hash function to create a shorter identifier
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `session_${Math.abs(hash).toString(36)}`;
}

/**
 * Check if a session has exceeded rate limits for a specific function
 */
export async function checkSessionRateLimit(
  sessionId: string,
  functionName: string,
  supabaseUrl: string,
  supabaseKey: string,
  config: SessionRateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; error?: string; attempts?: number }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Calculate time window
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);

  // Check attempts from this session in the time window
  const { data, error } = await supabase
    .from('session_rate_limits')
    .select('id')
    .eq('session_id', sessionId)
    .eq('function_name', functionName)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Error checking session rate limit:', error);
    return { allowed: true }; // Fail open to not block legitimate requests
  }

  const attemptCount = data?.length || 0;

  if (attemptCount >= config.maxAttempts) {
    return {
      allowed: false,
      attempts: attemptCount,
      error: `Session rate limit exceeded. Maximum ${config.maxAttempts} attempts per ${config.windowMinutes} minutes.`
    };
  }

  return { allowed: true, attempts: attemptCount };
}

/**
 * Log a session rate limit attempt
 */
export async function logSessionAttempt(
  sessionId: string,
  functionName: string,
  supabaseUrl: string,
  supabaseKey: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from('session_rate_limits')
    .insert({
      session_id: sessionId,
      function_name: functionName,
      metadata: metadata || {}
    });

  if (error) {
    console.error('Error logging session attempt:', error);
  }
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  identifier: string,
  functionName: string,
  reason: string,
  supabaseUrl: string,
  supabaseKey: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from('suspicious_activity_log')
    .insert({
      identifier,
      function_name: functionName,
      reason,
      metadata: metadata || {}
    });

  if (error) {
    console.error('Error logging suspicious activity:', error);
  }
  
  console.warn(`🚨 SUSPICIOUS ACTIVITY: ${reason}`, {
    identifier,
    functionName,
    metadata
  });
}
