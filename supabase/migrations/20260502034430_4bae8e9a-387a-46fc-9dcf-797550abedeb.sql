
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Students table
CREATE TABLE public.siswa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  nisn TEXT NOT NULL UNIQUE,
  kelas TEXT NOT NULL,
  jurusan TEXT NOT NULL,
  tanggal_lahir DATE NOT NULL,
  status_lulus BOOLEAN NOT NULL DEFAULT true,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_siswa_nisn ON public.siswa(nisn);

ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;

-- Only admins can directly read/write siswa table.
-- Public lookup goes through the cek_kelulusan() function below (SECURITY DEFINER).
CREATE POLICY "Admins can do anything on siswa"
ON public.siswa FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- App settings (single row)
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  tanggal_pengumuman TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.app_settings (id, tanggal_pengumuman)
VALUES (1, now() + INTERVAL '7 days');

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
ON public.app_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can update settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public lookup function: returns student row only if NISN + tanggal_lahir match
-- AND announcement date has passed.
CREATE OR REPLACE FUNCTION public.cek_kelulusan(_nisn TEXT, _tanggal_lahir DATE)
RETURNS TABLE (
  nama TEXT,
  nisn TEXT,
  kelas TEXT,
  jurusan TEXT,
  tanggal_lahir DATE,
  status_lulus BOOLEAN,
  catatan TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _release TIMESTAMPTZ;
BEGIN
  SELECT tanggal_pengumuman INTO _release FROM public.app_settings WHERE id = 1;
  IF _release IS NULL OR now() < _release THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT s.nama, s.nisn, s.kelas, s.jurusan, s.tanggal_lahir, s.status_lulus, s.catatan
  FROM public.siswa s
  WHERE s.nisn = _nisn AND s.tanggal_lahir = _tanggal_lahir;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cek_kelulusan(TEXT, DATE) TO anon, authenticated;

-- Auto-grant 'admin' role to first signup, 'user' to subsequent signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
