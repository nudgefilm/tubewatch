-- analysis_runs: 메뉴별 분석 실행 이력 (베이스 analysis_results와 별도)
-- channel_id = public.user_channels.id (앱 선택 채널 PK)

CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  channel_id uuid NOT NULL,
  analysis_type text NOT NULL CHECK (
    analysis_type IN (
      'base',
      'action_plan',
      'seo_lab',
      'benchmark',
      'next_trend'
    )
  ),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  input_snapshot_id text,
  result_snapshot_id text,
  error_message text
);

CREATE INDEX IF NOT EXISTS analysis_runs_user_channel_started_idx
  ON public.analysis_runs (user_id, channel_id, started_at DESC);

CREATE INDEX IF NOT EXISTS analysis_runs_channel_type_started_idx
  ON public.analysis_runs (channel_id, analysis_type, started_at DESC);

ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analysis_runs_select_own"
  ON public.analysis_runs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "analysis_runs_insert_own"
  ON public.analysis_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analysis_runs_update_own"
  ON public.analysis_runs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.analysis_runs IS 'TubeWatch 메뉴별 분석 run 이력; 결과 본문은 별도 저장소';
