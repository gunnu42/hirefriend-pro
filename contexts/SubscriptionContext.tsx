import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabase'
import { useAuth } from './AuthContext'
import type { Database } from '@/types/database'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

interface SubscriptionContextType {
  subscription: Subscription | null
  loading: boolean
  error: string | null
  upgradeToPremium: (paymentMethodId?: string) => Promise<void>
  downgradeToFree: () => Promise<void>
  usedConnects: () => Promise<void>
  getRemainingConnects: () => number
  canMessage: () => boolean
  canViewStories: () => boolean
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const { user } = useAuth()

  // Set userId from AuthContext
  useEffect(() => {
    setUserId(user?.id ?? null)
  }, [user?.id])

  // Load subscription
  const loadSubscription = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)

      let { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (subError && subError.code === 'PGRST116') {
        // Subscription doesn't exist, create free plan
        const { data: newSub, error: createError } = await supabase
          .from('subscriptions')
          .insert([
            {
              user_id: userId,
              plan: 'free',
              status: 'active',
            },
          ] as any)
          .select()
          .single()

        if (createError) throw createError
        subData = newSub
      } else if (subError) {
        throw subError
      }

      setSubscription(subData)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load subscription'
      setError(message)
      console.error('Error loading subscription:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    if (userId) {
      loadSubscription()
    }
  }, [userId, loadSubscription])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`subscription:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setSubscription(payload.new as Subscription)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const upgradeToPremium = useCallback(
    async (paymentMethodId?: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        // Create payment transaction
        const { data: transaction, error: txError } = await supabase
          .from('payment_transactions')
          .insert([
            {
              user_id: userId,
              amount: 999, // ₹999 premium plan
              currency: 'INR',
              transaction_type: 'subscription',
              payment_method_id: paymentMethodId,
              status: 'completed',
            },
          ] as any)
          .select()
          .single()

        if (txError) throw txError

        // Update subscription to premium
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1)

        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            plan: 'premium',
            status: 'active',
            end_date: endDate.toISOString(),
            recurring_enabled: true,
            connect_limit: 100,
            connects_used: 0,
            payment_method_id: paymentMethodId,
          })
          .eq('user_id', userId)

        if (subError) throw subError

        // Create notification
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: userId,
              notification_type: 'subscription',
              title: 'Welcome to Premium',
              message: 'You now have unlimited messaging and 100 connects/month',
            },
          ] as any)

        // Reload subscription
        await loadSubscription()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upgrade'
        setError(message)
        throw err
      }
    },
    [userId, loadSubscription]
  )

  const downgradeToFree = useCallback(async () => {
    if (!userId) throw new Error('User not authenticated')

    try {
      setError(null)

      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'active',
          end_date: null,
          recurring_enabled: false,
          connect_limit: 10,
          connects_used: 0,
        })
        .eq('user_id', userId)

      if (error) throw error

      await loadSubscription()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to downgrade'
      setError(message)
      throw err
    }
  }, [userId, loadSubscription])

  const usedConnects = useCallback(async () => {
    if (!subscription) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          connects_used: subscription.connects_used + 1,
        })
        .eq('user_id', userId)

      if (error) throw error
    } catch (err) {
      console.error('Error using connect:', err)
    }
  }, [subscription, userId])

  const getRemainingConnects = useCallback(() => {
    if (!subscription) return 0
    return Math.max(0, subscription.connect_limit - subscription.connects_used)
  }, [subscription])

  const canMessage = useCallback(() => {
    return subscription?.plan === 'premium' && subscription?.status === 'active'
  }, [subscription])

  const canViewStories = useCallback(() => {
    return subscription?.plan === 'premium' && subscription?.status === 'active'
  }, [subscription])

  const refreshSubscription = useCallback(async () => {
    await loadSubscription()
  }, [loadSubscription])

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        upgradeToPremium,
        downgradeToFree,
        usedConnects,
        getRemainingConnects,
        canMessage,
        canViewStories,
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

// Export type for convenience
export type { Subscription }
