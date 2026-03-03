-- Allow all authenticated users to READ google_forms_config
CREATE POLICY "authenticated_read_google_forms_config"
ON public.google_forms_config
FOR SELECT
TO authenticated
USING (true);