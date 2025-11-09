-- Create wanted_tickets table
CREATE TABLE public.wanted_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist TEXT NOT NULL,
  city TEXT NOT NULL,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wanted_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: usuarios pueden ver wanted_tickets de su red extendida
CREATE POLICY "Users can view wanted tickets in their extended network"
ON public.wanted_tickets
FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT network_user_id 
    FROM public.get_extended_network(auth.uid())
  )
);

CREATE POLICY "Users can create their own wanted tickets"
ON public.wanted_tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wanted tickets"
ON public.wanted_tickets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wanted tickets"
ON public.wanted_tickets
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_wanted_tickets_updated_at
BEFORE UPDATE ON public.wanted_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.wanted_tickets;