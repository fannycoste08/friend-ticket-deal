-- Add foreign key to profiles table for wanted_tickets
ALTER TABLE public.wanted_tickets 
DROP CONSTRAINT IF EXISTS wanted_tickets_user_id_fkey;

ALTER TABLE public.wanted_tickets
ADD CONSTRAINT wanted_tickets_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;