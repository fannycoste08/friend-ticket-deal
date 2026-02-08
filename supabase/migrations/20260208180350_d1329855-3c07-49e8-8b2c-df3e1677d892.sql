
CREATE TABLE public.admin_outreach (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  written BOOLEAN NOT NULL DEFAULT false,
  replied BOOLEAN NOT NULL DEFAULT false,
  comments TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view outreach" ON public.admin_outreach
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create outreach" ON public.admin_outreach
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update outreach" ON public.admin_outreach
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete outreach" ON public.admin_outreach
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_outreach_updated_at
  BEFORE UPDATE ON public.admin_outreach
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
