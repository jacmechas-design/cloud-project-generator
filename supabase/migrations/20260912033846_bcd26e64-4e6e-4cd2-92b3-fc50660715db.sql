CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  image_url TEXT,
  assigned_to UUID[] NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workers TO anon, authenticated;
GRANT ALL ON public.workers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO anon, authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can manage workers" ON public.workers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage tasks" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;

INSERT INTO public.workers (name, avatar_url) VALUES
  ('Carlos Pérez', 'https://api.dicebear.com/7.x/bottts/svg?seed=Carlos'),
  ('Ana Gómez', 'https://api.dicebear.com/7.x/bottts/svg?seed=Ana'),
  ('Luis Martínez', 'https://api.dicebear.com/7.x/bottts/svg?seed=Luis');

INSERT INTO public.tasks (title, description, priority, status, image_url, assigned_to)
VALUES
  ('Inspeccionar tablero eléctrico principal', 'Medir voltajes de entrada y revisar interruptores de seguridad.', 'high', 'pending', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', ARRAY(SELECT id FROM public.workers WHERE name = 'Carlos Pérez')),
  ('Limpieza de área de empaque', 'Desinfectar mesa central y ordenar insumos.', 'medium', 'pending', NULL, '{}');