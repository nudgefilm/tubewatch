-- ============================================================
-- TubeWatch: Admin-Aware Channel Limit Trigger
-- ============================================================
-- Run ALL steps in Supabase SQL Editor (Dashboard > SQL Editor)
--
-- Strategy:
--   The trigger function on public.user_channels is modified to
--   look up the inserting user's email from auth.users.
--   If the email is in the admin allowlist, the 3-channel limit
--   is skipped. Normal users are still enforced.
--
-- This does NOT use session_replication_role or RPC bypass.
-- The trigger itself makes the admin decision.
-- ============================================================


-- =========================================
-- Step 0: Find the current trigger (diagnostic — run first)
-- =========================================
-- Run this SELECT to identify the trigger function name:
--
--   SELECT t.tgname   AS trigger_name,
--          p.proname  AS function_name,
--          t.tgenabled AS enabled
--   FROM pg_trigger t
--   JOIN pg_proc p ON t.tgfoid = p.oid
--   WHERE t.tgrelid = 'public.user_channels'::regclass
--     AND NOT t.tgisinternal;
--
-- Note the function_name. The CREATE OR REPLACE below must match it.
-- If your function is named differently, change the name below.
-- =========================================


-- =========================================
-- Step 1: Replace the trigger function
-- =========================================
-- IMPORTANT: Replace "check_channel_limit" below with the actual
-- function name from Step 0 if it differs.

CREATE OR REPLACE FUNCTION public.check_channel_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email       text;
  v_is_admin    boolean := false;
  v_count       integer;
  v_max_channels integer := 3;
BEGIN
  -- Look up the inserting user's email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Admin allowlist (add more emails as needed)
  IF v_email IS NOT NULL AND v_email = ANY(ARRAY[
    'nudgefilm@gmail.com'
  ]) THEN
    v_is_admin := true;
  END IF;

  -- Skip limit for admin users
  IF v_is_admin THEN
    RAISE LOG '[user_channels] ADMIN_LIMIT_BYPASS_APPLIED: user_id=%, email=%',
      NEW.user_id, v_email;
    RETURN NEW;
  END IF;

  -- Enforce limit for normal users
  SELECT count(*) INTO v_count
  FROM public.user_channels
  WHERE user_id = NEW.user_id;

  IF v_count >= v_max_channels THEN
    RAISE LOG '[user_channels] CHANNEL_LIMIT_EXCEEDED: user_id=%, count=%, max=%',
      NEW.user_id, v_count, v_max_channels;
    RAISE EXCEPTION 'CHANNEL_LIMIT_EXCEEDED';
  END IF;

  RAISE LOG '[user_channels] NORMAL_LIMIT_ENFORCED: user_id=%, count=%, max=%',
    NEW.user_id, v_count, v_max_channels;
  RETURN NEW;
END;
$$;


-- =========================================
-- Step 2: Ensure trigger exists on user_channels
-- =========================================
-- If the trigger already exists, this will fail harmlessly.
-- If it doesn't exist yet, this creates it.
-- You may skip this if Step 0 already showed a trigger.

-- DROP TRIGGER IF EXISTS check_channel_limit_trigger ON public.user_channels;
-- CREATE TRIGGER check_channel_limit_trigger
--   BEFORE INSERT ON public.user_channels
--   FOR EACH ROW
--   EXECUTE FUNCTION public.check_channel_limit();


-- =========================================
-- Step 3: Clean up the old RPC bypass function (if created previously)
-- =========================================
DROP FUNCTION IF EXISTS public.insert_channel_bypass_limit(uuid, text, text, text, text, bigint);


-- =========================================
-- Step 4: Verification
-- =========================================
-- Run this to confirm the function was updated:
--
--   SELECT proname, prosrc
--   FROM pg_proc
--   WHERE proname = 'check_channel_limit';
--
-- The prosrc should now contain 'ADMIN_LIMIT_BYPASS_APPLIED'
-- and reference auth.users.
-- =========================================
