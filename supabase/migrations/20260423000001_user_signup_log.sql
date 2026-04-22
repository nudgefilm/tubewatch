-- user_signup_log: 신규 회원 가입/탈퇴/분석 이력 아카이브
-- auth.users FK 없음 — 탈퇴 후에도 레코드 영구 보존
-- 최대 100건 유지, 초과 시 오래된 레코드 자동 삭제

CREATE TABLE IF NOT EXISTS public.user_signup_log (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid,                       -- FK 없음: 탈퇴 후에도 유지
  email                  text,
  channel_title          text,                       -- 첫 번째 등록 채널명
  joined_at              timestamptz,
  withdrawn_at           timestamptz,
  analysis_success_count integer     NOT NULL DEFAULT 0,
  analysis_failure_count integer     NOT NULL DEFAULT 0,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_signup_log_user_id
  ON public.user_signup_log(user_id);

CREATE INDEX IF NOT EXISTS idx_user_signup_log_joined_at
  ON public.user_signup_log(joined_at DESC NULLS LAST);

ALTER TABLE public.user_signup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all"
  ON public.user_signup_log FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ─── Trigger 1: 신규 회원 가입 시 로그 생성 ────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user_signup_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.user_signup_log (user_id, email, joined_at)
    VALUES (NEW.id, NEW.email, NEW.created_at)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING '[handle_new_user_signup_log] failed for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_signup_log
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup_log();

-- ─── Trigger 2: analysis_results 성공 카운트 ───────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_analysis_result_signup_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.gemini_status = 'completed' THEN
    UPDATE public.user_signup_log
    SET analysis_success_count = analysis_success_count + 1,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  ELSIF NEW.gemini_status = 'failed' THEN
    UPDATE public.user_signup_log
    SET analysis_failure_count = analysis_failure_count + 1,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_analysis_result_signup_log
  AFTER INSERT ON public.analysis_results
  FOR EACH ROW EXECUTE PROCEDURE public.handle_analysis_result_signup_log();

-- ─── Trigger 3: analysis_jobs 실패 카운트 (YouTube/Gemini 실패 등) ─────────

CREATE OR REPLACE FUNCTION public.handle_analysis_job_failure_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'failed' AND (OLD.status IS DISTINCT FROM 'failed') THEN
    UPDATE public.user_signup_log
    SET analysis_failure_count = analysis_failure_count + 1,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_analysis_job_failure_signup_log
  AFTER UPDATE ON public.analysis_jobs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_analysis_job_failure_log();

-- ─── Trigger 4: 첫 채널 등록 시 channel_title 반영 ────────────────────────

CREATE OR REPLACE FUNCTION public.handle_user_channel_signup_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_signup_log
  SET channel_title = COALESCE(channel_title, NEW.channel_title),
      updated_at    = now()
  WHERE user_id = NEW.user_id
    AND channel_title IS NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_channel_signup_log
  AFTER INSERT ON public.user_channels
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_channel_signup_log();

-- ─── Trigger 5: 100건 초과 시 가장 오래된 레코드 자동 삭제 ────────────────

CREATE OR REPLACE FUNCTION public.prune_user_signup_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_signup_log
  WHERE id IN (
    SELECT id
    FROM   public.user_signup_log
    ORDER  BY joined_at DESC NULLS LAST
    OFFSET 100
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_signup_log_prune
  AFTER INSERT ON public.user_signup_log
  FOR EACH ROW EXECUTE PROCEDURE public.prune_user_signup_log();

-- ─── 기존 회원 백필 (최신 100명, joined_at DESC) ──────────────────────────

INSERT INTO public.user_signup_log (user_id, email, joined_at)
SELECT id, email, created_at
FROM   auth.users
ORDER  BY created_at DESC
LIMIT  100
ON CONFLICT (user_id) DO NOTHING;

-- 첫 등록 채널명 반영
UPDATE public.user_signup_log ual
SET    channel_title = (
         SELECT channel_title
         FROM   public.user_channels uc
         WHERE  uc.user_id = ual.user_id
         ORDER  BY uc.created_at ASC
         LIMIT  1
       )
WHERE  ual.channel_title IS NULL;

-- 분석 성공/실패 카운트 반영
UPDATE public.user_signup_log ual
SET    analysis_success_count = (
         SELECT COUNT(*)::integer
         FROM   public.analysis_results ar
         WHERE  ar.user_id = ual.user_id
           AND  ar.gemini_status = 'completed'
       ),
       analysis_failure_count = (
         SELECT COUNT(*)::integer
         FROM   public.analysis_jobs aj
         WHERE  aj.user_id = ual.user_id
           AND  aj.status = 'failed'
       )
WHERE  ual.user_id IS NOT NULL;
