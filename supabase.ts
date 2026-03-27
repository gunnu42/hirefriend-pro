import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://vekguvhzvudcerubffnv.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gapEWbq_U-QygR7DVOdvvQ_EHtauG65'

// ============================================================================
// Supabase Client with AsyncStorage for Expo
// ============================================================================

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: false,
  },
}) as unknown as any

// ============================================================================
// Storage Buckets Configuration
// ============================================================================

export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  KYC_DOCUMENTS: 'kyc-documents',
  VLOG_VIDEOS: 'vlog-videos',
} as const

// ============================================================================
// Edge Functions Endpoints
// ============================================================================

export const EDGE_FUNCTIONS = {
  PROCESS_WALLET_TRANSACTION: 'process-wallet-transaction',
  VALIDATE_ONBOARDING_STEP: 'validate-onboarding-step',
  PROCESS_PAYMENT: 'process-payment',
  CREATE_REVIEW_REWARD: 'create-review-reward',
  AWARD_VLOG_POINTS: 'award-vlog-points',
} as const

// ============================================================================
// Utility: Call Edge Function
// ============================================================================

export async function callEdgeFunction<T = any>(
  functionName: string,
  payload: any,
  token?: string
) {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Edge function failed')
    }

    return (await response.json()) as T
  } catch (error) {
    console.error(`Error calling edge function ${functionName}:`, error)
    throw error
  }
}

// ============================================================================
// Utility: Upload File to Storage
// ============================================================================

export async function uploadToStorage(
  bucket: string,
  path: string,
  file: Blob | File
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (error) throw error

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// ============================================================================
// Utility: Delete File from Storage
// ============================================================================

export async function deleteFromStorage(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

// ============================================================================
// Utility: Send OTP
// ============================================================================

export async function sendOTP(phone: string) {
  try {
    // Supabase will handle OTP generation and sending
    // This is a placeholder for the actual OTP service integration
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error sending OTP:', error)
    throw error
  }
}

// ============================================================================
// Utility: Verify OTP
// ============================================================================

export async function verifyOTP(phone: string, token: string) {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error verifying OTP:', error)
    throw error
  }
}

// ============================================================================
// Utility: Subscribe to Realtime Changes
// ============================================================================

export function subscribeToTable<T extends keyof Database['public']['Tables']>(
  table: T,
  callback: (payload: any) => void,
  filter?: any
) {
  return supabase
    .channel(`public:${table}:*`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table as string,
        ...filter,
      },
      callback
    )
    .subscribe()
}

// ============================================================================
// Utility: Get User Session
// ============================================================================

export async function getUserSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

// ============================================================================
// Utility: Sign Out
// ============================================================================

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// ============================================================================
// Utility: Get User Wallet
// ============================================================================

export async function getWallet(userId: string) {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If wallet doesn't exist, create one
      if (error.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert([{ user_id: userId }])
          .select()
          .single()

        if (createError) throw createError
        return newWallet
      }
      throw error
    }
    return data
  } catch (error) {
    console.error('Error getting wallet:', error)
    throw error
  }
}

// ============================================================================
// Utility: Get User Subscription
// ============================================================================

export async function getSubscription(userId: string) {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If subscription doesn't exist, create free plan
      if (error.code === 'PGRST116') {
        const { data: newSub, error: createError } = await supabase
          .from('subscriptions')
          .insert([
            {
              user_id: userId,
              plan: 'free',
              status: 'active',
              connect_limit: 10,
              connects_used: 0,
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        return newSub
      }
      throw error
    }
    return data
  } catch (error) {
    console.error('Error getting subscription:', error)
    throw error
  }
}

// ============================================================================
// Utility: Get User Profile with Relations
// ============================================================================

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        *,
        onboarding_profiles(*),
        user_interests(interest_id),
        user_languages(language_id),
        user_personality(*),
        service_pricing(*),
        profile_media(*),
        kyc_verifications(*),
        wallets(*),
        subscriptions(*),
        vlogs(*)
      `
      )
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

// ============================================================================
// Export Supabase Instance
// ============================================================================

export default supabase

