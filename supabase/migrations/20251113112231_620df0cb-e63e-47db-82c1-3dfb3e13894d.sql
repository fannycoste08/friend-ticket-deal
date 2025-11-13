-- Enable RLS on session_rate_limits table
-- This table is managed by edge functions only, no direct user access needed
ALTER TABLE public.session_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies needed - edge functions use service role key
-- Users should never directly access rate limit tables

-- Enable RLS on suspicious_activity_log table
-- This table is managed by edge functions only, no direct user access needed
ALTER TABLE public.suspicious_activity_log ENABLE ROW LEVEL SECURITY;

-- No policies needed - edge functions use service role key
-- Only admins should be able to query this table for security monitoring

-- Add RLS policy for admins to view suspicious activity (optional, for future admin dashboard)
CREATE POLICY "Admins can view all suspicious activity"
ON public.suspicious_activity_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.session_rate_limits IS 'Rate limiting table - managed by edge functions with service role key. No direct user access.';
COMMENT ON TABLE public.suspicious_activity_log IS 'Security monitoring table - managed by edge functions. Admin-only access for security review.';
