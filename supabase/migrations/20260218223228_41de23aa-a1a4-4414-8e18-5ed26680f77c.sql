
-- ============================================================
-- 1. ENUM de roles
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============================================================
-- 2. Tabela de roles (separada, nunca no perfil)
-- ============================================================
CREATE TABLE public.user_roles (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver apenas seu próprio role
CREATE POLICY "users_read_own_role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Apenas a service role (edge functions) pode inserir/alterar roles
CREATE POLICY "service_role_manage_roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. Função SECURITY DEFINER para checar role (evita recursão RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============================================================
-- 4. Corrigir RLS de google_forms_config (somente admin)
-- ============================================================
DROP POLICY IF EXISTS "Allow all access to google_forms_config" ON public.google_forms_config;

CREATE POLICY "admin_manage_google_forms_config"
  ON public.google_forms_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 5. Corrigir RLS de survey_responses (apenas leitura para autenticados, escrita apenas service role)
-- ============================================================
DROP POLICY IF EXISTS "Allow all access to survey_responses" ON public.survey_responses;

-- Qualquer usuário autenticado pode ler os dados do dashboard
CREATE POLICY "authenticated_read_survey_responses"
  ON public.survey_responses FOR SELECT
  TO authenticated
  USING (true);

-- Somente service role (edge functions de sync) pode escrever
CREATE POLICY "service_role_write_survey_responses"
  ON public.survey_responses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 6. Corrigir RLS de sync_logs (leitura para autenticados, escrita service role)
-- ============================================================
DROP POLICY IF EXISTS "Allow all access to sync_logs" ON public.sync_logs;

CREATE POLICY "authenticated_read_sync_logs"
  ON public.sync_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service_role_write_sync_logs"
  ON public.sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 7. Trigger para updated_at em google_forms_config (já existente, apenas garante)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_google_forms_config_updated_at'
  ) THEN
    CREATE TRIGGER update_google_forms_config_updated_at
      BEFORE UPDATE ON public.google_forms_config
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;
