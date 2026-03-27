-- ============================================================================
-- INSTAGRAM-LIKE STORIES + REAL-TIME SUBSCRIPTIONS
-- HireFriend Production Schema
-- ============================================================================
-- Execute this ENTIRE script in: Supabase Dashboard → SQL Editor
-- Time: ~2 minutes
-- ============================================================================

-- ============================================================================
-- PART 1: INSTAGRAM-LIKE STORIES TABLES
-- ============================================================================

-- Stories table: User-generated stories with 24-hour expiry
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on stories
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "stories_select" ON public.stories 
  FOR SELECT USING (expires_at > NOW());

CREATE POLICY "stories_insert" ON public.stories 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update" ON public.stories 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "stories_delete" ON public.stories 
  FOR DELETE USING (auth.uid() = user_id);

-- Story views tracking table
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS on story_views
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_views
CREATE POLICY "views_select" ON public.story_views 
  FOR SELECT USING (true);

CREATE POLICY "views_insert" ON public.story_views 
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- ============================================================================
-- PART 2: SUBSCRIPTIONS TABLE (Optional - for advanced management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'silver', 'gold', 'platinum')),
  subscription_active BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "sub_select" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sub_insert" ON public.subscriptions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sub_update" ON public.subscriptions 
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS stories_user_id_idx ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS story_views_viewer_id_idx ON public.story_views(viewer_id);
CREATE INDEX IF NOT EXISTS story_views_story_id_idx ON public.story_views(story_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- ============================================================================
-- PART 4: TEST DATA (Optional - for development)
-- ============================================================================

-- Insert test story (replace user_id with an actual auth user ID)
-- SELECT * FROM auth.users LIMIT 1; -- to find a user ID
/*
INSERT INTO public.stories (user_id, media_url, caption) VALUES
  ('replace-with-real-user-uuid', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=600&fit=crop', 'Beautiful sunset! 🌅'),
  ('replace-with-real-user-uuid', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=600&fit=crop', 'Coffee vibes ☕');
*/

-- ============================================================================
-- VERIFICATION QUERIES (Run after creation)
-- ============================================================================

-- Verify tables created
-- SELECT * FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('stories', 'story_views', 'subscriptions');

-- Verify RLS enabled
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('stories', 'story_views', 'subscriptions');

-- Verify indexes created
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('stories', 'story_views', 'subscriptions');

-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Go to Replication Settings and enable Realtime for these tables
-- 3. (Optional) Insert test data by uncommenting the TEST DATA section
-- 4. Your app will now support Instagram-style stories with real-time updates!
-- ============================================================================

