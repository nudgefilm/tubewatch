-- 1. user_channels: 채널 수 제한 DB 트리거 제거
--    (앱 레이어에서 플랜 기반 제한을 처리하므로 DB 트리거는 불필요)
--    user_channels 테이블은 Supabase 콘솔에서 직접 생성되었으며,
--    콘솔에서 추가된 트리거가 supabaseAdmin(service_role) INSERT도 막을 수 있음.
--    (service_role은 RLS만 우회하며, DB 트리거는 우회하지 않음)

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
      AND event_object_table  = 'user_channels'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.user_channels', r.trigger_name);
    RAISE NOTICE 'Dropped trigger % on user_channels', r.trigger_name;
  END LOOP;
END $$;

-- 2. channel_change_log.added_channel_id: NOT NULL → nullable
--    DELETE 핸들러에서 단순 삭제(교체 없는) 시 null 삽입 허용
ALTER TABLE public.channel_change_log
  ALTER COLUMN added_channel_id DROP NOT NULL;
