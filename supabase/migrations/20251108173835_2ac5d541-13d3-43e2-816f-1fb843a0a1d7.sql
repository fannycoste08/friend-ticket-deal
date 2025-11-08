-- Create function to delete expired tickets
CREATE OR REPLACE FUNCTION public.delete_expired_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.tickets
  WHERE event_date < CURRENT_DATE;
  
  RAISE LOG 'Deleted expired tickets older than %', CURRENT_DATE;
END;
$function$;