-- ============================================================
-- Biblie — Atomic Rate Limit Increment RPC
-- Run after 001_initial_schema.sql
-- ============================================================

-- Atomically increments the daily_request_count for a user.
-- Called server-side after a successful live model call.
-- Using a function avoids a read-modify-write race condition.
CREATE OR REPLACE FUNCTION public.increment_daily_count(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET daily_request_count = daily_request_count + 1
  WHERE id = user_id;
END;
$$;

-- Grant execute to service_role only
REVOKE ALL ON FUNCTION public.increment_daily_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_daily_count(UUID) TO service_role;
