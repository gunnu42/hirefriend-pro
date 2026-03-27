# HireFriend Production Implementation Guide

Complete production-ready React Native + Expo app with Supabase backend. This guide covers database setup, authentication, features, and deployment.

---

## 📋 Table of Contents

1. [Setup Instructions](#setup-instructions)
2. [Database Initialization](#database-initialization)
3. [Authentication System](#authentication-system)
4. [Feature Implementation](#feature-implementation)
5. [Real-Time Features](#real-time-features)
6. [Deployment Checklist](#deployment-checklist)

---

## Setup Instructions

### 1. Environment Variables

Create `.env.local` and `.env.production` files in the workspace root:

```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://vekguvhzvudcerubffnv.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_gapEWbq_U-QygR7DVOdvvQ_EHtauG65
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Initialize Supabase CLI

```bash
npm install -g supabase
supabase init
```

---

## Database Initialization

### Step 1: Create Database Schema

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Go to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `database_schema.sql`
5. Execute the query

**Expected Result:** All 24 tables created with indexes and triggers

### Step 2: Apply Row Level Security Policies

After schema creation:

1. Go to **SQL Editor** again
2. Copy entire contents of `rls_policies.sql`
3. Execute the query

**Verify RLS is enabled:** Go to `Authentication` → `Policies` and confirm all tables have policies

### Step 3: Create Storage Buckets

Go to **Storage** → **Buckets** and create:

- `profile-images` (public)
- `kyc-documents` (private)
- `vlog-videos` (public)

---

## Authentication System

### Email + Password Authentication

```typescript
import { useAuth } from '@/contexts/AuthContext'

export function SignUpScreen() {
  const { signUpEmail } = useAuth()
  
  const handleSignUp = async () => {
    await signUpEmail('user@example.com', 'password123', '+919876543210')
  }
}
```

### Phone OTP Authentication

```typescript
const { sendPhoneOTP, verifyPhoneOTP } = useAuth()

// Send OTP to phone
await sendPhoneOTP('+919876543210')

// Verify OTP
await verifyPhoneOTP('+919876543210', '123456')
```

### Email OTP Authentication

```typescript
const { sendEmailOTP, verifyEmailOTP } = useAuth()

await sendEmailOTP('user@example.com')
await verifyEmailOTP('user@example.com', '123456')
```

---

## Feature Implementation

### 1. 4-Step Onboarding

Backend validation ensures data integrity. Each step must pass backend validation before proceeding.

**Step 1: Personal Identity**
```typescript
// Input: full_name, date_of_birth, gender, current_city
// Validation: age >= 18
// Edge Function: validate-onboarding-step with step=1
```

**Step 2: Vibe & Interests**
```typescript
// Input: bio (min 50 chars), interests (min 2), languages
// Saves to: user_personality, user_interests, user_languages
// Edge Function: validate-onboarding-step with step=2
```

**Step 3: Service Mode & Pricing**
```typescript
// Input: service_mode (local_friend/virtual_friend), hourly_rate
// Saves to: service_pricing table
// Edge Function: validate-onboarding-step with step=3
```

**Step 4: Media & KYC**
```typescript
// Upload: 3+ photos, 1 selfie, 1 ID document
// Saves to: profile_media, kyc_verifications
// Edge Function: validate-onboarding-step with step=4
```

### 2. Wallet & Gamification

```typescript
import { useWallet } from '@/contexts/WalletContext.production'

export function WalletScreen() {
  const { wallet, addPoints, transactions } = useWallet()
  
  return (
    <View>
      <Text>Balance: {wallet?.points_balance} pts</Text>
      <FlatList
        data={transactions}
        renderItem={({ item }) => (
          <Text>{item.transaction_type}: +{item.points}</Text>
        )}
      />
    </View>
  )
}
```

**Points Rules:**
- Review received: +50 points (via trigger)
- Vlog upload: +400 points (via edge function)
- Booking completed: tbd
- Referral: tbd

### 3. Subscriptions & Payments

```typescript
import { useSubscription } from '@/contexts/SubscriptionContext'

export function SubscriptionScreen() {
  const { subscription, upgradeToPremium, getRemainingConnects } = useSubscription()
  
  if (subscription?.plan === 'free') {
    return <Button onPress={() => upgradeToPremium()}>Upgrade to Premium</Button>
  }
  
  return <Text>Connects Left: {getRemainingConnects()}</Text>
}
```

**Plans:**
- **Free:** 10 connects/month, no messaging, read-only
- **Premium:** 100 connects/month, unlimited messaging, stories access, ₹999/month

### 4. Messaging (Real-Time)

```typescript
// Requires: Both users on premium + connected status
// Realtime channel: `messages:{conversation_id}`

const { data: conversation } = await supabase
  .from('conversations')
  .insert({ user1_id: userId, user2_id: targetId })
  .select()
  .single()

// Subscribe to new messages
const channel = supabase
  .channel(`messages:${conversation.id}`)
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      // Update UI with new message
    }
  )
  .subscribe()
```

### 5. Connections & Reviews

```typescript
// Request connection
const { error } = await supabase
  .from('connections')
  .insert({ requester_id: myId, receiver_id: targetId })

// Accept connection
await supabase
  .from('connections')
  .update({ status: 'accepted' })
  .match({ requester_id, receiver_id })

// Leave review
const { error } = await supabase
  .from('reviews')
  .insert({
    reviewer_id: myId,
    receiver_id: targetId,
    rating: 5,
    comment: 'Great friend!'
  })

// Edge function auto-awards 50 points to receiver
```

### 6. Notifications

Real-time notifications for:
- Nearby users
- Connection requests
- Reviews received
- Points earned
- Connect limits

```typescript
// Subscribe to notifications
const channel = supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'notifications' },
    (payload) => setNotifications(prev => [payload.new, ...prev])
  )
  .subscribe()
```

---

## Real-Time Features

### Wallet Updates

```typescript
// Table: wallets
// Trigger: wallet_transactions INSERT → auto-update points_balance
// Realtime channel: `wallet:{user_id}`

const channel = supabase
  .channel(`wallet:${userId}`)
  .on('postgres_changes',
    { event: 'UPDATE', table: 'wallets', filter: `user_id=eq.${userId}` },
    (payload) => setWallet(payload.new)
  )
  .subscribe()
```

### Conversations & Messages

```typescript
// Table: messages
// Auto-triggers: updates conversations.last_message_at
// Realtime channels: `conversations:{userId}`, `messages:{conversation_id}`

// Receive new conversation
const convChannel = supabase
  .channel(`conversations:${userId}`)
  .on('postgres_changes',
    { event: 'INSERT', table: 'conversations' },
    (payload) => setConversations(prev => [payload.new, ...prev])
  )
  .subscribe()

// Receive new messages
const msgChannel = supabase
  .channel(`messages:${conversationId}`)
  .on('postgres_changes',
    { event: 'INSERT', table: 'messages' },
    (payload) => setMessages(prev => [payload.new, ...prev])
  )
  .subscribe()
```

### Notifications

```typescript
// Table: notifications
// Events: INSERT, UPDATE (for read status)
// Realtime channel: `notifications:{user_id}`
```

---

## Edge Functions Deployment

### Deploy Functions

```bash
# Process wallet transactions
supabase functions deploy process-wallet-transaction

# Validate onboarding steps
supabase functions deploy validate-onboarding-step

# Process payments
supabase functions deploy process-payment

# Create reviews and reward
supabase functions deploy create-review-reward

# Award vlog points
supabase functions deploy award-vlog-points
```

### Test Edge Function

```bash
curl -X POST http://localhost:54321/functions/v1/process-wallet-transaction \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "transaction_type": "review_received",
    "points": 50,
    "source": "review"
  }'
```

---

## Deployment Checklist

### Pre-Production

- [ ] All database tables created and RLS policies applied
- [ ] All storage buckets configured
- [ ] Auth email templates customized (Settings → Email Templates)
- [ ] Auth redirect URLs configured
- [ ] All Edge Functions deployed
- [ ] SMTP configured for emails (optional but recommended)
- [ ] Realtime enabled for all tables

### Environment Variables

Set in Vercel/Cloud:
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_KEY
EXPO_PUBLIC_SURFACE_ROLE_KEY (for admin operations)
```

### Testing

```bash
# Run in development
npm run start

# Test on physical device
npm run start -- --tunnel

# Build for EAS
eas build --platform android
eas build --platform ios
```

### Monitoring

1. **Supabase Dashboard Metrics:**
   - Database connections
   - API requests/response times
   - Storage usage
   - Auth logins

2. **Error Tracking:**
   - Edge Function logs: `supabase functions logs function-name`
   - Database slowquery logs
   - RLS violations

3. **Performance:**
   - Monitor wallet_transactions insert latency (should be <100ms)
   - Monitor message insert latency (should be <50ms)
   - Check realtime channel subscribers

---

## Common Issues & Solutions

### Issue: RLS denying access to own data

**Solution:** Ensure RLS policies use `auth.uid()` correctly

```sql
-- Verify policy is using auth.uid()
SELECT * FROM pg_policies WHERE tablname = 'users';
```

### Issue: Realtime updates not working

**Solution:** Check Realtime is enabled for the table

```sql
-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Issue: Edge Function not deploying

**Solution:** Ensure function signature is correct

```typescript
// Must export default Deno.serve handler
Deno.serve(async (req) => {
  // ...
  return new Response(JSON.stringify({}), { status: 200 })
})
```

### Issue: Wallet not updating after transaction

**Solution:** Check trigger is created

```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_update_wallet%';
```

---

## API Reference

### Context Hooks

```typescript
// Auth
const { user, session, signUpEmail, signInEmail, sendPhoneOTP, signOut } = useAuth()

// Wallet
const { wallet, addPoints, transactions } = useWallet()

// Subscription
const { subscription, upgradeToPremium, getRemainingConnects } = useSubscription()
```

### Database Queries

All database interactions go through Supabase client in `supabase.ts`. RLS policies automatically enforce data isolation.

```typescript
import { supabase } from '@/supabase'

// Read user's own data
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', currentUserId)
  .single()

// Insert with RLS  
const { data } = await supabase
  .from('wallet_transactions')
  .insert({ user_id: currentUserId, ... })

// Realtime subscription
supabase
  .channel('table-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, payload => {})
  .subscribe()
```

---

## Support & Next Steps

**Next Phase (if needed):**
- [ ] Nearby Friends feature (geolocation + proximity queries)
- [ ] Stories feature (Instagram-like with blur)
- [ ] Vlogs system (video hosting)
- [ ] Admin dashboard
- [ ] Push notifications via FCM/OneSignal
- [ ] Stripe/Razorpay payment processing
- [ ] Analytics & reporting

For questions or issues, refer to:
- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)

---

**Created:** March 16, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
