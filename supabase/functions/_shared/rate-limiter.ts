import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface RateLimitConfig {
  maxEmailsPerHour: number;
  cooldownMinutes: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxEmailsPerHour: 10,
  cooldownMinutes: 5,
};

export async function checkRateLimit(
  userId: string,
  recipientEmail: string,
  functionName: string,
  supabaseUrl: string,
  supabaseKey: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check per-user hourly limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: hourlyCount, error: hourlyError } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('sent_at', oneHourAgo);

  if (hourlyError) {
    console.error('Error checking hourly rate limit:', hourlyError);
    return { allowed: false, error: 'Unable to verify rate limit' };
  }

  if (hourlyCount && hourlyCount >= config.maxEmailsPerHour) {
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${config.maxEmailsPerHour} emails per hour.`,
    };
  }

  // Check cooldown period for same recipient
  const cooldownTime = new Date(Date.now() - config.cooldownMinutes * 60 * 1000).toISOString();
  const { data: recentToRecipient, error: cooldownError } = await supabase
    .from('email_logs')
    .select('sent_at')
    .eq('user_id', userId)
    .eq('recipient_email', recipientEmail)
    .gte('sent_at', cooldownTime)
    .limit(1);

  if (cooldownError) {
    console.error('Error checking cooldown:', cooldownError);
    return { allowed: false, error: 'Unable to verify cooldown period' };
  }

  if (recentToRecipient && recentToRecipient.length > 0) {
    return {
      allowed: false,
      error: `Please wait ${config.cooldownMinutes} minutes before sending another email to this recipient.`,
    };
  }

  return { allowed: true };
}

export async function logEmail(
  userId: string,
  recipientEmail: string,
  functionName: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase.from('email_logs').insert({
    user_id: userId,
    recipient_email: recipientEmail,
    function_name: functionName,
  });

  if (error) {
    console.error('Error logging email send:', error);
  }
}
