import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabase'
import { useAuth } from './AuthContext'
import type { Database } from '@/types/database'

export type SubscriptionPlan = 'free' | 'silver' | 'gold' | 'platinum'
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed'

export interface PlanDetails {
  id: SubscriptionPlan
  name: string
  price: number
  connects: number
  tag?: string
  features: string[]
  monthlyPrice?: number
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    connects: 2,
    features: ['2 Profile Connects (lifetime demo)'],
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    price: 1800,
    connects: 25,
    features: ['25 Connects'],
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    price: 3500,
    connects: 60,
    tag: 'Most Popular',
    features: ['60 Connects'],
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum',
    price: 5000,
    connects: 250,
    tag: 'Best Value',
    features: ['250 Connects'],
  },
}

export interface PaymentSession {
  orderId: string
  userId: string
  planType: SubscriptionPlan
  amount: number
  status: PaymentStatus
  createdAt: string
  expiresAt?: string
  signature?: string
}

interface SubscriptionContextType {
  // Current subscription state
  currentPlan: SubscriptionPlan
  connectsRemaining: number
  connectsTotal: number
  subscriptionActive: boolean
  subscriptionExpiry?: string
  autoRenewEnabled: boolean
  walletBalance: number
  kycStatus: 'draft' | 'pending' | 'verified' | 'rejected' | 'none'
  
  // Payment state
  paymentStatus: PaymentStatus
  pendingPayment: PaymentSession | null
  lastPaymentDate?: string
  
  // Plan info
  planDetails: PlanDetails
  
  // Loading & Error
  loading: boolean
  error: string | null
  
  // Actions
  selectPlan: (plan: SubscriptionPlan) => Promise<void>
  initiatePayment: (plan: SubscriptionPlan) => Promise<PaymentSession>
  verifyPayment: (orderId: string, signature: string) => Promise<boolean>
  useConnect: () => Promise<void>
  claimDailyReward: () => Promise<void>
  uploadVlog: () => Promise<void>
  setAutoRenew: (enabled: boolean) => Promise<void>
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan>('free')
  const [connectsRemaining, setConnectsRemaining] = useState(2)
  const [connectsTotal, setConnectsTotal] = useState(2)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | undefined>()
  const [autoRenewEnabled, setAutoRenewEnabled] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [kycStatus, setKycStatus] = useState<'draft' | 'pending' | 'verified' | 'rejected' | 'none'>('none')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending')
  const [pendingPayment, setPendingPayment] = useState<PaymentSession | null>(null)
  const [lastPaymentDate, setLastPaymentDate] = useState<string | undefined>()
  const [loading, setLoading] = useState(false) // Start with false for instant render
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const { user, session } = useAuth()

  // Set userId from AuthContext
  useEffect(() => {
    setUserId(user?.id ?? null)
  }, [user?.id])


