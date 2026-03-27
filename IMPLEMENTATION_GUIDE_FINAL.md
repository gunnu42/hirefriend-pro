# HireFriend Pro - Production Implementation Guide

## 📋 Overview

This guide covers the complete implementation of the production-grade HireFriend app with UI redesign, real-time Supabase system, and critical fixes.

---

## 🗄️ PART 1: DATABASE SETUP

### SQL Migrations

**Run this in Supabase SQL Editor:**

See file: `SUPABASE_MIGRATIONS_COMPLETE.sql`

This creates:
- ✅ `referrals` table
- ✅ `points_history` table
- ✅ `daily_rewards` table
- ✅ `videos` table
- ✅ `video_likes` table
- ✅ `video_comments` table
- ✅ `notifications` table (updated)
- ✅ Updates to `users` table with new fields
- ✅ RLS policies for all tables

### Supabase Storage Buckets

Create these in Supabase Dashboard > Storage:
- `avatars` - User profile pictures
- `vlogs` - Video uploads
- `profile-images` - Profile gallery
- `kyc-documents` - KYC verification docs
- `story-videos` - Story videos

### Enable Realtime

In Supabase Dashboard > Database > Replication:
Enable replication for these tables:
- `users`
- `points_history`
- `daily_rewards`
- `notifications`
- `videos`

---

## 📦 NPM PACKAGES TO INSTALL

No new packages required! The app already has all dependencies. Verify installation:

```bash
npm install
# or
yarn install
```

All critical packages are already in `package.json`:
- `@supabase/supabase-js` ✅
- `@react-native-async-storage/async-storage` ✅
- `expo-linear-gradient` ✅
- `expo-haptics` ✅
- `lucide-react-native` ✅

---

## 🔧 IMPLEMENTATION STEPS

### Step 1: Update TypeScript Types

**File:** `types/database.ts` ✅ (Already updated)

Added types for:
- `referrals`
- `points_history`
- `daily_rewards`
- `videos`
- `video_likes`
- `video_comments`
- Updated `users` table with new fields

### Step 2: Fix Auth Persistence

**File:** `supabase.ts` ✅ (Already correct)

Current config is production-ready:
```typescript
auth: {
  storage: AsyncStorage as any,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  flowType: 'pkce',
}
```

✅ User sessions persists after app restart
✅ Auto-refresh handled by Supabase

### Step 3: Update Contexts

#### WalletContext - Real-time Support

**File:** Use `contexts/WalletContext.new.tsx`

Replace `contexts/WalletContext.tsx` with this:

Features:
- ✅ Real-time wallet balance updates
- ✅ Real-time points history
- ✅ Real-time streak tracking
- ✅ Daily reward claiming logic
- ✅ Referral stats tracking
- ✅ Safe defaults (never returns undefined)

```bash
# Option: Copy over
cp contexts/WalletContext.new.tsx contexts/WalletContext.tsx
```

#### DailyRewardsContext - Database Integration

**File:** Use `contexts/DailyRewardsContext.new.tsx`

Replace `contexts/DailyRewardsContext.tsx` with this:

Features:
- ✅ Loads streak data from Supabase
- ✅ Real-time streak updates
- ✅ Streak reward calculation (Day 7→100pts, Day 14→200pts, Day 30→500pts)
- ✅ Daily reward claiming with transaction safety
- ✅ Points history insertion

### Step 4: Update UI Components

#### StoriesBar - Instagram Style

**File:** Use `components/StoriesBar.new.tsx`

Replace `components/StoriesBar.tsx` with this:

Features:
- ✅ Circular avatars (60px)
- ✅ Gradient rings (blue for unseen, gray for seen)
- ✅ "Your Story" with + icon
- ✅ Smooth horizontal FlatList
- ✅ Soft shadows under avatars
- ✅ Premium gradient background
- ✅ Names below avatars (max 1 line)

#### InteractiveDailyRewards - Gamified UI

**File:** Use `components/InteractiveDailyRewards.new.tsx`

Replace `components/InteractiveDailyRewards.tsx` with this:

