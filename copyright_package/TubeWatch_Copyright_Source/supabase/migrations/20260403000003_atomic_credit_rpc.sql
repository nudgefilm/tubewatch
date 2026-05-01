-- ============================================================
-- Atomic Credit RPC Functions (Master Plan v1.2 § 5 Business Layer)
--
-- 3-phase: reserve → confirm | rollback
-- reserve: FOR UPDATE로 credits 행 잠금 후 한 트랜잭션에서 확인 + 선점
-- confirm: reservation status → 'confirmed'
-- rollback: reservation status → 'released' + 크레딧 복구
-- ============================================================

-- ─── reserve_credit ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reserve_credit(
  p_user_id       uuid,
  p_channel_id    uuid,
  p_is_free_plan  boolean,
  p_effective_limit integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits        public.user_credits%ROWTYPE;
  v_reservation_id uuid;
  v_now            timestamptz := now();
  v_period_start   text;
  v_period_end     text;
BEGIN
  -- 기존 credits 행 잠금 (FOR UPDATE = 동시 요청 직렬화)
  SELECT * INTO v_credits
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 행이 없으면 신규 생성
  IF NOT FOUND THEN
    v_period_start := to_char(date_trunc('month', v_now), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    v_period_end   := to_char(date_trunc('month', v_now + interval '1 month'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    INSERT INTO public.user_credits (
      user_id, credits_used, period_start, period_end,
      lifetime_analyses_used, purchased_credits
    ) VALUES (
      p_user_id, 0, v_period_start, v_period_end, 0, 0
    )
    RETURNING * INTO v_credits;
  END IF;

  -- 크레딧 소진 여부 확인 (잠금 상태에서 체크)
  IF p_is_free_plan THEN
    IF v_credits.lifetime_analyses_used >= p_effective_limit THEN
      RETURN jsonb_build_object(
        'ok', false,
        'code', 'CREDITS_EXHAUSTED',
        'error', '무료 분석 횟수를 모두 사용했습니다. 구독 플랜이나 단건 크레딧을 이용해주세요.'
      );
    END IF;
    -- 선점: lifetime_analyses_used + 1
    UPDATE public.user_credits
    SET lifetime_analyses_used = lifetime_analyses_used + 1
    WHERE id = v_credits.id;
  ELSE
    IF v_credits.credits_used >= p_effective_limit THEN
      RETURN jsonb_build_object(
        'ok', false,
        'code', 'CREDITS_EXHAUSTED',
        'error', '이번 달 분석 크레딧을 모두 사용했습니다.'
      );
    END IF;
    -- 선점: credits_used + 1
    UPDATE public.user_credits
    SET credits_used = credits_used + 1
    WHERE id = v_credits.id;
  END IF;

  -- reservation 기록 삽입
  INSERT INTO public.credit_reservations (
    user_id, channel_id, reserved_amount, status, expires_at
  ) VALUES (
    p_user_id, p_channel_id, 1, 'reserved',
    v_now + interval '15 minutes'
  )
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation_id::text
  );
END;
$$;

COMMENT ON FUNCTION public.reserve_credit IS
  'Atomic credit reservation. FOR UPDATE로 이중 예약 방지. is_free_plan/effective_limit은 호출부에서 결정.';


-- ─── confirm_credit ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.confirm_credit(
  p_reservation_id uuid,
  p_snapshot_id    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.credit_reservations
  SET status     = 'confirmed',
      snapshot_id = COALESCE(p_snapshot_id, snapshot_id),
      updated_at  = now()
  WHERE id = p_reservation_id
    AND status = 'reserved';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'reservation not found or already processed'
    );
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

COMMENT ON FUNCTION public.confirm_credit IS
  '분석 성공 시 reservation → confirmed. snapshot_id를 선택적으로 기록.';


-- ─── rollback_credit ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rollback_credit(
  p_reservation_id uuid,
  p_is_free_plan   boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_res   public.credit_reservations%ROWTYPE;
  v_updated integer;
BEGIN
  -- reservation 상태 전환 (reserved → released)
  UPDATE public.credit_reservations
  SET status = 'released', updated_at = now()
  WHERE id = p_reservation_id
    AND status = 'reserved'
  RETURNING * INTO v_res;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    -- 이미 confirmed이거나 없음 — rollback 불가
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'reservation not found or already confirmed'
    );
  END IF;

  -- 선점했던 크레딧 복구
  IF p_is_free_plan THEN
    UPDATE public.user_credits
    SET lifetime_analyses_used = GREATEST(0, lifetime_analyses_used - 1)
    WHERE user_id = v_res.user_id;
  ELSE
    UPDATE public.user_credits
    SET credits_used = GREATEST(0, credits_used - 1)
    WHERE user_id = v_res.user_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

COMMENT ON FUNCTION public.rollback_credit IS
  '분석 실패 시 reservation → released + 선점 크레딧 복구. GREATEST(0,...) 로 언더플로우 방지.';
