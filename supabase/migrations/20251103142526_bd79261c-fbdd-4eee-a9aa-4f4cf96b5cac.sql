-- Fix the security definer view issue by recreating it as SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker=true)
AS
SELECT id, name, created_at
FROM public.profiles;