Features:
- ✅ Card-based horizontal scroll
- ✅ Today's reward: bigger card + glowing border
- ✅ Past days: smaller cards + checkmarks
- ✅ Streak counter with fire emoji
- ✅ Progress bar to milestone
- ✅ Pulsing animation on current day
- ✅ Gradient claim button
- ✅ Real-time point updates

#### Bottom Navigation - Animated Tabs

**File:** Use `app/(tabs)/_layout.new.tsx`

Replace `app/(tabs)/_layout.tsx` with this:

Features:
- ✅ Removed "Favorites" tab
- ✅ Smooth tab transition animations
- ✅ Active tab: filled + accent color + scale
- ✅ Animated icon scaling
- ✅ Soft shadows under tab bar
- ✅ 5 tabs only: Home, Explore, Bookings, Messages, Profile

### Step 5: Critical Fixes

#### Profile Sync Issue

**File:** `contexts/ProfileContext.tsx`

Make these changes:

1. **On signup form save:**
```typescript
// After form submission, immediately save to users table
await supabase
  .from('users')
  .update({
    full_name: formData.name,
    phone: formData.phone,
    email: formData.email,
  })
  .eq('id', userId)
```

2. **Avatar upload:**
```typescript
// Upload to storage bucket 'avatars'
const blob = await fetch(uri).then(r => r.blob())
const path = `${userId}/avatar_${Date.now()}.jpg`
const publicUrl = await uploadToStorage('avatars', path, blob)

// Save URL to users table
await supabase
  .from('users')
  .update({ avatar_url: publicUrl })
  .eq('id', userId)
```

3. **Edit profile:**
- Directly update `users` table (no edge functions)
- Changes reflect immediately (via real-time)

#### Onboarding Flow Redirect

**File:** `contexts/AuthContext.tsx` or app routing logic

After signup/OTP verification:

```typescript
// 1. Check if onboarding completed
const { data: onboarding } = await supabase
  .from('onboarding_profiles')
  .select('*')
  .eq('user_id', userId)
  .single()

// 2. If NOT completed, redirect to onboarding
if (!onboarding || !onboarding.step_4_completed) {
  router.replace('/onboarding')
} else {
  // 3. If completed, go to home
  router.replace('/(tabs)/(home)')
}
```

After onboarding completion:

```typescript
// Mark as completed
await supabase
  .from('onboarding_profiles')
  .update({
    step_4_completed: true,
    current_step: 5,
  })
  .eq('user_id', userId)

// Redirect to home
router.replace('/(tabs)/(home)')
```

---

## 🎯 PART 2: REAL-TIME SYSTEM

### Real-Time Wallet Updates

In `WalletContext.new.tsx`, there's a complete realtime channel setup:

```typescript
const channel = supabase
  .channel(`wallet-realtime-${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'users',
    filter: `id=eq.${userId}`,
  }, (payload) => {
    // Update local state immediately
    setWalletBalance(payload.new.wallet_balance)
  })
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'points_history',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // Add to local history on new points
    setTransactions(prev => [payload.new, ...prev])
  })
  .subscribe()
```

### No Manual Refresh Needed

✅ All data updates automatically via realtime
✅ Pull-to-refresh still works for manual refresh
✅ Notifications shown as toast when points added

---

## 💰 PART 3: REWARDS & REFERRAL SYSTEM

### Daily Streak Rewards

Points by day:
- Day 1: 40 pts
- Day 2: 45 pts
- Day 3: 50 pts
- Day 7: 100 pts (milestone bonus)
- Day 14: 200 pts (milestone bonus)
- Day 30: 500 pts (milestone bonus)

Pattern: Base 40 + (week_number - 1) × 5, with milestone bonuses

### Referral System

1. **Generate code on signup:**
```typescript
const referralCode = 'REF' + userId.substring(0, 9)

await supabase
  .from('users')
  .update({ referral_code: referralCode })
  .eq('id', auth.user.id)
```

2. **On referral signup:**
```typescript
// Insert referral record (pending)
await supabase.from('referrals').insert([{
  referrer_id: referrerUserId,
  referred_id: newUserId,
  status: 'pending'
}])
```

3. **On referred user completes profile:**
```typescript
// Update status to success
await supabase
  .from('referrals')
  .update({ status: 'success', points_awarded: 500 })
  .eq('referred_id', userId)

