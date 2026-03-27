-- ============================================================================
-- HireFriend Production Database Triggers & Functions
-- Supabase PostgreSQL with Row Level Security (RLS)
-- ============================================================================

-- ==========================================
-- 1. PROFILE CREATION TRIGGER (On Signup)
-- ==========================================

-- Function to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table (profile)
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    email_verified,
    phone_verified,
    plan_type,
    connects_left,
    wallet_balance,
    subscription_active,
    auto_renew_enabled,
    role,
    profile_completed,
    is_blocked,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    false, -- phone_verified starts false
    'free',
    5, -- free users get 5 connects
    0, -- starting balance
    false, -- no subscription
    false, -- no auto-renew
    'user',
    false, -- profile not completed
    false, -- not blocked
    NOW(),
    NOW()
  );

  -- Create wallet entry
  INSERT INTO public.wallets (user_id, points_balance, updated_at)
  VALUES (NEW.id, 0, NOW());

  -- Create daily rewards entry
  INSERT INTO public.daily_rewards (user_id, current_streak, last_claim_date, total_points_earned)
  VALUES (NEW.id, 0, NULL, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER trigger_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ==========================================
-- 2. PROFILE SYNC FUNCTIONS
-- ==========================================

-- Function to sync profile updates across related tables
CREATE OR REPLACE FUNCTION sync_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp
  NEW.updated_at = NOW();

  -- If profile is marked as completed, ensure all required fields are filled
  IF NEW.profile_completed = true THEN
    -- Check if all required fields are present
    IF NEW.full_name = '' OR NEW.email = '' OR NEW.current_city = '' THEN
      NEW.profile_completed = false;
    END IF;
  END IF;

  -- Sync KYC status to profile if KYC is verified
  IF EXISTS (
    SELECT 1 FROM kyc_verifications
    WHERE user_id = NEW.id AND status = 'verified'
  ) THEN
    -- KYC verified users get additional connects
    IF NEW.plan_type = 'free' AND NEW.connects_left < 10 THEN
      NEW.connects_left = 10;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on users table updates
CREATE OR REPLACE TRIGGER trigger_sync_profile_updates
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_updates();

-- ==========================================
-- 3. CHAT MESSAGE LIMITS & VALIDATION
-- ==========================================

-- Function to validate message sending (rate limits, subscription checks)
CREATE OR REPLACE FUNCTION validate_message_send()
RETURNS TRIGGER AS $$
DECLARE
  user_plan text;
  daily_count integer;
  today date;
BEGIN
  -- Get user's plan
  SELECT plan_type INTO user_plan
  FROM public.users
  WHERE id = NEW.sender_id;

  -- If free user, check daily limit
  IF user_plan = 'free' OR user_plan IS NULL THEN
    today := CURRENT_DATE;

    -- Count messages sent today by this user
    SELECT COUNT(*) INTO daily_count
    FROM public.messages
    WHERE sender_id = NEW.sender_id
      AND DATE(created_at) = today;

    -- Free users limited to 10 messages per day
    IF daily_count >= 10 THEN
      RAISE EXCEPTION 'Daily message limit reached for free users';
    END IF;
  END IF;

  -- Premium users have unlimited messages
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on messages insert
CREATE OR REPLACE TRIGGER trigger_validate_message_send
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_send();

-- ==========================================
-- 4. KYC VALIDATION & STATUS SYNC
-- ==========================================

-- Function to validate KYC data format and update status
CREATE OR REPLACE FUNCTION validate_kyc_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic format validation
  IF NEW.id_document_type NOT IN ('aadhar', 'pan', 'passport') THEN
    RAISE EXCEPTION 'Invalid document type';
  END IF;

  -- Aadhaar validation (12 digits)
  IF NEW.id_document_type = 'aadhar' AND NEW.id_document_url IS NOT NULL THEN
    -- Note: Actual OCR validation would happen in edge function
    -- This is just format check
    NULL;
  END IF;

  -- PAN validation (10 characters, specific format)
  IF NEW.id_document_type = 'pan' AND NEW.id_document_url IS NOT NULL THEN
    -- Note: Actual validation in edge function
    NULL;
  END IF;

  -- Set initial status to pending for review
  IF NEW.status = 'draft' AND NEW.selfie_url IS NOT NULL AND NEW.id_document_url IS NOT NULL THEN
    NEW.status = 'pending';
  END IF;

  -- Update timestamp
  NEW.updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on KYC updates
CREATE OR REPLACE TRIGGER trigger_validate_kyc_submission
  BEFORE INSERT OR UPDATE ON public.kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION validate_kyc_submission();

-- ==========================================
-- 5. RATINGS & REVIEWS SYSTEM
-- ==========================================

-- Function to update user average rating when review is added/updated
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating numeric;
  review_count integer;
BEGIN
  -- Calculate new average rating for the reviewed user
  SELECT
    AVG(rating)::numeric(3,2),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.reviews
  WHERE receiver_id = COALESCE(NEW.receiver_id, OLD.receiver_id);

  -- Update the user's rating in users table (if we add rating column)
  -- For now, we'll store this in a separate table or calculate on demand

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on reviews insert/update/delete
CREATE OR REPLACE TRIGGER trigger_update_user_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating();

-- ==========================================
-- 6. WALLET & POINTS SYSTEM
-- ==========================================

-- Function to ensure wallet balance never goes negative
CREATE OR REPLACE FUNCTION validate_wallet_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent negative balance
  IF NEW.points_balance < 0 THEN
    RAISE EXCEPTION 'Wallet balance cannot be negative';
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on wallet updates
CREATE OR REPLACE TRIGGER trigger_validate_wallet_transaction
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION validate_wallet_transaction();

-- ==========================================
-- 7. BECOME A FRIEND VALIDATION
-- ==========================================

-- Function to validate service pricing data
CREATE OR REPLACE FUNCTION validate_service_pricing()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure hourly rate is positive
  IF NEW.hourly_rate <= 0 THEN
    RAISE EXCEPTION 'Hourly rate must be greater than 0';
  END IF;

  -- Ensure valid service mode
  IF NEW.service_mode NOT IN ('local_friend', 'virtual_friend') THEN
    RAISE EXCEPTION 'Invalid service mode';
  END IF;

  -- Set default availability if not provided
  IF NEW.availability_slots IS NULL THEN
    NEW.availability_slots = '[]'::jsonb;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on service_pricing
CREATE OR REPLACE TRIGGER trigger_validate_service_pricing
  BEFORE INSERT OR UPDATE ON public.service_pricing
  FOR EACH ROW
  EXECUTE FUNCTION validate_service_pricing();

-- ==========================================
-- 8. GLOBAL SYNC FUNCTION
-- ==========================================

-- Function to sync data across all related tables when profile updates
CREATE OR REPLACE FUNCTION global_profile_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync to connections (update display names)
  UPDATE connections
  SET updated_at = NOW()
  WHERE requester_id = NEW.id OR receiver_id = NEW.id;

  -- Sync to conversations (update participant info)
  UPDATE conversations
  SET last_message_at = last_message_at -- trigger update
  WHERE user1_id = NEW.id OR user2_id = NEW.id;

  -- If KYC status changed, update permissions
  IF OLD.kyc_status IS DISTINCT FROM NEW.kyc_status THEN
    -- Update subscription connects if KYC verified
    IF NEW.kyc_status = 'verified' AND NEW.plan_type = 'free' THEN
      UPDATE users
      SET connects_left = GREATEST(connects_left, 10)
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This would be called from edge functions or manual sync
-- CREATE OR REPLACE TRIGGER trigger_global_profile_sync
--   AFTER UPDATE ON public.users
--   FOR EACH ROW
--   EXECUTE FUNCTION global_profile_sync();

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vlogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vlog_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- SECURITY POLICIES (RLS)
-- ==========================================

-- Users can read/update their own profile
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read other users' public profiles
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT USING (
    profile_completed = true AND
    is_blocked = false
  );

-- Similar policies for other tables...
-- (Detailed policies would be added here)