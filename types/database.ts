// TypeScript Database Types for HireFriend
// Generated from database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          full_name: string | null
          gender: string | null
          date_of_birth: string | null
          current_city: string | null
          email_verified: boolean
          phone_verified: boolean
          profile_completed: boolean
          role: string
          is_blocked: boolean
          plan_type: string
          connects_left: number
          connects_total: number
          wallet_balance: number
          subscription_active: boolean
          auto_renew_enabled: boolean
          referral_code: string | null
          avatar_url: string | null
          current_streak: number
          last_active: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          phone?: string | null
          full_name?: string | null
          gender?: string | null
          date_of_birth?: string | null
          current_city?: string | null
          email_verified?: boolean
          phone_verified?: boolean
          profile_completed?: boolean
          role?: string
          is_blocked?: boolean
          plan_type?: string
          connects_left?: number
          connects_total?: number
          wallet_balance?: number
          subscription_active?: boolean
          auto_renew_enabled?: boolean
          referral_code?: string | null
          avatar_url?: string | null
          current_streak?: number
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          full_name?: string | null
          gender?: string | null
          date_of_birth?: string | null
          current_city?: string | null
          email_verified?: boolean
          phone_verified?: boolean
          profile_completed?: boolean
          role?: string
          is_blocked?: boolean
          plan_type?: string
          connects_left?: number
          connects_total?: number
          wallet_balance?: number
          subscription_active?: boolean
          auto_renew_enabled?: boolean
          referral_code?: string | null
          avatar_url?: string | null
          current_streak?: number
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_profiles: {
        Row: {
          id: string
          user_id: string
          step_1_completed: boolean
          step_2_completed: boolean
          step_3_completed: boolean
          step_4_completed: boolean
          current_step: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          step_1_completed?: boolean
          step_2_completed?: boolean
          step_3_completed?: boolean
          step_4_completed?: boolean
          current_step?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          step_1_completed?: boolean
          step_2_completed?: boolean
          step_3_completed?: boolean
          step_4_completed?: boolean
          current_step?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_interests: {
        Row: {
          id: string
          user_id: string
          interest_id: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          interest_id: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          interest_id?: number
          created_at?: string
        }
      }
      user_languages: {
        Row: {
          id: string
          user_id: string
          language_id: number
          fluency_level: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          language_id: number
          fluency_level?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          language_id?: number
          fluency_level?: string | null
          created_at?: string
        }
      }
      user_personality: {
        Row: {
          user_id: string
          personality_type_id: number | null
          looking_for: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          personality_type_id?: number | null
          looking_for?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          personality_type_id?: number | null
          looking_for?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_pricing: {
        Row: {
          id: string
          user_id: string
          service_mode: string
          hourly_rate: number
          full_day_rate: number | null
          weekend_rate: number | null
          availability_slots: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_mode: string
          hourly_rate: number
          full_day_rate?: number | null
          weekend_rate?: number | null
          availability_slots?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_mode?: string
          hourly_rate?: number
          full_day_rate?: number | null
          weekend_rate?: number | null
          availability_slots?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profile_media: {
        Row: {
          id: string
          user_id: string
          media_url: string
          media_type: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          media_url: string
          media_type: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_url?: string
          media_type?: string
          display_order?: number
          created_at?: string
        }
      }
      kyc_verifications: {
        Row: {
          id: string
          user_id: string
          selfie_url: string | null
          id_document_url: string | null
          id_document_type: string | null
          status: string
          rejection_reason: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          selfie_url?: string | null
          id_document_url?: string | null
          id_document_type?: string | null
          status?: string
          rejection_reason?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          selfie_url?: string | null
          id_document_url?: string | null
          id_document_type?: string | null
          status?: string
          rejection_reason?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          points_balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          points_balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          points_balance?: number
          updated_at?: string
        }
      }
      wallet_transactions: {
        Row: {
          id: string
          user_id: string
          transaction_type: string
          points: number
          source: string
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_type: string
          points: number
          source: string
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_type?: string
          points?: number
          source?: string
          reference_id?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          reviewed_id: string
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          reviewed_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          order_id: string
          plan_type: string
          amount: number
          payment_status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id: string
          plan_type: string
          amount: number
          payment_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string
          plan_type?: string
          amount?: number
          payment_status?: string
          created_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          method_type: string
          last_four: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          method_type: string
          last_four?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          method_type?: string
          last_four?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          currency: string
          payment_method_id: string | null
          transaction_type: string
          reference_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
      },
      billing_history: {
        Row: {
          id: string
          user_id: string
          tier: string
          amount: number
          status: string
          payment_method: string | null
          invoice_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: string
          amount: number
          status?: string
          payment_method?: string | null
          invoice_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: string
          amount?: number
          status?: string
          payment_method?: string | null
          invoice_id?: string | null
          created_at?: string
          updated_at?: string
        }
      },
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          connect_limit: number
          connects_used: number
          start_date: string | null
          end_date: string | null
          recurring_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          status?: string
          connect_limit?: number
          connects_used?: number
          start_date?: string | null
          end_date?: string | null
          recurring_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          connect_limit?: number
          connects_used?: number
          start_date?: string | null
          end_date?: string | null
          recurring_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      },
      connections: {
        Row: {
          id: string
          requester_id: string
          receiver_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          receiver_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          receiver_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          last_message_at?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          text: string | null
          media_url: string | null
          media_type: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          text?: string | null
          media_url?: string | null
          media_type?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          text?: string | null
          media_url?: string | null
          media_type?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      blocked_users: {
        Row: {
          id: string
          user_id: string
          blocked_user_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          blocked_user_id: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          blocked_user_id?: string
          reason?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          title: string | null
          message: string | null
          related_user_id: string | null
          reference_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: string
          title?: string | null
          message?: string | null
          related_user_id?: string | null
          reference_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          title?: string | null
          message?: string | null
          related_user_id?: string | null
          reference_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      vlogs: {
        Row: {
          id: string
          user_id: string
          video_url: string
          caption: string | null
          view_count: number
          like_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          caption?: string | null
          view_count?: number
          like_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_url?: string
          caption?: string | null
          view_count?: number
          like_count?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          provider_id: string
          client_id: string
          service_mode: string
          booking_date: string
          start_time: string
          end_time: string
          location: string | null
          status: string
          total_price: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          client_id: string
          service_mode: string
          booking_date: string
          start_time: string
          end_time: string
          location?: string | null
          status?: string
          total_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          client_id?: string
          service_mode?: string
          booking_date?: string
          start_time?: string
          end_time?: string
          location?: string | null
          status?: string
          total_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          media_url: string
          media_type: string
          caption: string | null
          expires_at: string
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          media_url: string
          media_type: string
          caption?: string | null
          expires_at?: string
          view_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          media_url?: string
          media_type?: string
          caption?: string | null
          expires_at?: string
          view_count?: number
          created_at?: string
        }
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewer_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          story_id: string
          viewer_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          viewer_id?: string
          viewed_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          status: 'pending' | 'success' | 'expired'
          points_awarded: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          status?: 'pending' | 'success' | 'expired'
          points_awarded?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_id?: string
          status?: 'pending' | 'success' | 'expired'
          points_awarded?: number
          created_at?: string
          updated_at?: string
        }
      }
      points_history: {
        Row: {
          id: string
          user_id: string
          type: 'attendance' | 'referral' | 'vlog' | 'review' | 'purchase' | 'penalty'
          points: number
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'attendance' | 'referral' | 'vlog' | 'review' | 'purchase' | 'penalty'
          points: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'attendance' | 'referral' | 'vlog' | 'review' | 'purchase' | 'penalty'
          points?: number
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
      }
      daily_rewards: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          last_claim_date: string | null
          total_points_earned: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          last_claim_date?: string | null
          total_points_earned?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          last_claim_date?: string | null
          total_points_earned?: number
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          video_url: string
          thumbnail_url: string | null
          caption: string | null
          status: 'pending' | 'verified' | 'rejected'
          points_awarded: number
          view_count: number
          like_count: number
          comment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_url: string
          thumbnail_url?: string | null
          caption?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          points_awarded?: number
          view_count?: number
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_url?: string
          thumbnail_url?: string | null
          caption?: string | null
          status?: 'pending' | 'verified' | 'rejected'
          points_awarded?: number
          view_count?: number
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      video_likes: {
        Row: {
          id: string
          user_id: string
          video_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          created_at?: string
        }
      }
      video_comments: {
        Row: {
          id: string
          user_id: string
          video_id: string
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          text?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_message: {
        Args: {
          user_id: string
          target_user_id: string
        }
        Returns: boolean
      }
      is_user_blocked: {
        Args: {
          user_id: string
          target_user_id: string
        }
        Returns: boolean
      }
      get_connect_limit: {
        Args: {
          user_id: string
        }
        Returns: number
      }
    }
  }
}
