-- Create email_logs table for rate limiting
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  function_name TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view their own email logs"
ON public.email_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own email logs (system will use this)
CREATE POLICY "Users can insert their own email logs"
ON public.email_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for efficient rate limiting queries
CREATE INDEX idx_email_logs_user_sent ON public.email_logs(user_id, sent_at DESC);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email, sent_at DESC);

-- Add UPDATE policy for conversations table
CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id)
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);