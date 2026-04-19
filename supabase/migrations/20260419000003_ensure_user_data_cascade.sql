-- user_channels: user_id → auth.users(id) ON DELETE CASCADE 보장
--
-- user_channels는 초기 마이그레이션 파일 없이 생성된 테이블로,
-- FK CASCADE 여부가 불확실하므로 이 마이그레이션으로 명시적으로 보장한다.
-- 유저 탈퇴(auth.users 삭제) 시 채널 데이터도 자동 삭제되어야 재가입 시 완전한 신규 상태가 된다.

DO $$
DECLARE
  v_constraint text;
  v_has_cascade boolean;
BEGIN
  -- 기존 FK 확인 (user_channels.user_id → auth.users)
  SELECT tc.constraint_name,
         rc.delete_rule = 'CASCADE'
  INTO   v_constraint, v_has_cascade
  FROM   information_schema.table_constraints     tc
  JOIN   information_schema.key_column_usage      kcu
         ON  tc.constraint_name = kcu.constraint_name
         AND tc.table_schema    = kcu.table_schema
  JOIN   information_schema.referential_constraints rc
         ON  tc.constraint_name = rc.constraint_name
  WHERE  tc.constraint_type = 'FOREIGN KEY'
    AND  tc.table_schema    = 'public'
    AND  tc.table_name      = 'user_channels'
    AND  kcu.column_name    = 'user_id'
  LIMIT 1;

  IF v_constraint IS NULL THEN
    -- FK 자체가 없는 경우: 새로 추가
    ALTER TABLE public.user_channels
      ADD CONSTRAINT user_channels_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

  ELSIF NOT v_has_cascade THEN
    -- FK는 있지만 CASCADE 없는 경우: 교체
    EXECUTE format('ALTER TABLE public.user_channels DROP CONSTRAINT %I', v_constraint);
    ALTER TABLE public.user_channels
      ADD CONSTRAINT user_channels_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  -- CASCADE가 이미 있는 경우: 아무것도 하지 않음
END $$;