  // Load subscription data from users table
  useEffect(() => {
    if (!userId) return

    const loadUserData = async () => {
      try {
        const { data: user, error: err } = await supabase
          .from('users')
          .select('plan_type, connects_left, wallet_balance, subscription_active, auto_renew_enabled')
          .eq('id', userId)
          .single()

        if (err) {
          console.warn('Failed to load user data:', err)
          return
        }

        if (user) {
          setCurrentPlan((user.plan_type as SubscriptionPlan) || 'free')
          setConnectsRemaining(user.connects_left || 2)
          setConnectsTotal(SUBSCRIPTION_PLANS[(user.plan_type as SubscriptionPlan) || 'free'].connects)
          setSubscriptionActive(user.subscription_active || false)
          setAutoRenewEnabled(user.auto_renew_enabled || false)
          setWalletBalance(user.wallet_balance || 0)
        }

        // Setup realtime listener for users table
        const channel = supabase
          .channel('users')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `id=eq.${userId}`,
            },
            (payload: any) => {
              const updated = payload.new as any
              if (updated) {
                setCurrentPlan((updated.plan_type as SubscriptionPlan) || 'free')
                setConnectsRemaining(updated.connects_left || 2)
                setConnectsTotal(SUBSCRIPTION_PLANS[(updated.plan_type as SubscriptionPlan) || 'free'].connects)
                setSubscriptionActive(updated.subscription_active || false)
                setAutoRenewEnabled(updated.auto_renew_enabled || false)
                setWalletBalance(updated.wallet_balance || 0)
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      } catch (err) {
        console.warn('Failed to setup realtime:', err)
      }
    }

    loadUserData()
  }, [userId])

  const selectPlan = useCallback(
    async (plan: SubscriptionPlan) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        // This is called before payment - just sets pending state
        const now = new Date()
        const expiresAt = new Date(now.getTime() + 15 * 60000) // 15 min expiry

        const session: PaymentSession = {
          orderId: `ORD-${Date.now()}-${userId.slice(0, 8)}`,
          userId,
          planType: plan,
          amount: SUBSCRIPTION_PLANS[plan].price,
          status: 'pending',
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        }

        setPendingPayment(session)
        setPaymentStatus('pending')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to select plan'
        setError(message)
        throw err
      }
    },
    [userId]
  )

  const initiatePayment = useCallback(
    async (plan: SubscriptionPlan): Promise<PaymentSession> => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)
        setLoading(true)

        // Call Edge Function to create payment session
        const { data, error } = await supabase.functions.invoke('create_payment_session', {
          body: {
            userId,
            planType: plan,
            amount: SUBSCRIPTION_PLANS[plan].price,
          },
        })

        if (error) throw error

        const paymentSession = data as PaymentSession

        setPendingPayment(paymentSession)
        setPaymentStatus('processing')

        return paymentSession
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initiate payment'
        setError(message)
        setPaymentStatus('failed')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  const verifyPayment = useCallback(
    async (orderId: string, signature: string): Promise<boolean> => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)
        setLoading(true)

        // Call Edge Function to verify payment
        const { data, error } = await supabase.functions.invoke('verify_payment', {
          body: {
            userId,
            orderId,
            signature,
          },
        })

        if (error) {
          setPaymentStatus('failed')
          return false
        }

        const result = data as { success: boolean }

        if (result.success) {
          setPaymentStatus('success')
          // Wallet will update via realtime subscription
          return true
        } else {
          setPaymentStatus('failed')
          return false
        }
      } catch (err) {
        console.error('Error verifying payment:', err)
        setPaymentStatus('failed')
        return false
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  const useConnect = useCallback(async () => {
    if (!userId || connectsRemaining <= 0) throw new Error('No connects remaining')

    try {
      setError(null)

      // Call Edge Function to use connect
      const { error } = await supabase.functions.invoke('use_connect', {
        body: {
          userId,
        },
      })

      if (error) throw error

      // State will update via realtime subscription
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to use connect'
      setError(message)
      throw err
    }
  }, [userId, connectsRemaining])

  const claimDailyReward = useCallback(async () => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)

      // Call Edge Function to claim daily reward
      const { error } = await supabase.functions.invoke('claim_daily_reward', {
        body: {
          userId,
        },
      })

      if (error) throw error

      // Wallet updates via realtime subscription
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to claim daily reward'
      setError(message)
      throw err
    }
  }, [userId])

  const uploadVlog = useCallback(async () => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)

      const token = session?.access_token

      const response = await fetch(
        'https://your-function-url.cloudfunctions.net/uploadVlog',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to upload vlog')
      }

      // Wallet updates via realtime subscription
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload vlog'
      setError(message)
      throw err
    }
  }, [userId])

  const setAutoRenew = useCallback(
    async (enabled: boolean) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        const { error: err } = await supabase
          .from('users')
          .update({ auto_renew_enabled: enabled })
          .eq('id', userId)

        if (err) throw err

        setAutoRenewEnabled(enabled)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update auto-renew'
        setError(message)
        throw err
      }
    },
    [userId]
  )

  const refreshSubscription = useCallback(async () => {
    if (!userId) return

    try {
      const { data: subscription, error: err } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!err && subscription) {
        setCurrentPlan((subscription.plan as SubscriptionPlan) || 'free')
        setConnectsTotal(subscription.connect_limit || 2)
        setConnectsRemaining((subscription.connect_limit || 2) - (subscription.connects_used || 0))
        setSubscriptionActive(subscription.status === 'active')
      }
    } catch (err) {
      console.error('Error refreshing subscription:', err)
    }
  }, [userId])

  const planDetails = SUBSCRIPTION_PLANS[currentPlan]

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        connectsRemaining,
        connectsTotal,
        subscriptionActive,
        subscriptionExpiry,
        autoRenewEnabled,
        walletBalance,
        kycStatus,
        paymentStatus,
        pendingPayment,
        lastPaymentDate,
        planDetails,
        loading,
        error,
        selectPlan,
        initiatePayment,
        verifyPayment,
        useConnect,
        claimDailyReward,
        uploadVlog,
        setAutoRenew,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider')
  }
  return context
}

export type { SubscriptionContextType }
