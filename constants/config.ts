import type { Database } from '@/types/database'

/**
 * HireFriend Configuration & Constants
 * Centralized configuration for the entire application
 */

// ============================================================================
// APP CONSTANTS
// ============================================================================

export const APP_NAME = 'HireFriend'
export const APP_VERSION = '1.0.0'
export const ENVIRONMENT = process.env.EXPO_PUBLIC_ENV || 'development'

// ============================================================================
// SUBSCRIPTION CONSTANTS
// ============================================================================

export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    connectsPerMonth: 10,
    price: 0,
    features: {
      messaging: false,
      storiesView: false,
      connections: true,
      profiles: true,
    },
  },
  PREMIUM: {
    name: 'Premium',
    connectsPerMonth: 100,
    price: 999,
    currency: 'INR',
    features: {
      messaging: true,
      storiesView: true,
      connections: true,
      profiles: true,
      unlimitedMessages: true,
    },
  },
} as const

// ============================================================================
// WALLET & POINTS CONSTANTS
// ============================================================================

export const POINTS_RULES = {
  REVIEW_RECEIVED: 50,
  VLOG_UPLOAD: 400,
  DAILY_LOGIN: 0, // Disabled in Phase 2
  REFERRAL: 500,
  BOOKING_COMPLETED: 100,
} as const

export const POINTS_ACTIONS = {
  REVIEW_RECEIVED: 'review_received',
  VLOG_UPLOAD: 'vlog_upload',
  DAILY_LOGIN: 'daily_login',
  REFERRAL: 'referral',
  BOOKING_COMPLETED: 'booking_completed',
} as const

// ============================================================================
// ONBOARDING STEPS
// ============================================================================

export const ONBOARDING_STEPS = {
  PERSONAL_IDENTITY: 1,
  VIBE_INTERESTS: 2,
  SERVICE_MODE: 3,
  MEDIA_KYC: 4,
} as const

export const MIN_AGE = 18
export const MIN_BIO_LENGTH = 50
export const MIN_INTERESTS = 2
export const MIN_PROFILE_PHOTOS = 3

// ============================================================================
// SERVICE MODES
// ============================================================================

export const SERVICE_MODES = {
  LOCAL_FRIEND: 'local_friend',
  VIRTUAL_FRIEND: 'virtual_friend',
} as const

// ============================================================================
// KYC DOCUMENT TYPES
// ============================================================================

export const KYC_DOCUMENT_TYPES = {
  AADHAR: 'aadhar',
  PAN: 'pan',
  PASSPORT: 'passport',
} as const

// ============================================================================
// CONNECTION STATUSES
// ============================================================================

export const CONNECTION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
} as const

// ============================================================================
// BOOKING STATUSES
// ============================================================================

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const NOTIFICATION_TYPES = {
  NEARBY_USER: 'nearby_user',
  CONNECTION_REQUEST: 'connection_request',
  CONNECTION_ACCEPTED: 'connection_accepted',
  REVIEW: 'review',
  POINTS_EARNED: 'points_earned',
  CONNECTS_LOW: 'connects_low',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  BOOKING_REQUEST: 'booking_request',
  MESSAGE: 'message',
} as const

// ============================================================================
// STORAGE BUCKETS
// ============================================================================

export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: 'profile-images',
  KYC_DOCUMENTS: 'kyc-documents',
  VLOG_VIDEOS: 'vlog-videos',
} as const

// ============================================================================
// ANIMATION DURATIONS (ms)
// ============================================================================

export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  PAYMENT_SUCCESS: 2000,
  WALLET_UPDATE: 600,
} as const

// ============================================================================
// API RESPONSE CODES
// ============================================================================

export const API_ERRORS = {
  AUTH_REQUIRED: 'auth_required',
  SUBSCRIPTION_REQUIRED: 'subscription_required',
  INVALID_AGE: 'invalid_age',
  INCOMPLETE_PROFILE: 'incomplete_profile',
  KYC_PENDING: 'kyc_pending',
  BLOCKED_USER: 'blocked_user',
  NO_CONNECTS_LEFT: 'no_connects_left',
  INVALID_SERVICE_MODE: 'invalid_service_mode',
  PAYMENT_FAILED: 'payment_failed',
} as const

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const VALIDATION = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 100,
  MIN_BIO_LENGTH: 50,
  MAX_BIO_LENGTH: 500,
  MIN_PHONE_LENGTH: 10,
  MAX_PHONE_LENGTH: 15,
  MIN_HOURLY_RATE: 100,
  MAX_HOURLY_RATE: 100000,
  MIN_RATING: 1,
  MAX_RATING: 5,
  PASSWORD_MIN_LENGTH: 6,
} as const

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_NEARBY_FEATURE: false, // Phase 3
  ENABLE_STORIES: false, // Phase 3
  ENABLE_VLOGS: true, // Phase 2
  ENABLE_NOTIFICATIONS: true, // Phase 2
  ENABLE_BOOKING_CONFIRMATION: true, // Phase 2
  ENABLE_REVIEWS: true, // Phase 2
} as const

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get service mode display name
 */
export function getServiceModeLabel(mode: string): string {
  switch (mode) {
    case SERVICE_MODES.LOCAL_FRIEND:
      return 'Local Friend (In-Person)'
    case SERVICE_MODES.VIRTUAL_FRIEND:
      return 'Virtual Friend (Call/Chat/Video)'
    default:
      return 'Unknown'
  }
}

/**
 * Format points with proper display
 */
export function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`
  }
  return String(points)
}

/**
 * Get subscription plan features
 */
export function getSubscriptionFeatures(plan: Database['public']['Tables']['subscriptions']['Row']['plan']) {
  return SUBSCRIPTION_PLANS[plan.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS]?.features || {}
}

/**
 * Check if age is valid
 */
export function isAgeValid(dateOfBirth: string): boolean {
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age >= MIN_AGE
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
  }

  const symbol = symbols[currency] || currency
  return `${symbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Get remaining days in subscription
 */
export function getRemainingDays(endDate: string | null): number {
  if (!endDate) return 0
  const end = new Date(endDate)
  const today = new Date()
  const diff = end.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ServiceMode = typeof SERVICE_MODES[keyof typeof SERVICE_MODES]
export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]
export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS]
export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS]
