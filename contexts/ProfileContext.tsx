import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase, uploadToStorage, deleteFromStorage, STORAGE_BUCKETS } from '@/supabase'
import { useAuth } from './AuthContext'
import type { Database } from '@/types/database'

type ProfileMedia = Database['public']['Tables']['profile_media']['Row']
type KYCVerification = Database['public']['Tables']['kyc_verifications']['Row']
type User = Database['public']['Tables']['users']['Row']
type UserInterest = Database['public']['Tables']['user_interests']['Row']
type UserLanguage = Database['public']['Tables']['user_languages']['Row']
type UserPersonality = Database['public']['Tables']['user_personality']['Row']
type ServicePricing = Database['public']['Tables']['service_pricing']['Row']

interface CompleteProfile {
  // Basic user info
  user: User | null
  // Profile completion status
  completion: {
    basic: boolean
    interests: boolean
    skills: boolean
    media: boolean
    kyc: boolean
    overall: number // percentage
  }
  // Related data
  interests: UserInterest[]
  languages: UserLanguage[]
  personality: UserPersonality | null
  servicePricing: ServicePricing | null
  media: ProfileMedia[]
  kyc: KYCVerification | null
  // Average rating
  rating: {
    average: number
    count: number
  }
}

interface ProfileContextType {
  profile: CompleteProfile | null
  loading: boolean
  error: string | null

  // Profile CRUD
  updateBasicInfo: (data: Partial<User>) => Promise<void>
  updateInterests: (interestIds: number[]) => Promise<void>
  updateLanguages: (languages: Array<{language_id: number, fluency_level?: string}>) => Promise<void>
  updatePersonality: (data: {personality_type_id: number, looking_for?: string, bio?: string}) => Promise<void>
  updateServicePricing: (data: Partial<ServicePricing>) => Promise<void>

  // Media management
  uploadProfilePhoto: (uri: string, index: number) => Promise<string>
  uploadSelfie: (uri: string) => Promise<string>
  uploadKYCDocument: (uri: string, docType: string) => Promise<string>
  deleteProfilePhoto: (mediaId: string) => Promise<void>
  reorderPhotos: (mediaIds: string[]) => Promise<void>
  getProfilePhotos: () => ProfileMedia[]

  // KYC
  submitKYCForVerification: () => Promise<void>
  getKYCStatus: () => string
  canSubmitKYC: () => boolean

  // Completion tracking
  getCompletionStatus: () => CompleteProfile['completion']
  isProfileComplete: () => boolean

  // Real-time sync
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CompleteProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const { user } = useAuth()
  const realtimeSubscriptionRef = useRef<any>(null)

  // Set userId from AuthContext
  useEffect(() => {
    setUserId(user?.id ?? null)
  }, [user?.id])

  // Calculate profile completion status
  const calculateCompletion = useCallback((data: CompleteProfile): CompleteProfile['completion'] => {
    const basic = !!(
      data.user?.full_name &&
      data.user?.email &&
      data.user?.current_city &&
      data.user?.gender &&
      data.user?.date_of_birth
    )

    const interests = data.interests.length >= 2
    const skills = data.languages.length >= 1
    const media = data.media.length >= 3
    const kyc = data.kyc?.status === 'verified'

    const sections = [basic, interests, skills, media, kyc].filter(Boolean).length
    const overall = Math.round((sections / 5) * 100)

    return { basic, interests, skills, media, kyc, overall }
  }, [])

  // Load complete profile data
  const loadCompleteProfile = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      // Load user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      // Load related data in parallel
      const [
        interestsRes,
        languagesRes,
        personalityRes,
        servicePricingRes,
        mediaRes,
        kycRes,
        ratingRes
      ] = await Promise.all([
        supabase.from('user_interests').select('*').eq('user_id', userId),
        supabase.from('user_languages').select('*').eq('user_id', userId),
        supabase.from('user_personality').select('*').eq('user_id', userId).single(),
        supabase.from('service_pricing').select('*').eq('user_id', userId).single(),
        supabase.from('profile_media').select('*').eq('user_id', userId).order('display_order'),
        supabase.from('kyc_verifications').select('*').eq('user_id', userId).single(),
        supabase.from('reviews').select('rating').eq('receiver_id', userId)
      ])

      // Calculate average rating
      const ratings = ratingRes.data || []
      const averageRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / ratings.length
        : 0

