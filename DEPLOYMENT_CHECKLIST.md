# ✅ DEPLOYMENT CHECKLIST

## 🔴 CRITICAL PATH (Do This First!)

### Step 1: Deploy SQL Schema (2 min)
- [ ] Open Supabase Dashboard
- [ ] SQL Editor → New Query
- [ ] Copy entire `SUPABASE_ALL_MIGRATIONS.sql`
- [ ] Paste and click "Run"
- [ ] Verify no errors
- [ ] Check Database → Tables (should see: billing_history, referrals, daily_rewards, wallet_transactions)
- [ ] Check Storage → Buckets (should see: avatars bucket)

### Step 2: Update WalletContext (1 min)
- [ ] Backup: Copy contexts/WalletContext.production.tsx to contexts/WalletContext.production.tsx.bak
- [ ] Replace contents of contexts/WalletContext.production.tsx with contexts/WalletContext.new.tsx contents
- [ ] Save file
- [ ] Check for TypeScript errors (should be none)

### Step 3: Test App Boots
- [ ] Run: `npm start` or `expo start`
- [ ] App should launch without "Cannot destructure" or "undefined" errors
- [ ] Login screen appears
- [ ] If logged in, shows Profile screen

### Step 4: Test Login/Signup
- [ ] Signup with new email
- [ ] Verify user created in Supabase Auth
- [ ] Verify user profile in public.users table (should have full_name, phone, plan_type = 'free')
- [ ] Profile screen shows correct name (not "User")

### Step 5: Test Wallet Data
- [ ] Go to Wallet screen
- [ ] Should show points from wallet_balance column (not hardcoded 320)
- [ ] Should show streak from current_streak column (not hardcoded 3)
- [ ] Should show transactions from wallet_transactions table
- [ ] All should be real data from Supabase

### Step 6: Test Photo Upload
- [ ] Go to Edit Profile
- [ ] Click "Take Photo" or "Choose from Library"
- [ ] Select/take a photo
- [ ] Upload starts (should see loading indicator)
- [ ] After upload, profile photo appears
- [ ] Change profile photo in Supabase dashboard
- [ ] Go back to Profile screen
- [ ] Photo updates without app restart (real-time)

### Step 7: Test Daily Rewards
- [ ] Go to Daily Rewards / Wallet screen
- [ ] Click "Claim Reward"
- [ ] Points increase by reward amount
- [ ] Streak increases by 1
- [ ] Button disabled until next day
- [ ] Go to Supabase: wallet_transactions table shows transaction created
- [ ] Go to Supabase: users table shows updated wallet_balance

### Step 8: Test Real-Time Sync
- [ ] Open app on phone
- [ ] Open Supabase dashboard in browser
- [ ] In dashboard: Change any user field (wallet_balance, city, streak, etc.)
- [ ] Watch app UI update instantly without refresh
- [ ] Verify in users table that changes persisted

### Step 9: Test Session Persistence
- [ ] Logged into app
- [ ] Force close app completely (swipe up/kill process)
- [ ] Reopen app
- [ ] Should still be logged in (not at Login screen)
- [ ] All data (profile, wallet, rewards) should load correctly

### Step 10: Test Billing History
- [ ] Go to Billing History screen
- [ ] Should show real billing records (if user has any)
- [ ] If no records, should show empty state gracefully

### Step 11: Test Refer & Earn
- [ ] Go to Refer & Earn screen
- [ ] Should show real referral count from referrals table
- [ ] Should show real referral points earned
- [ ] If no referrals, should show 0

### Step 12: Test Navigation
- [ ] Bottom tab bar should have: Home, Explore, Bookings, Messages, Profile (5 tabs)
- [ ] Favorites tab should NOT appear in bottom bar
- [ ] Profile screen should have "Favorites" option in Account section
- [ ] Clicking Favorites from Profile navigates to /favorites

---

## 📋 SCREENS TO VERIFY

| Screen | Data Source | What to Check |
|--------|-------------|---------------|
| Profile | users table | Shows real name, avatar, city/state |
| Wallet | users + wallet_transactions | Shows real balance, streak, transactions |
| Daily Rewards | daily_rewards table | Can claim, updates streak/balance |
| Billing History | billing_history table | Shows real transactions |
| Refer & Earn | referrals table | Shows referral count & points |
| Edit Profile | users table + storage.avatars | Photo upload works, saves to storage |
| Home | users, bookings tables | Shows real friends, bookings |
| Bookings | bookings table | Shows real bookings |
| Messages | messages table | Shows real conversations |

---

## 🐛 TROUBLESHOOTING

### "Cannot destructure property X of undefined"
**Cause:** Old WalletContext returning undefined
**Fix:** Make sure WalletContext.production.tsx was replaced and imports correct
**Check:** `grep -r "const.*= useWallet()" app/` should use safe pattern

### App crashes on startup
**Cause:** SQL migration failed or database tables incomplete
**Fix:** Re-run SUPABASE_ALL_MIGRATIONS.sql in Supabase SQL Editor
**Check:** Verify all tables exist in Supabase dashboard

### Wallet shows 0 points after signup
**Cause:** New user hasn't been saved to public.users table
**Fix:** AuthContext should create profile record on signup
**Check:** Look in Supabase dashboard public.users table, verify new user row exists

### Photo upload fails
**Cause:** Storage bucket avatars not created or RLS policies wrong
**Fix:** Re-run the storage bucket section of SUPABASE_ALL_MIGRATIONS.sql
**Check:** Verify storage.buckets has "avatars" bucket

### Real-time updates not working
**Cause:** Realtime listeners not subscribed in WalletContext
**Fix:** Verify `.subscribe()` is called at end of channel setup
**Check:** In browser DevTools, network tab should show WebSocket to Supabase

### Still logged out after restart
**Cause:** AsyncStorage not persisting session
**Fix:** Verify supabase.ts has `persistSession: true` and `storage: AsyncStorage`
**Check:** Verify @react-native-async-storage/async-storage is installed

---

## 📞 SUPPORT

If deployment fails:

1. **Check the logs:** `npm start` shows errors
2. **Verify Supabase connection:** Try a simple query in SQL editor
3. **Check RLS policies:** Open each table → RLS policies → verify enabled
4. **Verify storage policies:** Storage → avatars bucket → Policies tab
5. **Rebuild app:** `npm install && npm start`
6. **Clear cache:** `rm -rf node_modules/.cache && npm install`

---

## ✨ POST-DEPLOYMENT

After all above passes ✅:

1. **Test Payment Flow** (if applicable)
   - Complete purchase flow
   - Verify billing_history created
   - Verify subscription updated

2. **Test Notifications**
   - Claim reward → should get notification
   - New booking → should get notification
   - New message → should show badge

3. **Monitor Supabase Logs** (Supabase dashboard)
   - Check for RLS policy violations
   - Check for SQL errors
   - Monitor real-time connections

4. **Performance Testing**
   - Open app with large dataset
   - Scroll/paginate through transactions (should be smooth)
   - Real-time listeners should not cause lag

5. **Production Deployment**
   - Build production bundle: `eas build`
   - Submit to App Store/Google Play
   - Monitor crash logs

---

**Status:** Ready for deployment ✅
**Last Updated:** [Current Session]
**Next Steps:** Follow checklist above in order

