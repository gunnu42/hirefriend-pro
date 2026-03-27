import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, callEdgeFunction } from '@/supabase'
import { useAuth } from './AuthContext'
import type { Database } from '@/types/database'

type Connection = Database['public']['Tables']['connections']['Row']
type Review = Database['public']['Tables']['reviews']['Row']
type BlockedUser = Database['public']['Tables']['blocked_users']['Row']

interface ConnectionContextType {
  connections: Connection[]
  reviews: Review[]
  blockedUsers: BlockedUser[]
  loading: boolean
  error: string | null
  sendConnectionRequest: (receiverId: string) => Promise<void>
  acceptConnection: (connectionId: string) => Promise<void>
  rejectConnection: (connectionId: string) => Promise<void>
  blockUser: (userId: string, reason?: string) => Promise<void>
  unblockUser: (userId: string) => Promise<void>
  isUserBlocked: (userId: string) => boolean
  getConnectionStatus: (userId: string) => string | null
  getPendingRequests: () => Connection[]
  getAcceptedConnections: () => Connection[]
  leaveReview: (reviewedId: string, rating: number, comment: string) => Promise<void>
  getUserReviews: (userId: string) => Review[]
  getAverageRating: (userId: string) => number
  hasReviewedUser: (userId: string) => boolean
  refreshConnections: () => Promise<void>
  refreshReviews: () => Promise<void>
  refreshBlockedUsers: () => Promise<void>
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth()
  const userId = user?.id
  const [connections, setConnections] = useState<Connection[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all data when user changes
  useEffect(() => {
    if (user?.id) {
      loadConnections()
      loadReviews()
      loadBlockedUsers()
    }
  }, [user?.id])

  const loadConnections = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (err) throw err
      setConnections(data || [])
    } catch (err) {
      console.error('Error loading connections:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const loadReviews = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error: err } = await supabase
        .from('reviews')
        .select('*')
        .or(`reviewer_id.eq.${userId},reviewed_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (err) throw err
      setReviews(data || [])
    } catch (err) {
      console.error('Error loading reviews:', err)
    }
  }, [userId])

  const loadBlockedUsers = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error: err } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', userId)

      if (err) throw err
      setBlockedUsers(data || [])
    } catch (err) {
      console.error('Error loading blocked users:', err)
    }
  }, [userId])

  const sendConnectionRequest = useCallback(
    async (receiverId: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        const { error: err } = await supabase
          .from('connections')
          .insert([{ requester_id: userId, receiver_id: receiverId, status: 'pending' }] as any)

        if (err) throw err

        // Create notification for receiver
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: receiverId,
              notification_type: 'connection_request',
              title: 'New Connection Request',
              message: 'Someone wants to connect with you!',
              related_user_id: userId,
            },
          ] as any)

        await loadConnections()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send request'
        setError(message)
        throw err
      }
    },
    [userId, loadConnections]
  )

  const acceptConnection = useCallback(
    async (connectionId: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        const { error: err } = await supabase
          .from('connections')
          .update({ status: 'accepted' })
          .eq('id', connectionId)

        if (err) throw err

        // Get connection to notify requester
        const conn = connections.find((c) => c.id === connectionId)
        if (conn) {
          await supabase
            .from('notifications')
            .insert([
              {
                user_id: conn.requester_id,
                notification_type: 'connection_accepted',
                title: 'Connection Accepted',
                message: 'Your connection request was accepted!',
                related_user_id: userId,
              },
            ] as any)
        }

        await loadConnections()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to accept connection'
        setError(message)
        throw err
      }
    },
    [userId, connections, loadConnections]
  )

  const rejectConnection = useCallback(
    async (connectionId: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        const { error: err } = await supabase
          .from('connections')
          .delete()
          .eq('id', connectionId)

        if (err) throw err

        await loadConnections()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reject connection'
        setError(message)
        throw err
      }
    },
    [userId, loadConnections]
  )

  const blockUser = useCallback(
    async (blockUserId: string, reason?: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        const { error: err } = await supabase
          .from('blocked_users')
          .insert([{ user_id: userId, blocked_user_id: blockUserId, reason }] as any)

        if (err) throw err

        await loadBlockedUsers()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to block user'
        setError(message)
        throw err
      }
    },
    [userId, loadBlockedUsers]
  )

  const unblockUser = useCallback(
    async (blockUserId: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        const { error: err } = await supabase
          .from('blocked_users')
          .delete()
          .eq('user_id', userId)
          .eq('blocked_user_id', blockUserId)

        if (err) throw err

        await loadBlockedUsers()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to unblock user'
        setError(message)
        throw err
      }
    },
    [userId, loadBlockedUsers]
  )

  const isUserBlocked = useCallback(
    (checkUserId: string) => {
      return blockedUsers.some((b) => b.blocked_user_id === checkUserId)
    },
    [blockedUsers]
  )

  const getConnectionStatus = useCallback(
    (checkUserId: string) => {
      const conn = connections.find(
        (c) =>
          (c.requester_id === userId && c.receiver_id === checkUserId) ||
          (c.requester_id === checkUserId && c.receiver_id === userId)
      )
      return conn?.status || null
    },
    [connections, userId]
  )

  const getPendingRequests = useCallback(() => {
    return connections.filter((c) => c.receiver_id === userId && c.status === 'pending')
  }, [connections, userId])

  const getAcceptedConnections = useCallback(() => {
    return connections.filter((c) => c.status === 'accepted')
  }, [connections])

  const leaveReview = useCallback(
    async (reviewedId: string, rating: number, comment: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        const token = session?.access_token

        // Call edge function
        const result = await callEdgeFunction(
          'create-review-reward',
          {
            reviewer_id: userId,
            reviewed_id: reviewedId,
            rating,
            comment,
          },
          token
        )

        if (result.success) {
          await loadReviews()
        } else {
          throw new Error(result.error)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to leave review'
        setError(message)
        throw err
      }
    },
    [userId, loadReviews]
  )

  const getUserReviews = useCallback(
    (receiverId: string) => {
      return reviews.filter((r) => r.reviewed_id === receiverId)
    },
    [reviews]
  )

  const getAverageRating = useCallback(
    (receiverId: string) => {
      const userReviews = getUserReviews(receiverId)
      if (userReviews.length === 0) return 0
      const sum = userReviews.reduce((acc, r) => acc + r.rating, 0)
      return sum / userReviews.length
    },
    [getUserReviews]
  )

  const hasReviewedUser = useCallback(
    (receiverId: string) => {
      return reviews.some((r) => r.reviewer_id === userId && r.reviewed_id === receiverId)
    },
    [reviews, userId]
  )

  const refreshConnections = useCallback(async () => {
    await loadConnections()
  }, [loadConnections])

  const refreshReviews = useCallback(async () => {
    await loadReviews()
  }, [loadReviews])

  const refreshBlockedUsers = useCallback(async () => {
    await loadBlockedUsers()
  }, [loadBlockedUsers])

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        reviews,
        blockedUsers,
        loading,
        error,
        sendConnectionRequest,
        acceptConnection,
        rejectConnection,
        blockUser,
        unblockUser,
        isUserBlocked,
        getConnectionStatus,
        getPendingRequests,
        getAcceptedConnections,
        leaveReview,
        getUserReviews,
        getAverageRating,
        hasReviewedUser,
        refreshConnections,
        refreshReviews,
        refreshBlockedUsers,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const context = useContext(ConnectionContext)
  if (!context) {
    throw new Error('useConnection must be used within ConnectionProvider')
  }
  return context
}

// Export types
export type { Connection, Review, BlockedUser }
