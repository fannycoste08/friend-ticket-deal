
-- Create a table for admin documentation
CREATE TABLE public.admin_docs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_docs ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view docs"
ON public.admin_docs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert
CREATE POLICY "Admins can create docs"
ON public.admin_docs FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update docs"
ON public.admin_docs FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete docs"
ON public.admin_docs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_admin_docs_updated_at
BEFORE UPDATE ON public.admin_docs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
