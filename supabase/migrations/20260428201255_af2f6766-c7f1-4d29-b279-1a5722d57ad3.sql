-- Remove sensitive tables from realtime publication to prevent broadcasting
-- of invitee_email and other PII to any authenticated subscriber.
-- Realtime currently does not enforce table-level RLS on broadcasts, so the
-- safest fix is to stop publishing these tables at all.

ALTER PUBLICATION supabase_realtime DROP TABLE public.invitations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.wanted_tickets;