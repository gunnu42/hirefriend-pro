-- MIGRATION: Add missing columns to users table + create reviews table
-- Run this entire script in Supabase SQL Editor

-- ==========================================
-- ERROR 1 FIX: Add missing columns to users table
-- ==========================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS connects_left INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS connects_total INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_renew_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';

-- Add CHECK constraint for plan_type to ensure valid values
ALTER TABLE public.users 
ADD CONSTRAINT check_valid_plan_type 
CHECK (plan_type IN ('free', 'silver', 'gold', 'platinum', 'premium'));

-- Add CHECK constraint for kyc_status
ALTER TABLE public.users 
ADD CONSTRAINT check_valid_kyc_status 
CHECK (kyc_status IN ('draft', 'pending', 'verified', 'rejected'));

-- Create index for wallet_balance lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON public.users(wallet_balance DESC);

-- Create index for plan_type lookups
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON public.users(plan_type);

-- Create index for kyc_status lookups
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON public.users(kyc_status);

-- ==========================================
-- ERROR 3 FIX: Create reviews table with RLS policies
-- ==========================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_id)
);

-- Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view reviews (SELECT)
CREATE POLICY IF NOT EXISTS reviews_select 
  ON public.reviews 
  FOR SELECT 
  USING (true);

-- RLS Policy: Users can only insert their own reviews
CREATE POLICY IF NOT EXISTS reviews_insert 
  ON public.reviews 
  FOR INSERT 
  WITH CHECK (auth.uid() = reviewer_id);

-- RLS Policy: Users can only update their own reviews
CREATE POLICY IF NOT EXISTS reviews_update 
  ON public.reviews 
  FOR UPDATE 
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- RLS Policy: Users can only delete their own reviews
CREATE POLICY IF NOT EXISTS reviews_delete 
  ON public.reviews 
  FOR DELETE 
  USING (auth.uid() = reviewer_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_id ON public.reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating DESC);

-- ==========================================
-- Verification queries (optional - to check tables)
-- ==========================================

-- Verify users table has all columns
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;

-- Verify reviews table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'reviews';
