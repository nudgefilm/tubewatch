-- Batch 2: user_channels에 채널 설명 및 개설일 컬럼 추가
-- getChannelInfo()에서 수집한 description, published_at을 저장하기 위한 컬럼

ALTER TABLE user_channels
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;