      const completeProfile: CompleteProfile = {
        user: userData,
        interests: interestsRes.data || [],
        languages: languagesRes.data || [],
        personality: personalityRes.data || null,
        servicePricing: servicePricingRes.data || null,
        media: mediaRes.data || [],
        kyc: kycRes.data || null,
        rating: {
          average: Math.round(averageRating * 10) / 10,
          count: ratings.length
        },
        completion: { basic: false, interests: false, skills: false, media: false, kyc: false, overall: 0 }
      }

      // Calculate completion
      completeProfile.completion = calculateCompletion(completeProfile)

      setProfile(completeProfile)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile'
      setError(message)
      console.error('Error loading complete profile:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, calculateCompletion])

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!userId || realtimeSubscriptionRef.current) return

    const channel = supabase.channel(`profile-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, () => loadCompleteProfile())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_interests',
        filter: `user_id=eq.${userId}`
      }, () => loadCompleteProfile())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_languages',
        filter: `user_id=eq.${userId}`
      }, () => loadCompleteProfile())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_personality',
        filter: `user_id=eq.${userId}`
      }, () => loadCompleteProfile())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_media',
        filter: `user_id=eq.${userId}`
      }, () => loadCompleteProfile())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'kyc_verifications',
        filter: `user_id=eq.${userId}`
      }, () => loadCompleteProfile())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews',
        filter: `receiver_id=eq.${userId}`
      }, () => loadCompleteProfile())
      .subscribe()

    realtimeSubscriptionRef.current = channel
  }, [userId, loadCompleteProfile])

  // Cleanup subscriptions
  const cleanupSubscriptions = useCallback(() => {
    if (realtimeSubscriptionRef.current) {
      supabase.removeChannel(realtimeSubscriptionRef.current)
      realtimeSubscriptionRef.current = null
    }
  }, [])

  // Initial load and setup
  useEffect(() => {
    if (userId) {
      loadCompleteProfile()
      setupRealtimeSubscriptions()
    } else {
      cleanupSubscriptions()
      setProfile(null)
    }

    return cleanupSubscriptions
  }, [userId, loadCompleteProfile, setupRealtimeSubscriptions, cleanupSubscriptions])

  // Profile update functions
  const updateBasicInfo = useCallback(async (data: Partial<User>) => {
    if (!userId) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId)

    if (error) throw error
  }, [userId])

  const updateInterests = useCallback(async (interestIds: number[]) => {
    if (!userId) throw new Error('User not authenticated')

    // Delete existing interests
    await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId)

    // Insert new interests
    if (interestIds.length > 0) {
      const inserts = interestIds.map(interestId => ({
        user_id: userId,
        interest_id: interestId
      }))

      const { error } = await supabase
        .from('user_interests')
        .insert(inserts as any)

      if (error) throw error
    }
  }, [userId])

  const updateLanguages = useCallback(async (languages: Array<{language_id: number, fluency_level?: string}>) => {
    if (!userId) throw new Error('User not authenticated')

    // Delete existing languages
    await supabase
      .from('user_languages')
      .delete()
      .eq('user_id', userId)

    // Insert new languages
    if (languages.length > 0) {
      const inserts = languages.map(lang => ({
        user_id: userId,
        language_id: lang.language_id,
        fluency_level: lang.fluency_level || 'intermediate'
      }))

      const { error } = await supabase
        .from('user_languages')
        .insert(inserts as any)

      if (error) throw error
    }
  }, [userId])

  const updatePersonality = useCallback(async (data: {personality_type_id: number, looking_for?: string, bio?: string}) => {
    if (!userId) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_personality')
      .upsert({
        user_id: userId,
        personality_type_id: data.personality_type_id,
        looking_for: data.looking_for,
        bio: data.bio
      } as any)

    if (error) throw error
  }, [userId])

  const updateServicePricing = useCallback(async (data: Partial<ServicePricing>) => {
    if (!userId) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('service_pricing')
      .upsert({
        user_id: userId,
        ...data
      } as any)

    if (error) throw error
  }, [userId])

  // Media management
  const uploadProfilePhoto = useCallback(async (uri: string, index: number) => {
    if (!userId) throw new Error('User not authenticated')

    const response = await fetch(uri)
    const blob = await response.blob()

    const path = `${userId}/photo_${index}_${Date.now()}.jpg`
    const publicUrl = await uploadToStorage(STORAGE_BUCKETS.PROFILE_IMAGES, path, blob)

    const { data, error } = await supabase
      .from('profile_media')
      .insert({
        user_id: userId,
        media_url: publicUrl,
        media_type: 'photo',
        display_order: index,
      } as any)
      .select()
      .single()

    if (error) throw error

    return publicUrl
  }, [userId])

  const uploadSelfie = useCallback(async (uri: string) => {
    if (!userId) throw new Error('User not authenticated')

    const response = await fetch(uri)
    const blob = await response.blob()

    const path = `${userId}/selfie_${Date.now()}.jpg`
    const publicUrl = await uploadToStorage(STORAGE_BUCKETS.KYC_DOCUMENTS, path, blob)

    const { data, error } = await supabase
      .from('kyc_verifications')
      .upsert({
        user_id: userId,
        selfie_url: publicUrl,
        status: profile?.kyc?.status || 'draft'
      } as any)
      .select()
      .single()

    if (error) throw error

    return publicUrl
  }, [userId, profile?.kyc?.status])

  const uploadKYCDocument = useCallback(async (uri: string, docType: string) => {
    if (!userId) throw new Error('User not authenticated')

    const response = await fetch(uri)
    const blob = await response.blob()

    const path = `${userId}/kyc_${docType}_${Date.now()}.jpg`
    const publicUrl = await uploadToStorage(STORAGE_BUCKETS.KYC_DOCUMENTS, path, blob)

    const { data, error } = await supabase
      .from('kyc_verifications')
      .upsert({
        user_id: userId,
        id_document_url: publicUrl,
        id_document_type: docType,
        status: profile?.kyc?.status || 'draft'
      } as any)
      .select()
      .single()

    if (error) throw error

    return publicUrl
  }, [userId, profile?.kyc?.status])

  const deleteProfilePhoto = useCallback(async (mediaId: string) => {
    if (!userId) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('profile_media')
      .delete()
      .eq('id', mediaId)
      .eq('user_id', userId)

    if (error) throw error
  }, [userId])

  const reorderPhotos = useCallback(async (mediaIds: string[]) => {
    if (!userId) throw new Error('User not authenticated')

    const updates = mediaIds.map((id, index) =>
      supabase
        .from('profile_media')
        .update({ display_order: index })
        .eq('id', id)
        .eq('user_id', userId)
    )

    await Promise.all(updates)
  }, [userId])

  // KYC functions
  const submitKYCForVerification = useCallback(async () => {
    if (!userId || !canSubmitKYC()) throw new Error('Cannot submit KYC')

    const { error } = await supabase
      .from('kyc_verifications')
      .update({ status: 'pending' })
      .eq('user_id', userId)

    if (error) throw error
  }, [userId])

  const getKYCStatus = useCallback(() => {
    return profile?.kyc?.status || 'draft'
  }, [profile?.kyc?.status])

  const canSubmitKYC = useCallback(() => {
    return !!(
      profile?.kyc?.selfie_url &&
      profile?.kyc?.id_document_url &&
      profile?.kyc?.id_document_type &&
      profile?.kyc?.status === 'draft'
    )
  }, [profile?.kyc])

  const getProfilePhotos = useCallback(() => {
    return profile?.media || []
  }, [profile?.media])

  // Completion tracking
  const getCompletionStatus = useCallback(() => {
    return profile?.completion || { basic: false, interests: false, skills: false, media: false, kyc: false, overall: 0 }
  }, [profile?.completion])

  const isProfileComplete = useCallback(() => {
    return (profile?.completion.overall || 0) >= 80
  }, [profile?.completion.overall])

  // Refresh function
  const refreshProfile = useCallback(async () => {
    await loadCompleteProfile()
  }, [loadCompleteProfile])

  const value: ProfileContextType = {
    profile,
    loading,
    error,
    updateBasicInfo,
    updateInterests,
    updateLanguages,
    updatePersonality,
    updateServicePricing,
    uploadProfilePhoto,
    uploadSelfie,
    uploadKYCDocument,
    deleteProfilePhoto,
    reorderPhotos,
    getProfilePhotos,
    submitKYCForVerification,
    getKYCStatus,
    canSubmitKYC,
    getCompletionStatus,
    isProfileComplete,
    refreshProfile
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  return context
}

// Export types
export type { ProfileMedia, KYCVerification }
