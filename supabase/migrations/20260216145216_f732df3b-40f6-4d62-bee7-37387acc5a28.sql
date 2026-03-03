
-- Table to store parsed survey responses
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES public.google_forms_config(id) ON DELETE CASCADE,
  response_timestamp timestamptz,
  respondent_name text,
  sex text,
  age integer,
  sector text,
  answers jsonb NOT NULL DEFAULT '{}',
  raw_row_index integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Allow all access (same pattern as other tables - no auth)
CREATE POLICY "Allow all access to survey_responses"
  ON public.survey_responses FOR ALL
  USING (true) WITH CHECK (true);

-- Index for fast queries by config
CREATE INDEX idx_survey_responses_config_id ON public.survey_responses(config_id);

-- Index for demographic queries
CREATE INDEX idx_survey_responses_demographics ON public.survey_responses(sex, sector);
