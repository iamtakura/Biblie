-- ============================================================
-- Biblie — Migration 004: New Query Modes
-- Adds general_qa, moral_question, comparison to passage_category enum.
-- Adds groq-llama-3.3-70b-versatile (correct name) to source_model enum.
-- Adds chapter_breakdown to passage_category enum (was missing).
-- Run in: Supabase SQL Editor or via supabase db push
-- ============================================================

-- Extend passage_category enum with new mode values
ALTER TYPE public.passage_category ADD VALUE IF NOT EXISTS 'chapter_breakdown';
ALTER TYPE public.passage_category ADD VALUE IF NOT EXISTS 'general_qa';
ALTER TYPE public.passage_category ADD VALUE IF NOT EXISTS 'moral_question';
ALTER TYPE public.passage_category ADD VALUE IF NOT EXISTS 'comparison';

-- Fix source_model enum: add the correct Groq model name (the original migration
-- had 'groq-llama-3.3-70b' but the API uses 'groq-llama-3.3-70b-versatile').
ALTER TYPE public.source_model ADD VALUE IF NOT EXISTS 'groq-llama-3.3-70b-versatile';
