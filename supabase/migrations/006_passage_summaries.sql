-- ============================================================
-- Biblie — Migration 006: Passage Summaries
-- Adds short_summary to passage_cache for study history display.
-- Populated at write time server-side (no extra LLM call).
-- Run in: Supabase SQL Editor or via supabase db push
-- ============================================================

ALTER TABLE public.passage_cache
  ADD COLUMN IF NOT EXISTS short_summary TEXT;
