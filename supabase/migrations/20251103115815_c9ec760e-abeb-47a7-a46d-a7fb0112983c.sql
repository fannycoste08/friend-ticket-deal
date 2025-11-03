-- Modificar la tabla tickets
ALTER TABLE public.tickets 
  DROP COLUMN concert_name,
  ADD COLUMN city TEXT NOT NULL DEFAULT 'Madrid';

-- Cambiar el tipo de event_date a solo fecha (sin hora)
ALTER TABLE public.tickets 
  ALTER COLUMN event_date TYPE DATE USING event_date::DATE;