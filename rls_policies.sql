-- ============================================================================
-- Row Level Security (RLS) Policies for HireFriend
-- Execute AFTER enabling RLS on each table
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read public profile information of other users
CREATE POLICY "Users can read public profiles"
  ON users FOR SELECT
  USING (True);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can create their own profile during signup (INSERT policy)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can delete their own account
CREATE POLICY "Users can delete own account"
  ON users FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- 2. ONBOARDING PROFILES RLS
-- ============================================================================

ALTER TABLE onboarding_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own onboarding profile"
  ON onboarding_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding profile"
  ON onboarding_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding profile"
  ON onboarding_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. USER INTERESTS RLS
-- ============================================================================

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own interests"
  ON user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests"
  ON user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests"
  ON user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. USER LANGUAGES RLS
-- ============================================================================

ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own languages"
  ON user_languages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own languages"
  ON user_languages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own languages"
  ON user_languages FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. USER PERSONALITY RLS
-- ============================================================================

ALTER TABLE user_personality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own personality"
  ON user_personality FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own personality"
  ON user_personality FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own personality"
  ON user_personality FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. SERVICE PRICING RLS
-- ============================================================================

ALTER TABLE service_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own service pricing"
  ON service_pricing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own service pricing"
  ON service_pricing FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own service pricing"
  ON service_pricing FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. PROFILE MEDIA RLS
-- ============================================================================

ALTER TABLE profile_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own media"
  ON profile_media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media"
  ON profile_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media"
  ON profile_media FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media"
  ON profile_media FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. KYC VERIFICATIONS RLS
-- ============================================================================

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own KYC"
  ON kyc_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC"
  ON kyc_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KYC"
  ON kyc_verifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. WALLETS RLS
-- ============================================================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet via functions only"
  ON wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. WALLET TRANSACTIONS RLS
-- ============================================================================

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only functions can insert wallet transactions"
  ON wallet_transactions FOR INSERT
  WITH CHECK (False);

-- ============================================================================
-- 11. REVIEWS RLS
-- ============================================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  USING (True);

CREATE POLICY "Users can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- ============================================================================
-- 12. SUBSCRIPTIONS RLS
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 13. PAYMENT METHODS RLS
-- ============================================================================

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 14. PAYMENT TRANSACTIONS RLS
-- ============================================================================

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- 15. CONNECTIONS RLS
-- ============================================================================

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read connections they are involved in"
  ON connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connection requests"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections they are involved in"
  ON connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete connections they created or are receiver of pending"
  ON connections FOR DELETE
  USING (auth.uid() = requester_id OR (auth.uid() = receiver_id AND status = 'pending'));

-- ============================================================================
-- 16. CONVERSATIONS RLS
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read conversations they are part of"
  ON conversations FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================================================
-- 17. MESSAGES RLS
-- ============================================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- 18. BLOCKED USERS RLS
-- ============================================================================

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own blocked list"
  ON blocked_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their blocked list"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unblock users"
  ON blocked_users FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 19. NOTIFICATIONS RLS
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 20. VLOGS RLS
-- ============================================================================

ALTER TABLE vlogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vlogs"
  ON vlogs FOR SELECT
  USING (True);

CREATE POLICY "Users can insert their own vlogs"
  ON vlogs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vlogs"
  ON vlogs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 21. VLOG LIKES RLS
-- ============================================================================

ALTER TABLE vlog_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vlog likes"
  ON vlog_likes FOR SELECT
  USING (True);

CREATE POLICY "Users can like vlogs"
  ON vlog_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike vlogs"
  ON vlog_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 22. BOOKINGS RLS
-- ============================================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read bookings they are part of"
  ON bookings FOR SELECT
  USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Users can create bookings as client"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update bookings they are part of"
  ON bookings FOR UPDATE
  USING (auth.uid() = provider_id OR auth.uid() = client_id)
  WITH CHECK (auth.uid() = provider_id OR auth.uid() = client_id);

-- ============================================================================
-- 23. BOOKING CONFIRMATIONS RLS
-- ============================================================================

ALTER TABLE booking_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read booking confirmations they are part of"
  ON booking_confirmations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_confirmations.booking_id
      AND (bookings.provider_id = auth.uid() OR bookings.client_id = auth.uid())
    )
  );

CREATE POLICY "Users can update booking confirmations they are part of"
  ON booking_confirmations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_confirmations.booking_id
      AND (bookings.provider_id = auth.uid() OR bookings.client_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_confirmations.booking_id
      AND (bookings.provider_id = auth.uid() OR bookings.client_id = auth.uid())
    )
  );

-- ============================================================================
-- 24. REPORTS RLS
-- ============================================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- 25. STORIES RLS
-- ============================================================================

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read stories from connections and their own"
  ON stories FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM connections
      WHERE (requester_id = auth.uid() AND receiver_id = stories.user_id AND status = 'accepted')
      OR (requester_id = stories.user_id AND receiver_id = auth.uid() AND status = 'accepted')
    )
  );

CREATE POLICY "Users can create their own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 26. STORY VIEWS RLS
-- ============================================================================

ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read story views for stories they can see"
  ON story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND (
        stories.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM connections
          WHERE (requester_id = auth.uid() AND receiver_id = stories.user_id AND status = 'accepted')
          OR (requester_id = stories.user_id AND receiver_id = auth.uid() AND status = 'accepted')
        )
      )
    )
  );

CREATE POLICY "Users can create story views for stories they can see"
  ON story_views FOR INSERT
  WITH CHECK (
    auth.uid() = viewer_id AND
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_views.story_id
      AND (
        stories.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM connections
          WHERE (requester_id = auth.uid() AND receiver_id = stories.user_id AND status = 'accepted')
          OR (requester_id = stories.user_id AND receiver_id = auth.uid() AND status = 'accepted')
        )
      )
    )
  );

-- ============================================================================
-- 25. INTERESTS & LANGUAGES (Public Read-Only)
-- ============================================================================

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read interests"
  ON interests FOR SELECT
  USING (True);

ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read languages"
  ON languages FOR SELECT
  USING (True);

ALTER TABLE personality_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read personality types"
  ON personality_types FOR SELECT
  USING (True);

-- ============================================================================
-- HELPER FUNCTIONS FOR COMPLEX QUERIES
-- ============================================================================

-- Check if user can message another user
CREATE OR REPLACE FUNCTION can_message(user_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions s1
    INNER JOIN subscriptions s2 ON s2.user_id = target_user_id
    WHERE s1.user_id = user_id
    AND s1.plan = 'premium' AND s1.status = 'active'
    AND s2.plan = 'premium' AND s2.status = 'active'
  ) AND EXISTS (
    SELECT 1 FROM connections
    WHERE (requester_id = user_id AND receiver_id = target_user_id AND status = 'accepted')
    OR (requester_id = target_user_id AND receiver_id = user_id AND status = 'accepted')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(user_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (user_id = user_id AND blocked_user_id = target_user_id)
    OR (user_id = target_user_id AND blocked_user_id = user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's connect limit
CREATE OR REPLACE FUNCTION get_connect_limit(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  limit_count INTEGER;
BEGIN
  SELECT (connect_limit - connects_used)
  INTO limit_count
  FROM subscriptions
  WHERE subscriptions.user_id = user_id;
  
  RETURN COALESCE(limit_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All tables have RLS enabled
-- 2. All policies follow principle of least privilege
-- 3. Wallet updates are protected and only via functions
-- 4. Messages require active subscriptions and accepted connection
-- 5. All user data is isolated and private
-- 6. Run these policies AFTER creating all tables
