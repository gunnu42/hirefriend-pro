# HireFriend Production Setup - Quick Checklist

Complete this checklist to deploy HireFriend to production.

---

## Phase 0: Prerequisites

- [ ] Supabase account created
- [ ] Supabase project initialized
- [ ] Expo project set up locally
- [ ] Node.js 18+ installed
- [ ] React Native development environment configured

---

## Phase 1: Database & Backend (2-3 hours)

### 1.1 Database Schema
- [ ] Open [Supabase Dashboard](https://app.supabase.com)
- [ ] Go to **SQL Editor**
- [ ] Copy `database_schema.sql` contents
- [ ] Execute the query
- [ ] Verify all 24 tables created: `SELECT * FROM pg_tables WHERE schemaname='public'`

### 1.2 Row Level Security
- [ ] Go to **SQL Editor**
- [ ] Copy `rls_policies.sql` contents
- [ ] Execute the query
- [ ] Verify RLS enabled on all tables
- [ ] Test policies with test queries

### 1.3 Storage Buckets
- [ ] Go to **Storage** → **Buckets**
- [ ] Create bucket: `profile-images` (public)
- [ ] Create bucket: `kyc-documents` (private)
- [ ] Create bucket: `vlog-videos` (public)
- [ ] Set correct permissions on each

### 1.4 Authentication Settings
- [ ] Go to **Authentication** → **Providers**
- [ ] Enable "Email"
- [ ] Enable "Phone" (SMS)
- [ ] Go to **Email Templates**
- [ ] Customize welcome and OTP emails (optional)
- [ ] Set redirect URLs: `exp://`, `hirefriend.app`, etc.

### 1.5 Realtime Configuration
- [ ] Go to **Database** → **Replication**
- [ ] Enable Realtime for:
  - [ ] wallets
  - [ ] wallet_transactions
  - [ ] messages
  - [ ] conversations
  - [ ] notifications
  - [ ] subscriptions
  - [ ] connections

### 1.6 Edge Functions
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Create functions directory: `mkdir -p supabase/functions`
- [ ] Create subdirectories for each function:
  - `process-wallet-transaction`
  - `validate-onboarding-step`
  - `process-payment`
  - `create-review-reward`
  - `award-vlog-points`
- [ ] Copy code from `edge_functions_reference.sql`
- [ ] Deploy all functions

---

## Phase 2: Frontend Setup (2-3 hours)

### 2.1 Environment Variables
- [ ] Create `.env.local`:
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://vekguvhzvudcerubffnv.supabase.co
  EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_gapEWbq_U-QygR7DVOdvvQ_EHtauG65
  ```
- [ ] Create `.env.production`:
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://your-prod-url.supabase.co
  EXPO_PUBLIC_SUPABASE_KEY=your_production_key
  ```

### 2.2 Dependencies
- [ ] Run: `npm install`
- [ ] Verify no errors

### 2.3 Context Setup
- [ ] Update `/contexts/AuthContext.tsx` ✓ (provided)
- [ ] Update `/contexts/WalletContext.production.tsx` ✓ (provided)
- [ ] Update `/contexts/SubscriptionContext.tsx` ✓ (provided)
- [ ] Create `/contexts/NotificationContext.tsx` (TODO)
- [ ] Create `/contexts/ConnectionContext.tsx` (TODO)
- [ ] Create `/contexts/MessagingContext.tsx` (TODO)

### 2.4 Type Generation
- [ ] Update `/types/database.ts` with Supabase types ✓ (provided)
- [ ] Verify TypeScript compilation: `npm run typecheck`

### 2.5 Configuration
- [ ] Update `/constants/config.ts` ✓ (provided)
- [ ] Review all constants
- [ ] Update feature flags as needed

### 2.6 Layout Configuration
Update `app/_layout.tsx` to wrap all providers:
```typescript
import { AuthProvider } from '@/contexts/AuthContext'
import { WalletProvider } from '@/contexts/WalletContext.production'
import { SubscriptionProvider } from '@/contexts/SubscriptionContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <WalletProvider>
        <SubscriptionProvider>
          {/* Your navigation components */}
        </SubscriptionProvider>
      </WalletProvider>
    </AuthProvider>
  )
}
```

---

## Phase 3: Screen Implementation (4-6 hours)

### 3.1 Authentication Screens
- [ ] Update `app/login.tsx` with email/OTP signin
- [ ] Update `app/signup.tsx` with email/phone signup
- [ ] Create `app/forgot-password.tsx`
- [ ] Test auth flows end-to-end

### 3.2 Onboarding Screens
- [ ] Create `app/onboarding/step1.tsx` (Personal Identity)
- [ ] Create `app/onboarding/step2.tsx` (Vibe & Interests)
- [ ] Create `app/onboarding/step3.tsx` (Service Mode)
- [ ] Create `app/onboarding/step4.tsx` (Media & KYC)
- [ ] Integrate backend validation on each step
- [ ] Test all 4 steps

### 3.3 Core Screens
- [ ] Update profile display screens
- [ ] Update wallet/points display
- [ ] Update subscription screen
- [ ] Create messaging UI
- [ ] Create connections list
- [ ] Create bookings screen

### 3.4 Features
- [ ] Implement vlog upload
- [ ] Implement reviews
- [ ] Implement notifications
- [ ] Implement blocking users
- [ ] Implement reporting users

---

## Phase 4: Testing (2-3 hours)

### 4.1 Unit Tests
- [ ] Test context hooks
- [ ] Test utility functions
- [ ] Test validation functions

### 4.2 Integration Tests
- [ ] Test signup → onboarding flow
- [ ] Test wallet points update
- [ ] Test subscription upgrade
- [ ] Test messaging realtime
- [ ] Test notifications realtime

### 4.3 Security Tests
- [ ] Verify RLS blocks unauthorized access
- [ ] Test user can only see own data
- [ ] Verify admin functions require authorization
- [ ] Test wallet cannot be manipulated client-side

### 4.4 Performance Tests
- [ ] Check realtime message latency (<100ms)
- [ ] Check wallet update latency (<100ms)
- [ ] Check storage file uploads speed
- [ ] Check API response times

---

## Phase 5: Deployment (2-4 hours)

### 5.1 Build Configuration
- [ ] Update `app.json` with final app name/icon
- [ ] Configure app version in `package.json`
- [ ] Set up Android signing
- [ ] Set up iOS signing

### 5.2 EAS Build
- [ ] Create EAS account: `eas build --platform android`
- [ ] Build Android APK/AAB
- [ ] Build iOS IPA
- [ ] Download builds

### 5.3 App Store Submission
- [ ] Google Play Store: Upload APK/AAB
- [ ] Apple App Store: Upload IPA
- [ ] Fill app store listings
- [ ] Configure pricing/availability
- [ ] Submit for review

### 5.4 Production Environment
- [ ] Set production Supabase URL
- [ ] Enable all monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up analytics
- [ ] Enable backup schedules

---

## Phase 6: Post-Launch Monitoring (Ongoing)

### 6.1 Metrics to Monitor
- [ ] Daily active users
- [ ] Signup completion rate
- [ ] Feature adoption rate
- [ ] Error rate
- [ ] API response times
- [ ] Realtime message latency

### 6.2 User Feedback
- [ ] Monitor app store reviews
- [ ] Collect in-app feedback
- [ ] Track bug reports
- [ ] Prioritize feature requests

### 6.3 Performance Optimization
- [ ] Optimize slow queries
- [ ] Reduce API response times
- [ ] Improve realtime latency
- [ ] Optimize storage costs

---

## Critical Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `database_schema.sql` | Database tables & triggers | ✓ Created |
| `rls_policies.sql` | Row level security policies | ✓ Created |
| `edge_functions_reference.sql` | Backend functions | ✓ Created |
| `types/database.ts` | TypeScript types | ✓ Created |
| `contexts/AuthContext.tsx` | Authentication logic | ✓ Created |
| `contexts/WalletContext.production.tsx` | Wallet & points | ✓ Created |
| `contexts/SubscriptionContext.tsx` | Subscription logic | ✓ Created |
| `constants/config.ts` | App configuration | ✓ Created |
| `supabase.ts` | Supabase client setup | ✓ Updated |
| `PRODUCTION_IMPLEMENTATION_GUIDE.md` | Complete guide | ✓ Created |
| `EXAMPLE_SCREENS.md` | Example implementations | ✓ Created |

---

## Common Issues & Solutions

### RLS Blocking All Queries
**Problem:** Getting "permission denied" on all queries  
**Solution:** Ensure RLS policies are created AFTER enabling RLS on tables
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
-- Verify policies exist
SELECT * FROM pg_policies;
```

### Realtime Not Working
**Problem:** No realtime updates received  
**Solution:** Enable Realtime in Database → Replication
```sql
-- Check realtime is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Edge Functions 404
**Problem:** Getting 404 when calling edge functions  
**Solution:** Verify function is deployed and URL is correct
```bash
supabase functions list
supabase functions logs function-name
```

### Wallet Not Updating
**Problem:** Points not updating after transaction  
**Solution:** Check trigger is created
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_update_wallet%';
```

---

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation]( https://docs.expo.dev)
- [HireFriend Implementation Guide](./PRODUCTION_IMPLEMENTATION_GUIDE.md)

---

## Sign-Off Checklist

- [ ] All database tables created and tested
- [ ] All RLS policies active
- [ ] All Edge Functions deployed
- [ ] All contexts integrated
- [ ] All screens implemented
- [ ] All features tested
- [ ] Security audit completed
- [ ] Performance requirements met
- [ ] Documentation reviewed
- [ ] Ready for production

---

**Start Date:** _________________  
**Completion Date:** _________________  
**Lead Developer:** _________________  
**Reviewed By:** _________________
