-- Add missing columns for interests and languages
-- Run this in Supabase SQL Editor

ALTER TABLE public.user_interests ADD COLUMN IF NOT EXISTS interest TEXT;
ALTER TABLE public.user_languages ADD COLUMN IF NOT EXISTS language TEXT;

-- Verify the changes
-- SELECT column_name FROM information_schema.columns WHERE table_name IN ('user_interests', 'user_languages');
