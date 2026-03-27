import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, callEdgeFunction } from '@/supabase'
import { useAuth } from './AuthContext'
import type { Database } from '@/types/database'

type OnboardingProfile = Database['public']['Tables']['onboarding_profiles']['Row']
type User = Database['public']['Tables']['users']['Row']
type UserInterest = Database['public']['Tables']['user_interests']['Row']
type UserLanguage = Database['public']['Tables']['user_languages']['Row']
type UserPersonality = Database['public']['Tables']['user_personality']['Row']
type ServicePricing = Database['public']['Tables']['service_pricing']['Row']

interface OnboardingContextType {
  onboarding: OnboardingProfile | null
  user: User | null
  interests: UserInterest[]
  languages: UserLanguage[]
  personality: UserPersonality | null
  pricing: ServicePricing | null
  loading: boolean
  error: string | null
  validateAndSaveStep: (
    stepNumber: number,
    data: Record<string, any>
  ) => Promise<{ success: boolean; error?: string }>
  completeOnboarding: () => Promise<void>
  getOnboardingProgress: () => number
  isStepCompleted: (stepNumber: number) => boolean
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboarding, setOnboarding] = useState<OnboardingProfile | null>(null)
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [interests, setInterests] = useState<UserInterest[]>([])
  const [languages, setLanguages] = useState<UserLanguage[]>([])
  const [personality, setPersonality] = useState<UserPersonality | null>(null)
  const [pricing, setPricing] = useState<ServicePricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const { user: authUser, session } = useAuth()

  // Set userId from AuthContext
  useEffect(() => {
    setUserId(authUser?.id ?? null)
  }, [authUser?.id])

  // Load onboarding data
  const loadOnboardingData = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)

      // Load user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userData) setProfileUser(userData)

      // Load onboarding progress
      let { data: onboardingData } = await supabase
        .from('onboarding_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!onboardingData) {
        // Create onboarding profile if doesn't exist
        const { data: newOnboarding } = await supabase
          .from('onboarding_profiles')
          .insert([{ user_id: userId, current_step: 1 }] as any)
          .select()
          .single()

        onboardingData = newOnboarding
      }

      setOnboarding(onboardingData)

      // Load user interests
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId)

      setInterests(interestsData || [])

      // Load user languages
      const { data: languagesData } = await supabase
        .from('user_languages')
        .select('*')
        .eq('user_id', userId)

      setLanguages(languagesData || [])

      // Load personality
      const { data: personalityData } = await supabase
        .from('user_personality')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (personalityData) setPersonality(personalityData)

      // Load service pricing
      const { data: pricingData } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (pricingData) setPricing(pricingData)

      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load onboarding'
      setError(message)
      console.error('Error loading onboarding:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Initial load
  useEffect(() => {
    if (userId) {
      loadOnboardingData()
    }
  }, [userId, loadOnboardingData])

  const validateAndSaveStep = useCallback(
    async (stepNumber: number, data: Record<string, any>) => {
      if (!userId) {
        return { success: false, error: 'User not authenticated' }
      }

      try {
        setError(null)

        const token = session?.access_token

        // Call edge function for backend validation
        const result = await callEdgeFunction(
          'validate-onboarding-step',
          {
            user_id: userId,
            step_number: stepNumber,
            data,
          },
          token
        )

        if (result.success) {
          // Update local state based on step
          if (stepNumber === 1) {
            setProfileUser((prev) =>
              prev
                ? {
                    ...prev,
                    full_name: data.full_name,
                    date_of_birth: data.date_of_birth,
                    gender: data.gender,
                    current_city: data.current_city,
                  }
                : null
            )
          }

          // Reload onboarding progress
          await loadOnboardingData()

          return { success: true }
        } else {
          const errorMsg = result.error || 'Validation failed'
          setError(errorMsg)
          return { success: false, error: errorMsg }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Validation error'
        setError(message)
        return { success: false, error: message }
      }
    },
    [userId, loadOnboardingData]
  )

  const completeOnboarding = useCallback(async () => {
    if (!userId || !onboarding) return

    try {
      const { error: err } = await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', userId)

      if (err) throw err
    } catch (err) {
      console.error('Error completing onboarding:', err)
      throw err
    }
  }, [userId, onboarding])

  const getOnboardingProgress = useCallback(() => {
    if (!onboarding) return 0
    let completed = 0
    if (onboarding.step_1_completed) completed++
    if (onboarding.step_2_completed) completed++
    if (onboarding.step_3_completed) completed++
    if (onboarding.step_4_completed) completed++
    return (completed / 4) * 100
  }, [onboarding])

  const isStepCompleted = useCallback(
    (stepNumber: number) => {
      if (!onboarding) return false
      switch (stepNumber) {
        case 1:
          return onboarding.step_1_completed
        case 2:
          return onboarding.step_2_completed
        case 3:
          return onboarding.step_3_completed
        case 4:
          return onboarding.step_4_completed
        default:
          return false
      }
    },
    [onboarding]
  )

  return (
    <OnboardingContext.Provider
      value={{
        onboarding,
        user: profileUser,
        interests,
        languages,
        personality,
        pricing,
        loading,
        error,
        validateAndSaveStep,
        completeOnboarding,
        getOnboardingProgress,
        isStepCompleted,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}

// Export types for convenience
export type { OnboardingProfile, User, UserInterest, UserLanguage, UserPersonality, ServicePricing }
