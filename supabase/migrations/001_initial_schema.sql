-- ============================================================
-- Biblie — Initial Schema Migration
-- Run in: Supabase SQL Editor or via supabase db push
-- ============================================================

-- gen_random_uuid() is built into Postgres 13+ — no extension needed.

-- ─── profiles ─────────────────────────────────────────────────
-- Mirrors auth.users 1:1. Auto-created via trigger below.
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  daily_request_count INT         NOT NULL DEFAULT 0,
  daily_reset_at      TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update only their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role can do anything (used by server-side rate limit logic)
CREATE POLICY "profiles_service_role_all"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── Auto-create profile on signup ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── passage_cache ────────────────────────────────────────────
-- Shared across all users. Written by service role, read by anyone authenticated.
CREATE TYPE public.passage_category AS ENUM (
  'interpretation',
  'timing',
  'denominational',
  'doctrinal',
  'historical_context'
);

CREATE TYPE public.source_model AS ENUM (
  'gemini-2.5-flash',
  'groq-llama-3.3-70b'
);

CREATE TABLE IF NOT EXISTS public.passage_cache (
  id             UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_ref    TEXT                   NOT NULL,
  category       public.passage_category NOT NULL,
  response_json  JSONB                  NOT NULL,
  source_model   public.source_model    NOT NULL,
  prompt_version INT                    NOT NULL,
  created_at     TIMESTAMPTZ            NOT NULL DEFAULT now()
);

-- Unique constraint: same passage + category + prompt version = same cached answer
CREATE UNIQUE INDEX IF NOT EXISTS uq_passage_cache
  ON public.passage_cache (passage_ref, category, prompt_version);

-- Index for fast lookups on the hot path
CREATE INDEX IF NOT EXISTS idx_passage_cache_lookup
  ON public.passage_cache (passage_ref, category, prompt_version);

ALTER TABLE public.passage_cache ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read cache
CREATE POLICY "passage_cache_select_authenticated"
  ON public.passage_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update (validation + write happens server-side)
CREATE POLICY "passage_cache_service_role_write"
  ON public.passage_cache FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "passage_cache_service_role_update"
  ON public.passage_cache FOR UPDATE
  USING (auth.role() = 'service_role');

-- ─── study_history ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_history (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  passage_cache_id  UUID        NOT NULL REFERENCES public.passage_cache(id) ON DELETE CASCADE,
  saved_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  personal_note     TEXT
);

-- Fast retrieval per user
CREATE INDEX IF NOT EXISTS idx_study_history_user
  ON public.study_history (user_id, saved_at DESC);

ALTER TABLE public.study_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_history_select_own"
  ON public.study_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "study_history_insert_own"
  ON public.study_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "study_history_update_own"
  ON public.study_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "study_history_delete_own"
  ON public.study_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "study_history_service_role_all"
  ON public.study_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
