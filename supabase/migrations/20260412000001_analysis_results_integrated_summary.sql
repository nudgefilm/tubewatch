-- 통합요약 DB 캐시 컬럼 추가
-- 동일 analysis_results 레코드 기준으로 통합요약을 고정 저장한다.
-- 채널 재분석 시 새 레코드가 생성되므로 이 컬럼은 NULL이 되어 자동 리셋된다.
ALTER TABLE analysis_results
  ADD COLUMN IF NOT EXISTS integrated_summary TEXT NULL;

COMMENT ON COLUMN analysis_results.integrated_summary IS
  'AI 통합요약 캐시. 최초 생성 후 DB에 저장되며 재분석 전까지 동일 값을 반환한다.';
