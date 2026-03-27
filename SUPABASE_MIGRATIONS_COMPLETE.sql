-- ============================================================================
-- HIREFRIEND PRO: Complete Database Migrations
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ALTER USERS TABLE - Add missing fields
-- ============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS connects_total INT DEFAULT 5;

-- Generate referral codes for existing users
UPDATE public.users 
SET referral_code = 'REF' || SUBSTRING(id::TEXT, 1, 9) 
WHERE referral_code IS NULL;

-- Create unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- ============================================================================
-- 2. REFERRALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'success', 'expired')) DEFAULT 'pending',
  points_awarded INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_referrer FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_referred FOREIGN KEY (referred_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_referral UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- ============================================================================
-- 3. POINTS_HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(30) CHECK (type IN ('attendance', 'referral', 'vlog', 'review', 'purchase', 'penalty')) NOT NULL,
  points INT NOT NULL,
  description VARCHAR(255),
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_points_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_points_user ON public.points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_type ON public.points_history(type);
CREATE INDEX IF NOT EXISTS idx_points_created ON public.points_history(created_at);

-- ============================================================================
-- 4. DAILY_REWARDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  current_streak INT DEFAULT 0,
  last_claim_date DATE,
  total_points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_daily_rewards_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_daily_rewards_user ON public.daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_last_claim ON public.daily_rewards(last_claim_date);

-- ============================================================================
-- 5. VIDEOS TABLE (Vlogs/Reels)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  caption TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  points_awarded INT DEFAULT 0,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_videos_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_videos_user ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created ON public.videos(created_at);

-- ============================================================================
-- 6. VIDEO_LIKES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.video_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_video_likes_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_video_likes_video FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE,
  CONSTRAINT unique_video_like UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_likes_user ON public.video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_video ON public.video_likes(video_id);

-- ============================================================================
-- 7. VIDEO_COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.video_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_video_comments_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_video_comments_video FOREIGN KEY (video_id) REFERENCES public.videos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_video_comments_user ON public.video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_video ON public.video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_created ON public.video_comments(created_at);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) CHECK (type IN ('points', 'referral', 'video', 'message', 'booking', 'system')),
  reference_id VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at);

-- ============================================================================
-- 9. RLS POLICIES - Enable Row Level Security
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- REFERRALS RLS Policies
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update referrals"
  ON public.referrals FOR UPDATE
  USING (true);

-- POINTS_HISTORY RLS Policies
CREATE POLICY "Users can view their own points history"
  ON public.points_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert points history"
  ON public.points_history FOR INSERT
  WITH CHECK (true);

-- DAILY_REWARDS RLS Policies
CREATE POLICY "Users can view their own daily rewards"
  ON public.daily_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily rewards"
  ON public.daily_rewards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert daily rewards"
  ON public.daily_rewards FOR INSERT
  WITH CHECK (true);

-- VIDEOS RLS Policies
CREATE POLICY "Everyone can view public videos"
  ON public.videos FOR SELECT
  USING (status = 'verified' OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos"
  ON public.videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos"
  ON public.videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own videos"
  ON public.videos FOR DELETE
  USING (auth.uid() = user_id);

-- VIDEO_LIKES RLS Policies
CREATE POLICY "Everyone can view video likes"
  ON public.video_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own likes"
  ON public.video_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
  ON public.video_likes FOR DELETE
  USING (auth.uid() = user_id);

-- VIDEO_COMMENTS RLS Policies
CREATE POLICY "Everyone can view video comments"
  ON public.video_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own comments"
  ON public.video_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.video_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.video_comments FOR DELETE
  USING (auth.uid() = user_id);

-- NOTIFICATIONS RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 10. Storage Buckets Creation (if not already created)
-- Note: You might need to create these via Supabase Dashboard:
--   - avatars
--   - vlogs (for video uploads)
--   - profile-images
--   - kyc-documents
--   - story-videos
-- ============================================================================

-- ============================================================================
-- 11. Realtime Subscriptions Setup
-- Note: Enable Realtime for these tables in Supabase Dashboard:
--   Navigate to Database > Replication > Source tables
--   Enable replication for: users, points_history, daily_rewards, notifications, videos
-- ============================================================================
