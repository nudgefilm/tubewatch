-- analysis_module_results: started_at null 레거시 데이터 정리
-- started_at 기록 로직 도입 전에 생성된 completed row에 한해
-- analyzed_at 값으로 채워서 무결성 확보

UPDATE analysis_module_results
SET started_at = analyzed_at
WHERE started_at IS NULL
  AND analyzed_at IS NOT NULL
  AND status = 'completed';
