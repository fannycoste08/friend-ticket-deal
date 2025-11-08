-- Remove password_hash field that should not be there
ALTER TABLE public.invitations 
DROP COLUMN IF EXISTS password_hash;