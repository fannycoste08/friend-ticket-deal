-- Add password field to invitations table to store the user's chosen password
ALTER TABLE public.invitations 
ADD COLUMN password_hash text;