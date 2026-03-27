import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/supabase'
import type { Database } from '@/types/database'

const PROFILE_TABLE = 'users'

type User = {
  id: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  gender?: string | null
  age?: number | null
  bio?: string | null
  interests?: string[] | null
  languages?: string[] | null
  skills?: string[] | null
  photos?: string[] | null
  kyc_status?: string | null
  id_type?: string | null
  is_friend?: boolean
  rating?: number
  total_reviews?: number
  current_city?: string | null
  city?: string | null
  state?: string | null
  dob?: string | null
  intent?: string | null
  avatar_url?: string | null
  referral_code?: string | null
  hourly_rate?: number | null
  is_friend_available?: boolean
  profile_completed?: boolean
  created_at?: string
  updated_at?: string
}

type Session = any

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  // Email/Password Auth
  signUpEmail: (email: string, password: string, phone: string, name: string, gender?: string) => Promise<void>
  signInEmail: (email: string, password: string) => Promise<void>
  // OTP Auth (Phone)
  sendPhoneOTP: (phone: string) => Promise<void>
  verifyPhoneOTP: (phone: string, token: string) => Promise<void>
  // OTP Auth (Email)
  sendEmailOTP: (email: string) => Promise<void>
  verifyEmailOTP: (email: string, token: string) => Promise<void>
  // Password Management
  resetPassword: (email: string) => Promise<void>
  // Session Management
  signOut: () => Promise<void>
  // Profile Updates
  updateProfile: (updates: Partial<User>) => Promise<void>
  getUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const realtimeSubscriptionRef = useRef<any>(null)

  // Fetch user profile from public.profiles table
  const fetchUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log('[Auth] Fetching profile for user:', userId)
      const { data, error: profileError } = await supabase
        .from(PROFILE_TABLE)
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[Auth] Error fetching profile:', profileError)
        return null
      }

      if (data) {
        console.log('[Auth] ✅ Profile fetched:', data.full_name)
        return data as User
      }
      return null
    } catch (err) {
      console.error('[Auth] Exception fetching profile:', err)
      return null
    }
  }, [])

  // Set up realtime listener for profile changes (new Supabase realtime channel API)
  const setupRealtimeListener = useCallback((userId: string) => {
    if (realtimeSubscriptionRef.current) {
      realtimeSubscriptionRef.current.unsubscribe()
    }

    console.log('[Auth] Setting up realtime listener for user:', userId)

    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: PROFILE_TABLE,
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          console.log('[Auth] Profile updated via realtime:', payload)
          if (payload.new) {
            setUser(payload.new as User)
          }
        }
      )
      .subscribe()

    realtimeSubscriptionRef.current = channel
    return channel
  }, [])

  // Initialize auth on mount
  useEffect(() => {
    console.log('[Auth] 🚀 Starting auth initialization...')
    let isComponentMounted = true
    let initTimeoutId: ReturnType<typeof setTimeout> | null = null

    // Timeout to prevent infinite loading (3 second fallback)
    const startTimeout = () => {
      initTimeoutId = setTimeout(() => {
        if (isComponentMounted && loading) {
          console.warn('[Auth] ⏱️ Init timeout reached - forcing loading to false')
          setLoading(false)
        }
      }, 3000)
    }

    const checkInitialSession = async () => {
      try {
        console.log('[Auth] Checking initial session...')
        const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('[Auth] ❌ Session check error:', sessionError)
          if (isComponentMounted) {
            setLoading(false)
          }
          return
        }

        console.log('[Auth] Session check result:', { hasSession: !!existingSession, userId: existingSession?.user?.id })

        if (existingSession?.user?.id && isComponentMounted) {
          try {
            const userData = await fetchUserProfile(existingSession.user.id)
            if (userData) {
              setUser(userData)
              setupRealtimeListener(existingSession.user.id)
              console.log('[Auth] ✅ Initial session user loaded:', existingSession.user.id)
            } else {
              const fallbackUser: User = {
                id: existingSession.user.id,
                email: existingSession.user.email || '',
                full_name: existingSession.user.user_metadata?.full_name || null,
              }
              setUser(fallbackUser)
              setupRealtimeListener(existingSession.user.id)
              console.log('[Auth] ⚠️ Using fallback user for:', existingSession.user.id)
            }
          } catch (err) {
            console.error('[Auth] Exception loading initial session user:', err)
            const fallbackUser: User = {
              id: existingSession.user.id,
              email: existingSession.user.email || '',
            }
            setUser(fallbackUser)
          }
        } else {
          console.log('[Auth] No existing session found')
          setUser(null)
        }
      } catch (err) {
        console.error('[Auth] Exception in checkInitialSession:', err)
        setUser(null)
      } finally {
        if (isComponentMounted) {
          setLoading(false)
          if (initTimeoutId) clearTimeout(initTimeoutId)
        }
      }
    }

    // Start the timeout first
    startTimeout()

    // Check initial session
    checkInitialSession()

    // Setup auth state change listener
    console.log('[Auth] Setting up onAuthStateChange listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: any) => {
        try {
          if (!isComponentMounted) return

          console.log('[Auth] 📡 onAuthStateChange event:', event, { userId: newSession?.user?.id })

          setSession(newSession)

          try {
            if (newSession?.user?.id) {
              try {
                const userData = await fetchUserProfile(newSession.user.id)

                if (userData && isComponentMounted) {
                  setUser(userData)
                  setupRealtimeListener(newSession.user.id)
                  console.log('[Auth] ✅ Profile synced via onAuthStateChange')
                } else if (isComponentMounted) {
                  const fallbackUser: User = {
                    id: newSession.user.id,
                    email: newSession.user.email || '',
                    full_name: newSession.user.user_metadata?.full_name || null,
                  }
                  setUser(fallbackUser)
                  setupRealtimeListener(newSession.user.id)
                }
              } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error syncing profile'
                console.error('[Auth] Exception syncing profile:', err)
                setError(message)
                if (isComponentMounted) {
                  setUser({
                    id: newSession.user.id,
                    email: newSession.user.email || '',
                  } as User)
                }
              }
            } else {
              if (isComponentMounted) {
                setUser(null)
              }
              if (realtimeSubscriptionRef.current) {
                realtimeSubscriptionRef.current.unsubscribe()
                realtimeSubscriptionRef.current = null
              }
              console.log('[Auth] 👋 User logged out')
            }
          } catch (err) {
            console.error('[Auth] Unexpected error in onAuthStateChange:', err)
            if (isComponentMounted) {
              setUser(null)
              setLoading(false)
            }
          }
        } finally {
          if (isComponentMounted) {
            setLoading(false)
            if (initTimeoutId) clearTimeout(initTimeoutId)
          }
        }
      }
    )

    return () => {
      isComponentMounted = false
      subscription?.unsubscribe()
      if (realtimeSubscriptionRef.current) {
        realtimeSubscriptionRef.current.unsubscribe()
      }
      if (initTimeoutId) clearTimeout(initTimeoutId)
    }
  }, [fetchUserProfile, setupRealtimeListener])

  const signUpEmail = useCallback(
    async (email: string, password: string, phone: string, fullName: string, gender: string = '') => {
      try {
        setError(null)
        console.log('[Signup] Starting email signup with:', { email, phone, fullName, gender })
        
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: fullName, phone, gender },
            emailRedirectTo: 'hirefriend://auth/callback',
          },
        })

        // LOG FULL RESPONSE FOR DEBUGGING
        console.log('[Signup] Full response:', JSON.stringify(data, null, 2))

        if (signupError) {
          console.error('[Signup] Signup error:', signupError)
          throw signupError
        }

        // CRITICAL: Only proceed if user was actually created
        if (!data.user) {
          const errorMsg = 'Signup failed - no user returned from Supabase'
          console.error('[Signup]', errorMsg)
          throw new Error(errorMsg)
        }

        console.log('[Signup] ✅ Auth user created successfully')
        console.log('[Signup] User ID:', data.user.id)
        console.log('[Signup] Email:', data.user.email)
        console.log('[Signup] Email confirmed?', !!data.user.email_confirmed_at)
        console.log('[Signup] Session exists?', !!data.session)
        console.log('[Signup] User metadata:', data.user.user_metadata)
        
        // Try to create profile in public.users table
        // IMPORTANT: This is non-blocking - if it fails, signup still succeeds
        // onAuthStateChange will create the profile as a fallback
        try {
          console.log('[Signup] Attempting to create profile in public.users...')
          const { error: profileError, data: profileData } = await supabase
            .from('users')
            .upsert(
              {
                id: data.user.id,
                email: email,
                phone: phone,
                full_name: fullName,
                gender: gender,
                plan_type: 'free',
                connects_left: 5,
                wallet_balance: 0,
                profile_completed: false,
                kyc_status: 'pending',
                is_verified: false,
                current_streak: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              { onConflict: 'id' }
            )
            .select()

          if (profileError) {
            console.warn('[Signup] ⚠️  Profile creation failed (non-blocking):', {
              code: profileError.code,
              message: profileError.message,
              details: profileError.details,
            })
            console.warn('[Signup] Proceeding anyway - onAuthStateChange will create profile')
          } else {
            console.log('[Signup] ✅ Profile created in public.users:', profileData)
          }
        } catch (profileErr) {
          console.warn('[Signup] ⚠️  Profile creation exception (non-blocking):', profileErr)
          // Don't throw - signup succeeds even if profile creation fails
        }
        
        // ✅ SUCCESS: User was created in auth.users
        // Profile may or may not have been created, but that's ok
        // onAuthStateChange will ensure profile exists before app continues
        console.log('[Signup] ✅ SIGNUP COMPLETE - User ready for auth')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to create account. Please try again.'
        setError(message)
        console.error('[Signup] ❌ SIGNUP FAILED:', message)
        throw err
      }
    },
    []
  )

  const signInEmail = useCallback(async (email: string, password: string) => {
    try {
      setError(null)
      console.log('[Auth] Email signin for:', email)
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      console.log('[Auth] Email signin successful')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed'
      setError(message)
      console.error('[Auth] Signin error:', err)
      throw err
    }
  }, [])



  const sendPhoneOTP = useCallback(async (phone: string) => {
    try {
      setError(null)
      console.log('[Auth] Sending phone OTP to:', phone)
      
      // Normalize phone number
      const normalizedPhone = phone.replace(/\D/g, '')
      if (normalizedPhone.length < 10) throw new Error('Invalid phone number')
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: '+' + normalizedPhone,
      })

      if (error) {
        // Check if it's a provider configuration issue
        if (error.message?.includes('provider') || error.message?.includes('Unsupported')) {
          throw new Error('Phone authentication is not configured. Please use email OTP instead.')
        }
        throw error
      }
      console.log('[Auth] Phone OTP sent successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.'
      setError(message)
      console.error('[Auth] Phone OTP send error:', err)
      throw err
    }
  }, [])

  const verifyPhoneOTP = useCallback(async (phone: string, token: string) => {
    try {
      setError(null)
      console.log('[Auth] Verifying phone OTP...')
      
      const normalizedPhone = phone.replace(/\D/g, '')
      const formattedPhone = '+' + normalizedPhone
      
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms',
      })

      if (error) throw error
      console.log('[Auth] Phone OTP verified successfully')
      // Note: onAuthStateChange will automatically create profile if missing
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid or expired OTP. Please try again.'
      setError(message)
      console.error('[Auth] OTP verification error:', err)
      throw err
    }
  }, [])

  const sendEmailOTP = useCallback(async (email: string) => {
    try {
      setError(null)
      console.log('[Auth] Sending email OTP to:', email)
      
      if (!email.includes('@')) throw new Error('Invalid email address')
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: 'hirefriend://auth/callback',
        },
      })

      if (error) throw error
      console.log('[Auth] Email OTP sent successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code. Please try again.'
      setError(message)
      console.error('[Auth] Email OTP send error:', err)
      throw err
    }
  }, [])

  const verifyEmailOTP = useCallback(async (email: string, token: string) => {
    try {
      setError(null)
      console.log('[Auth] Verifying email OTP...')
      
      if (!token || token.length === 0) throw new Error('Verification code is required')
      
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) throw error
      console.log('[Auth] Email OTP verified successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid or expired code. Please request a new one.'
      setError(message)
      console.error('[Auth] OTP verification error:', err)
      throw err
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null)
      console.log('[Auth] Sending password reset email to:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'hirefriend://auth/reset-password',
      })

      if (error) throw error
      console.log('[Auth] Password reset email sent')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
      setError(message)
      console.error('[Auth] Reset password error:', err)
      throw err
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      console.log('[Auth] Signing out...')
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSession(null)
      console.log('[Auth] Signed out successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed'
      setError(message)
      console.error('[Auth] Signout error:', err)
      throw err
    }
  }, [])

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in')

    try {
      setError(null)
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, ...updates })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profile update failed'
      setError(message)
      throw err
    }
  }, [user])

  const getUser = useCallback(async (): Promise<User | null> => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser?.id) return null

    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, phone, gender, date_of_birth, current_city, role, is_blocked, plan_type, connects_left, connects_total, wallet_balance, subscription_active, auto_renew_enabled, referral_code, avatar_url, current_streak, last_active, created_at, updated_at')
      .eq('id', authUser.id)
      .single()

    return data || null
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signUpEmail,
        signInEmail,
        sendPhoneOTP,
        verifyPhoneOTP,
        sendEmailOTP,
        verifyEmailOTP,
        resetPassword,
        signOut,
        updateProfile,
        getUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Export type for convenience
export type { User }