// Award referrer
await supabase.from('points_history').insert([{
  user_id: referrerUserId,
  type: 'referral',
  points: 500,
  description: 'Referral bonus',
  reference_id: newUserId
}])

// Add to referrer wallet
await supabase
  .from('users')
  .update({ wallet_balance: current + 500 })
  .eq('id', referrerUserId)
```

---

## 🎬 PART 4: VIDEO/VLOG SYSTEM

### Upload Flow

1. **Pick video:**
```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['video'],
  quality: 1,
})
```

2. **Show progress:**
```typescript
// Display real-time upload progress bar
```

3. **Upload to storage:**
```typescript
const blob = await fetch(videoUri).then(r => r.blob())
const path = `${userId}/vlog_${Date.now()}.mp4`
const publicUrl = await uploadToStorage('vlogs', path, blob)
```

4. **Create record (pending):**
```typescript
const { data: video } = await supabase
  .from('videos')
  .insert([{
    user_id: userId,
    video_url: publicUrl,
    thumbnail_url: thumbnailUrl,
    caption: caption,
    status: 'pending',
    created_at: new Date().toISOString()
  }])
  .select()
  .single()
```

5. **Show badge:**
```typescript
// User sees "Under Review" badge on their profile
```

### Verification (Admin)

Admin updates status in Supabase:

```typescript
// Admin updates
UPDATE videos SET status = 'verified' WHERE id = videoId

// Triggers:
1. Points credited (400 pts)
2. Notification sent
3. User sees real-time update (via realtime)
```

### Video Feed (Reels-style)

- Vertical FlatList with snap scrolling
- Auto-play video in viewport
- Real-time like count updates
- Double tap to like
- Comment sheet (bottom modal)
- Verified badge on creator

---

## 📝 FILES TO UPDATE/REPLACE

### New Files (Created):
```
✅ SUPABASE_MIGRATIONS_COMPLETE.sql
✅ contexts/WalletContext.new.tsx
✅ contexts/DailyRewardsContext.new.tsx
✅ components/StoriesBar.new.tsx
✅ components/InteractiveDailyRewards.new.tsx
✅ app/(tabs)/_layout.new.tsx
✅ types/database.ts (already updated)
```

### Files to Update (Instructions):
```
📝 contexts/ProfileContext.tsx - Add avatar_url sync
📝 contexts/AuthContext.tsx - Fix onboarding redirect logic
📝 app/(tabs)/(home)/index.tsx - Use new StoriesBar & InteractiveDailyRewards
📝 supabase.ts - Already correct, verify config
```

### Optional Enhancements:
```
🎨 Create video reels component
🎨 Create referral share screen
🎨 Create points history screen
🎨 Add notification toast system
```

---

## ✅ VERIFICATION CHECKLIST

After implementation, verify:

- [ ] SQL migrations run without errors
- [ ] Storage buckets created and accessible
- [ ] Realtime enabled on tables
- [ ] WalletContext loads and updates in real-time
- [ ] Daily rewards sync with Supabase
- [ ] StoriesBar shows circular avatars with rings
- [ ] InteractiveDailyRewards shows glowing card
- [ ] Bottom nav has 5 tabs (no Favorites)
- [ ] Auth persists after app restart
- [ ] Profile data syncs immediately
- [ ] Onboarding redirects properly
- [ ] Points history displays on screen
- [ ] Streak counter updates real-time
- [ ] No "undefined" values in contexts

---

## 🚀 DEPLOYMENT

1. **Test thoroughly on Android and iOS**
2. **Check real-time before production**
3. **Verify RLS policies allow proper access**
4. **Test with slow network (simulate delays)**
5. **Load test real-time with multiple users**

---

## 📞 SUPPORT

For issues:
- Check Supabase logs
- Verify RLS policies
- Test realtime with Supabase client
- Check network connectivity
- Review AsyncStorage for session persistence

---

Generated: 2026-03-19
Version: 1.0 - Production Ready
