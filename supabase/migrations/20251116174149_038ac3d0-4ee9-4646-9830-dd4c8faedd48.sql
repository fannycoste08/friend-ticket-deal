-- Update function to delete expired tickets and wanted tickets
CREATE OR REPLACE FUNCTION public.delete_expired_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete expired tickets
  DELETE FROM public.tickets
  WHERE event_date < CURRENT_DATE;
  
  -- Delete expired wanted tickets
  DELETE FROM public.wanted_tickets
  WHERE event_date < CURRENT_DATE;
  
  RAISE LOG 'Deleted expired tickets and wanted tickets older than %', CURRENT_DATE;
END;
$$;