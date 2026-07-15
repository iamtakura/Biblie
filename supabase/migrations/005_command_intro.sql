-- ============================================================
-- Biblie — Migration 005: Command Intro Flag
-- Adds has_seen_command_intro to profiles for first-time onboarding popup.
-- Run in: Supabase SQL Editor or via supabase db push
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_command_intro BOOLEAN NOT NULL DEFAULT false;
