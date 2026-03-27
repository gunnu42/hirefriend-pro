import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/supabase'

interface Notification {
  id: string
  user_id: string
  type: 'message' | 'booking' | 'rating' | 'friend_request' | 'payment'
  title: string
  body?: string
  data?: Record<string, any>
  read: boolean
  created_at: string
  updated_at: string
}

type NotificationType = Notification['type']

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  subscribeToNotifications: () => void
  unsubscribeFromNotifications: () => void
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
  getNotificationsByType: (type: NotificationType) => Notification[]
  getUnreadNotifications: () => Notification[]
  dismissNotification: (notificationId: string, duration?: number) => void
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const channelRef = useRef<any>(null)
  const dismissTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUserId(user.id)
      } catch (err) {
        console.error('[Notification] Error getting user:', err)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUserId(session?.user?.id || null)
    })

    return () => { subscription?.unsubscribe() }
  }, [])

  // Load initial notifications
  useEffect(() => {
    if (userId) refreshNotifications()
  }, [userId])

  const refreshNotifications = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (err) throw err
      setNotifications((data as Notification[]) || [])
    } catch (err) {
      console.error('[Notification] Error loading notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const subscribeToNotifications = useCallback(() => {
    if (!userId) return
    try {
      channelRef.current = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          ( payload: { new: Record<string, any> } ) => {
            try {
              const newNotification = payload.new as Notification
              setNotifications((prev) => [newNotification, ...prev])
            } catch (err) {
              console.error('[Notification] Error processing INSERT notification:', err)
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          ( payload: { new: Record<string, any> } ) => {
            try {
              const updated = payload.new as Notification
              setNotifications((prev) =>
                prev.map((n) => (n.id === updated.id ? updated : n))
              )
            } catch (err) {
              console.error('[Notification] Error processing UPDATE notification:', err)
            }
          }
        )
        .subscribe()
    } catch (err) {
      console.error('[Notification] Error subscribing:', err)
      setError(err instanceof Error ? err.message : 'Failed to subscribe to notifications')
    }
  }, [userId])

  const unsubscribeFromNotifications = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    dismissTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    dismissTimeoutsRef.current.clear()
  }, [])

  // Subscribe/unsubscribe on mount/unmount
  useEffect(() => {
    if (userId) subscribeToNotifications()
    return () => { unsubscribeFromNotifications() }
  }, [userId, subscribeToNotifications, unsubscribeFromNotifications])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error: err } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() } as any)
        .eq('id', notificationId)

      if (err) throw err
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
    } catch (err) {
      console.error('[Notification] Error marking as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read')
      throw err
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    try {
      const { error: err } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() } as any)
        .eq('user_id', userId)
        .eq('read', false)

      if (err) throw err
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error('[Notification] Error marking all as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark all as read')
      throw err
    }
  }, [userId])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error: err } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (err) throw err
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

      const timeout = dismissTimeoutsRef.current.get(notificationId)
      if (timeout) {
        clearTimeout(timeout)
        dismissTimeoutsRef.current.delete(notificationId)
      }
    } catch (err) {
      console.error('[Notification] Error deleting:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
      throw err
    }
  }, [])

  const deleteAllNotifications = useCallback(async () => {
    if (!userId) return
    try {
      const { error: err } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (err) throw err
      setNotifications([])
      dismissTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      dismissTimeoutsRef.current.clear()
    } catch (err) {
      console.error('[Notification] Error deleting all:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete all notifications')
      throw err
    }
  }, [userId])

  const getNotificationsByType = useCallback(
    (type: NotificationType) => notifications.filter((n) => n.type === type),
    [notifications]
  )

  const getUnreadNotifications = useCallback(
    () => notifications.filter((n) => !n.read),
    [notifications]
  )

  const dismissNotification = useCallback(
    (notificationId: string, duration: number = 3000) => {
      try {
        if (duration === 0) {
          deleteNotification(notificationId).catch(err => console.error('[Notification] Error dismissing notification:', err))
        } else {
          const timeout = setTimeout(() => {
            deleteNotification(notificationId).catch(err => console.error('[Notification] Error dismissing notification:', err))
          }, duration)
          dismissTimeoutsRef.current.set(notificationId, timeout)
        }
      } catch (err) {
        console.error('[Notification] Error in dismissNotification:', err)
      }
    },
    [deleteNotification]
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        subscribeToNotifications,
        unsubscribeFromNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        getNotificationsByType,
        getUnreadNotifications,
        dismissNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export type { Notification, NotificationType }