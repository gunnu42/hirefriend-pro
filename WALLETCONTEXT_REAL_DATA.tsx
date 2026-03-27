// COMPLETE REPLACEMENT for contexts/WalletContext.production.tsx
// This syncs ALL wallet data with real Supabase tables in real-time

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabase'
import type { Database } from '@/types/database'

type BillingRecord = Database['public']['Tables']['billing_history']['Row']

export interface PointTransaction {
  id: string
  type: 'attendance' | 'referral' | 'vlog' | 'review' | 'purchase' | 'penalty'
  amount: number
  description: string
  date: string
}

interface WalletContextType {
  points: number
  credits: number
  connectsRemaining: number
  connectsTotal: number
  subscription: string
  streak: number
  lastClaimDate: string | null
  transactions: PointTransaction[]
  billingHistory: BillingRecord[]
  totalReferrals: number
  referralPoints: number
  loading: boolean
  error: string | null
  canClaimToday: boolean
  claimDailyReward: (points: number) => Promise<void>
  addPoints: (points: number, type: string, description: string) => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [points, setPoints] = useState(0)
  const [credits, setCredits] = useState(0)
  const [connectsRemaining, setConnectsRemaining] = useState(5)
  const [connectsTotal, setConnectsTotal] = useState(5)
  const [subscription, setSubscription] = useState('free')
  const [streak, setStreak] = useState(0)
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([])
  const [totalReferrals, setTotalReferrals] = useState(0)
  const [referralPoints, setReferralPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }
      } catch (err) {
        console.error('[Wallet] Error getting user:', err)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUserId(session?.user?.id || null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Load wallet data from users table
  const loadWalletData = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      console.log('[Wallet] Loading wallet data for user:', userId)

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_balance, connects_left, connects_total, plan_type, current_streak, last_claim_date')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      if (userData) {
        setPoints(userData.wallet_balance ?? 0)
        setCredits(userData.wallet_balance ?? 0)
        setConnectsRemaining(userData.connects_left ?? 5)
        setConnectsTotal(userData.connects_total ?? 5)
        setSubscription(userData.plan_type ?? 'free')
        setStreak(userData.current_streak ?? 0)
        setLastClaimDate(userData.last_claim_date)
      }

      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wallet'
      setError(message)
      console.error('[Wallet] Error loading wallet:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Load transactions
  const loadTransactions = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error: err } = await supabase
        .from('wallet_transactions')
        .select('id, type, amount, description, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (err) throw err

      const formatted = (data || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: new Date(t.created_at).toISOString().split('T')[0],
      }))

      setTransactions(formatted)
    } catch (err) {
      console.error('[Wallet] Error loading transactions:', err)
    }
  }, [userId])

  // Load billing history
  const loadBillingHistory = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error: err } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (err) throw err
      setBillingHistory(data || [])
    } catch (err) {
      console.error('[Wallet] Error loading billing history:', err)
    }
  }, [userId])

  // Load referrals
  const loadReferrals = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error: err } = await supabase
        .from('referrals')
        .select('id, points_awarded')
        .eq('referrer_id', userId)
        .eq('status', 'completed')

      if (err) throw err

      const count = data?.length || 0
      const points = data?.reduce((sum: number, r: any) => sum + (r.points_awarded || 0), 0) || 0

      setTotalReferrals(count)
      setReferralPoints(points)
    } catch (err) {
      console.error('[Wallet] Error loading referrals:', err)
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    if (userId) {
      loadWalletData()
      loadTransactions()
      loadBillingHistory()
      loadReferrals()
    }
  }, [userId, loadWalletData, loadTransactions, loadBillingHistory, loadReferrals])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel(`wallet:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            const user = payload.new as any
            setPoints(user.wallet_balance ?? 0)
            setCredits(user.wallet_balance ?? 0)
            setConnectsRemaining(user.connects_left ?? 5)
            setConnectsTotal(user.connects_total ?? 5)
            setSubscription(user.plan_type ?? 'free')
            setStreak(user.current_streak ?? 0)
            setLastClaimDate(user.last_claim_date)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            const txn = payload.new as any
            setTransactions((prev) => [
              {
                id: txn.id,
                type: txn.type,
                amount: txn.amount,
                description: txn.description,
                date: new Date(txn.created_at).toISOString().split('T')[0],
              },
              ...prev,
            ])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'billing_history',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setBillingHistory((prev) => [payload.new as BillingRecord, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const canClaimToday = lastClaimDate !== new Date().toISOString().split('T')[0]

  const claimDailyReward = useCallback(
    async (points: number) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        const today = new Date().toISOString().split('T')[0]

        // Update wallet
        const newBalance = points + credits
        const { error: updateError } = await supabase
          .from('users')
          .update({
            wallet_balance: newBalance,
            current_streak: streak + 1,
            last_claim_date: today,
          })
          .eq('id', userId)

        if (updateError) throw updateError

        // Add transaction
        await supabase.from('wallet_transactions').insert([
          {
            user_id: userId,
            type: 'attendance',
            amount: points,
            description: 'Daily reward claimed',
          },
        ])

        setPoints(newBalance)
        setCredits(newBalance)
        setStreak(streak + 1)
        setLastClaimDate(today)
      } catch (err) {
        console.error('[Wallet] Error claiming reward:', err)
        throw err
      }
    },
    [userId, credits, streak]
  )

  const addPoints = useCallback(
    async (amount: number, type: string, description: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        const newBalance = points + amount

        // Update wallet
        const { error: updateError } = await supabase
          .from('users')
          .update({ wallet_balance: newBalance })
          .eq('id', userId)

        if (updateError) throw updateError

        // Add transaction
        await supabase.from('wallet_transactions').insert([
          {
            user_id: userId,
            type,
            amount,
            description,
          },
        ])

        setPoints(newBalance)
        setCredits(newBalance)
      } catch (err) {
        console.error('[Wallet] Error adding points:', err)
        throw err
      }
    },
    [userId, points]
  )

  return (
    <WalletContext.Provider
      value={{
        points,
        credits,
        connectsRemaining,
        connectsTotal,
        subscription,
        streak,
        lastClaimDate,
        transactions,
        billingHistory,
        totalReferrals,
        referralPoints,
        loading,
        error,
        canClaimToday,
        claimDailyReward,
        addPoints,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext)

  if (!context) {
    return {
      points: 0,
      credits: 0,
      connectsRemaining: 5,
      connectsTotal: 5,
      subscription: 'free',
      streak: 0,
      lastClaimDate: null,
      transactions: [],
      billingHistory: [],
      totalReferrals: 0,
      referralPoints: 0,
      loading: true,
      error: 'Wallet context not available',
      canClaimToday: false,
      claimDailyReward: async () => {},
      addPoints: async () => {},
    }
  }

  return context
}
