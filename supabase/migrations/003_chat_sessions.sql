-- ============================================================
-- Biblie — Migration 003: Chat Sessions
-- Run in: Supabase SQL Editor or via supabase db push
-- ============================================================

-- ─── chat_sessions ────────────────────────────────────────────
-- One session per user conversation grouping.
-- Title is auto-derived from the first query (≤50 chars).
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
  ON public.chat_sessions (user_id, updated_at DESC);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_select_own"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_insert_own"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_sessions_update_own"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "chat_sessions_delete_own"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypasses RLS automatically, but explicit policy for clarity
CREATE POLICY "chat_sessions_service_role_all"
  ON public.chat_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── session_queries ──────────────────────────────────────────
-- One row per /api/ask call. Links to the session and optionally
-- to the passage_cache row that was written/returned.
-- mode and source_model are TEXT (not enum) to avoid coupling to
-- DB enum definitions and allow future mode values freely.
CREATE TABLE IF NOT EXISTS public.session_queries (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query_text       TEXT        NOT NULL,
  mode             TEXT        NOT NULL,
  passage_cache_id UUID        REFERENCES public.passage_cache(id) ON DELETE SET NULL,
  source_model     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_queries_session
  ON public.session_queries (session_id, created_at);

ALTER TABLE public.session_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_queries_select_own"
  ON public.session_queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "session_queries_insert_own"
  ON public.session_queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users do not update or delete individual query logs
CREATE POLICY "session_queries_service_role_all"
  ON public.session_queries FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
