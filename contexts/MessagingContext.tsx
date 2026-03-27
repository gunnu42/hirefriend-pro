import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabase'
import { useAuth } from './AuthContext'
import type { Database } from '@/types/database'

type Conversation = Database['public']['Tables']['conversations']['Row']
type Message = Database['public']['Tables']['messages']['Row']

interface MessagingContextType {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  loading: boolean
  error: string | null
  createConversation: (userId1: string, userId2: string) => Promise<Conversation>
  getConversation: (userId: string) => Promise<Conversation | null>
  sendMessage: (conversationId: string, text: string, mediaUrl?: string) => Promise<Message>
  loadMessages: (conversationId: string) => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  subscribeToConversation: (conversationId: string) => void
  unsubscribeFromConversation: (conversationId: string) => void
  getUnreadCount: (conversationId: string) => number
  refreshConversations: () => Promise<void>
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({})

  const { user } = useAuth()

  // Set userId from AuthContext
  useEffect(() => {
    setUserId(user?.id ?? null)
  }, [user?.id])

  // Load conversations on user change
  useEffect(() => {
    if (userId) {
      loadConversations()
    }
  }, [userId])

  const loadConversations = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (err) throw err

      setConversations(data || [])
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations'
      setError(message)
      console.error('Error loading conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createConversation = useCallback(
    async (userId1: string, userId2: string) => {
      try {
        setError(null)

        // Check if conversation already exists
        const { data: existing } = await supabase
          .from('conversations')
          .select('*')
          .or(
            `and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`
          )
          .single()

        if (existing) {
          return existing
        }

        // Create new conversation
        const { data, error: err } = await supabase
          .from('conversations')
          .insert([{ user1_id: userId1, user2_id: userId2 }] as any)
          .select()
          .single()

        if (err) throw err

        setConversations((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create conversation'
        setError(message)
        throw err
      }
    },
    []
  )

  const getConversation = useCallback(
    async (otherUserId: string) => {
      if (!userId) return null

      try {
        const { data } = await supabase
          .from('conversations')
          .select('*')
          .or(
            `and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`
          )
          .single()

        return data || null
      } catch (err) {
        console.error('Error getting conversation:', err)
        return null
      }
    },
    [userId]
  )

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (err) throw err

      setMessages((prev) => ({
        ...prev,
        [conversationId]: data || [],
      }))
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }, [])

  const sendMessage = useCallback(
    async (conversationId: string, text: string, mediaUrl?: string) => {
      if (!userId) throw new Error('User not authenticated')

      try {
        setError(null)

        const { data, error: err } = await supabase
          .from('messages')
          .insert([
            {
              conversation_id: conversationId,
              sender_id: userId,
              text: text || null,
              media_url: mediaUrl || null,
              is_read: false,
            },
          ] as any)
          .select()
          .single()

        if (err) throw err

        // Update local messages
        setMessages((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), data],
        }))

        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message'
        setError(message)
        throw err
      }
    },
    [userId]
  )

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error: err } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (err) throw err
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }, [])

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error: err } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (err) throw err

      // Update local state
      setMessages((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((key) => {
          updated[key] = updated[key].filter((m) => m.id !== messageId)
        })
        return updated
      })
    } catch (err) {
      console.error('Error deleting message:', err)
      throw err
    }
  }, [])

  const subscribeToConversation = useCallback((conversationId: string) => {
    // Check if already subscribed
    if (subscriptions[conversationId]) return

    try {
      const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            try {
              if (payload.new) {
                setMessages((prev) => ({
                  ...prev,
                  [conversationId]: [...(prev[conversationId] || []), payload.new as Message],
                }))
              }
            } catch (err) {
              console.error('Error processing INSERT message:', err)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            try {
              if (payload.new) {
                setMessages((prev) => ({
                  ...prev,
                  [conversationId]: prev[conversationId].map((m) =>
                    m.id === payload.new.id ? (payload.new as Message) : m
                  ),
                }))
              }
            } catch (err) {
              console.error('Error processing UPDATE message:', err)
            }
          }
        )
        .subscribe()

      setSubscriptions((prev) => ({
        ...prev,
        [conversationId]: channel,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe to conversation'
      setError(message)
      console.error('Error subscribing to conversation:', err)
    }
  }, [subscriptions])

  const unsubscribeFromConversation = useCallback((conversationId: string) => {
    try {
      if (subscriptions[conversationId]) {
        supabase.removeChannel(subscriptions[conversationId])
        setSubscriptions((prev) => {
          const updated = { ...prev }
          delete updated[conversationId]
          return updated
        })
      }
    } catch (err) {
      console.error('Error unsubscribing from conversation:', err)
    }
  }, [subscriptions])

  const getUnreadCount = useCallback(
    (conversationId: string) => {
      return (messages[conversationId] || []).filter((m) => !m.is_read && m.sender_id !== userId)
        .length
    },
    [messages, userId]
  )

  const refreshConversations = useCallback(async () => {
    await loadConversations()
  }, [loadConversations])

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      try {
        Object.values(subscriptions).forEach((channel) => {
          try {
            supabase.removeChannel(channel)
          } catch (err) {
            console.error('Error removing channel:', err)
          }
        })
      } catch (err) {
        console.error('Error in MessagingContext cleanup:', err)
      }
    }
  }, [subscriptions])

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        messages,
        loading,
        error,
        createConversation,
        getConversation,
        sendMessage,
        loadMessages,
        markAsRead,
        deleteMessage,
        subscribeToConversation,
        unsubscribeFromConversation,
        getUnreadCount,
        refreshConversations,
      }}
    >
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (!context) {
    throw new Error('useMessaging must be used within MessagingProvider')
  }
  return context
}

// Export types
export type { Conversation, Message }
