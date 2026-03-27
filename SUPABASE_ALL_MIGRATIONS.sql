-- COMPREHENSIVE SUPABASE MIGRATION
-- Run this entire script in Supabase SQL Editor

-- ==========================================
-- ADD MISSING COLUMNS TO USERS TABLE
-- ==========================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state TEXT;

-- ==========================================
-- CREATE BILLING HISTORY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.billing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  payment_method TEXT,
  invoice_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_history_select" ON public.billing_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "billing_history_insert" ON public.billing_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_billing_history_user_id ON public.billing_history(user_id);
CREATE INDEX idx_billing_history_created_at ON public.billing_history(created_at DESC);

-- ==========================================
-- CREATE REFERRALS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "referrals_insert" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

-- ==========================================
-- CREATE DAILY REWARDS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.daily_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  last_claim_date DATE,
  total_points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_rewards_select" ON public.daily_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_rewards_upsert" ON public.daily_rewards
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_daily_rewards_user_id ON public.daily_rewards(user_id);

-- ==========================================
-- CREATE/UPDATE WALLET TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wallet_transactions_select" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallet_transactions_insert" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- ==========================================
-- SETUP STORAGE BUCKET FOR AVATARS
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY IF NOT EXISTS "avatar_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "avatar_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "avatar_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "avatar_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- UPDATE USERS TABLE WITH NEW FIELDS
-- ==========================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_claim_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON public.users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_wallet_balance ON public.users(wallet_balance DESC);

-- ==========================================
-- VERIFICATION QUERIES (Optional - remove after testing)
-- ==========================================
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('billing_history', 'referrals', 'daily_rewards', 'wallet_transactions');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('avatar_url', 'bio', 'city', 'state');
