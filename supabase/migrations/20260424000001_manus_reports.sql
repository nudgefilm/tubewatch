-- manus_reports: Manus API로 생성된 종합 채널 분석 리포트
CREATE TABLE manus_reports (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_channel_id   uuid REFERENCES user_channels(id) ON DELETE CASCADE NOT NULL,
  snapshot_id       text NOT NULL,          -- analysis_results.id
  year_month        text NOT NULL,          -- 'YYYY-MM' (월 1회 제한 키)
  manus_task_id     text UNIQUE,
  manus_project_id  text,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  access_token      text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  result_json       jsonb,
  error_message     text,
  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_channel_id, year_month)      -- 채널당 월 1회 제한
);

-- manus_config: project_id 등 설정값 저장 (단일 키-값)
CREATE TABLE manus_config (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_manus_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER manus_reports_updated_at
  BEFORE UPDATE ON manus_reports
  FOR EACH ROW EXECUTE FUNCTION update_manus_reports_updated_at();

-- 인덱스
CREATE INDEX manus_reports_user_id_idx        ON manus_reports (user_id);
CREATE INDEX manus_reports_access_token_idx   ON manus_reports (access_token);
CREATE INDEX manus_reports_manus_task_id_idx  ON manus_reports (manus_task_id);

-- RLS
ALTER TABLE manus_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE manus_config  ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 리포트만 조회 가능
CREATE POLICY "users_read_own_reports"
  ON manus_reports FOR SELECT
  USING (auth.uid() = user_id);

-- access_token으로 비인증 접근 허용 (공유 링크용) — 함수로 처리
-- Service role은 RLS 우회하여 webhook 업데이트 처리
