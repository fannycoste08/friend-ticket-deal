-- Create session_rate_limits table for session-based rate limiting
CREATE TABLE IF NOT EXISTS public.session_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  function_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_session_rate_limits_lookup 
ON public.session_rate_limits(session_id, function_name, created_at DESC);

-- Create suspicious_activity_log table for security monitoring
CREATE TABLE IF NOT EXISTS public.suspicious_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  function_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for security monitoring queries
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_lookup 
ON public.suspicious_activity_log(identifier, function_name, created_at DESC);

-- Create index for recent suspicious activity monitoring
CREATE INDEX IF NOT EXISTS idx_suspicious_activity_recent 
ON public.suspicious_activity_log(created_at DESC);

-- Add comment explaining the tables
COMMENT ON TABLE public.session_rate_limits IS 'Tracks rate limiting based on session fingerprints to prevent abuse';
COMMENT ON TABLE public.suspicious_activity_log IS 'Logs suspicious activity patterns for security monitoring';
