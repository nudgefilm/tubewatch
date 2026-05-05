-- user_channels 테이블에 channel_handle 컬럼 추가
-- YouTube snippet.customUrl 값 저장 (e.g. @심리_톡톡)
ALTER TABLE user_channels
  ADD COLUMN IF NOT EXISTS channel_handle TEXT;
