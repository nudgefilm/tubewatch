-- access_token을 16자(8바이트)로 단축
-- 기존 레코드: 앞 16자로 잘라서 업데이트
-- 신규 레코드: DEFAULT를 8바이트로 변경

ALTER TABLE manus_reports
  ALTER COLUMN access_token SET DEFAULT encode(gen_random_bytes(8), 'hex');

-- 기존 행 일괄 단축 (충돌 없이 안전하게)
UPDATE manus_reports
SET access_token = LEFT(access_token, 16)
WHERE LENGTH(access_token) > 16;
