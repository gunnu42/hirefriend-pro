-- ============================================================================
-- Supabase Edge Functions
-- Deploy with: supabase functions deploy [function-name]
-- ============================================================================

-- ============================================================================
-- Function 1: Process Wallet Transaction
-- Secure wallet point updates with validation
-- ============================================================================

-- File: supabase/functions/process-wallet-transaction/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Get auth token from request
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Missing authorization', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  try {
    const { user_id, transaction_type, points, source, reference_id } = await req.json()

    // Validate request
    if (!user_id || !transaction_type || points === undefined) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Insert wallet transaction (trigger will auto-update wallet)
    const { data: transaction, error: txError } = await supabase
      .from('wallet_transactions')
      .insert([
        {
          user_id,
          transaction_type,
          points,
          source,
          reference_id,
        },
      ])
      .select()
      .single()

    if (txError) {
      return new Response(JSON.stringify({ error: txError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, transaction }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

-- ============================================================================
-- Function 2: Validate Onboarding Step
-- Backend validation for onboarding completion
-- ============================================================================

-- File: supabase/functions/validate-onboarding-step/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Missing authorization', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  try {
    const { user_id, step_number, data } = await req.json()

    if (!user_id || !step_number || !data) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let validationPassed = false
    let errorMessage = ''

    // Step 1: Personal Identity Validation
    if (step_number === 1) {
      const { full_name, date_of_birth, gender, current_city } = data

      if (!full_name || full_name.length < 3) {
        errorMessage = 'Full name must be at least 3 characters'
      } else if (!date_of_birth) {
        errorMessage = 'Date of birth is required'
      } else {
        // Check age >= 18
        const birthDate = new Date(date_of_birth)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()

        if (age < 18 || (age === 18 && monthDiff < 0)) {
          errorMessage = 'You must be 18+ to join.'
        } else {
          validationPassed = true
        }
      }

      if (validationPassed) {
        // Update user profile
        await supabase
          .from('users')
          .update({
            full_name,
            date_of_birth,
            gender,
            current_city,
          })
          .eq('id', user_id)

        // Mark step as completed
        await supabase
          .from('onboarding_profiles')
          .update({ step_1_completed: true, current_step: 2 })
          .eq('user_id', user_id)
      }
    }

    // Step 2: Vibe & Interests Validation
    else if (step_number === 2) {
      const { bio, interests, languages, personality_type } = data

      if (!bio || bio.length < 50) {
        errorMessage = 'Bio must be at least 50 characters'
      } else if (!interests || interests.length < 2) {
        errorMessage = 'Select at least 2 interests'
      } else {
        validationPassed = true

        // Update personality if provided
        if (personality_type) {
          await supabase
            .from('user_personality')
            .upsert(
              {
                user_id,
                personality_type_id: personality_type,
                bio,
                looking_for: data.looking_for || null,
              },
              { onConflict: 'user_id' }
            )
        }

        // Add interests
        for (const interestId of interests) {
          await supabase
            .from('user_interests')
            .insert({ user_id, interest_id: interestId })
            .select()
        }

        // Mark step as completed
        await supabase
          .from('onboarding_profiles')
          .update({ step_2_completed: true, current_step: 3 })
          .eq('user_id', user_id)
      }
    }

    // Step 3: Service Mode & Pricing
    else if (step_number === 3) {
      const { service_mode, hourly_rate, full_day_rate, weekend_rate } = data

      if (!service_mode || !['local_friend', 'virtual_friend'].includes(service_mode)) {
        errorMessage = 'Invalid service mode'
      } else if (hourly_rate === undefined || hourly_rate <= 0) {
        errorMessage = 'Hourly rate must be greater than 0'
      } else {
        validationPassed = true

        // Create service pricing
        await supabase
          .from('service_pricing')
          .upsert(
            {
              user_id,
              service_mode,
              hourly_rate,
              full_day_rate,
              weekend_rate,
            },
            { onConflict: 'user_id' }
          )

        // Mark step as completed
        await supabase
          .from('onboarding_profiles')
          .update({ step_3_completed: true, current_step: 4 })
          .eq('user_id', user_id)
      }
    }

    // Step 4: Media & KYC
    else if (step_number === 4) {
      const { profile_photos_count, has_selfie, has_kyc_document } = data

      if (!profile_photos_count || profile_photos_count < 3) {
        errorMessage = 'Upload at least 3 profile photos'
      } else if (!has_selfie) {
        errorMessage = 'Selfie is required'
      } else if (!has_kyc_document) {
        errorMessage = 'KYC document is required'
      } else {
        validationPassed = true

        // Mark step as completed and profile as complete
        await supabase
          .from('onboarding_profiles')
          .update({ step_4_completed: true, current_step: 5 })
          .eq('user_id', user_id)

        // Mark user profile as completed
        await supabase
          .from('users')
          .update({ profile_completed: true })
          .eq('id', user_id)
      }
    }

    if (!validationPassed) {
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

-- ============================================================================
-- Function 3: Process Payment
-- Secure payment processing
-- ============================================================================

-- File: supabase/functions/process-payment/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Missing authorization', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  try {
    const { user_id, amount, plan, payment_method_id } = await req.json()

    if (!user_id || !amount || !plan) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create payment transaction
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert([
        {
          user_id,
          amount,
          payment_method_id,
          transaction_type: 'subscription',
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (txError) {
      return new Response(JSON.stringify({ error: txError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // TODO: Integrate with actual payment provider (Stripe, Razorpay, etc)
    // For now, mark as completed
    const { data: updatedTx } = await supabase
      .from('payment_transactions')
      .update({ status: 'completed' })
      .eq('id', transaction.id)
      .select()
      .single()

    // Update subscription plan
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id,
          plan,
          status: 'active',
          start_date: new Date(),
          end_date: endDate,
          recurring_enabled: true,
        },
        { onConflict: 'user_id' }
      )

    // Create notification
    await supabase
      .from('notifications')
      .insert([
        {
          user_id,
          notification_type: 'payment',
          title: 'Payment Successful',
          message: `You now have ${plan} plan benefits`,
        },
      ])

    return new Response(JSON.stringify({ success: true, transaction: updatedTx }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

-- ============================================================================
-- Function 4: Create Review and Reward Points
-- Secure review creation with wallet reward
-- ============================================================================

-- File: supabase/functions/create-review-reward/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Missing authorization', { status: 401 })
  }

  const tokenHeader = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  try {
    const { reviewer_id, receiver_id, rating, comment } = await req.json()

    if (!reviewer_id || !receiver_id || !rating) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (reviewer_id === receiver_id) {
      return new Response(JSON.stringify({ error: 'Cannot review yourself' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', reviewer_id)
      .eq('receiver_id', receiver_id)
      .single()

    if (existingReview) {
      return new Response(JSON.stringify({ error: 'You already reviewed this user' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert([{ reviewer_id, receiver_id, rating, comment }])
      .select()
      .single()

    if (reviewError) {
      return new Response(JSON.stringify({ error: reviewError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Award 50 points to receiver
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert([
        {
          user_id: receiver_id,
          transaction_type: 'review_received',
          points: 50,
          source: 'review',
          reference_id: review.id,
        },
      ])

    if (!txError) {
      // Create notification
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: receiver_id,
            notification_type: 'review',
            title: 'New Review',
            message: `You received a ${rating}-star review. +50 points!`,
            related_user_id: reviewer_id,
            reference_id: review.id,
          },
        ])
    }

    return new Response(JSON.stringify({ success: true, review }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

-- ============================================================================
-- Function 5: Award Vlog Upload Points
-- Called after successful vlog upload
-- ============================================================================

-- File: supabase/functions/award-vlog-points/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  )

  try {
    const { user_id, vlog_id } = await req.json()

    if (!user_id || !vlog_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Award 400 points
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert([
        {
          user_id,
          transaction_type: 'vlog_upload',
          points: 400,
          source: 'vlog',
          reference_id: vlog_id,
        },
      ])

    if (txError) {
      return new Response(JSON.stringify({ error: txError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create notification
    await supabase
      .from('notifications')
      .insert([
        {
          user_id,
          notification_type: 'points_earned',
          title: 'Points Earned',
          message: 'Vlog upload completed! +400 points',
        },
      ])

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

-- ============================================================================
-- DEPLOYMENT INSTRUCTIONS
-- ============================================================================

-- 1. Initialize Supabase CLI:
--    supabase init

-- 2. Create function directories:
--    mkdir -p supabase/functions/{process-wallet-transaction,validate-onboarding-step,process-payment,create-review-reward,award-vlog-points}

-- 3. Copy respective index.ts files to each directory

-- 4. Deploy all functions:
--    supabase functions deploy process-wallet-transaction
--    supabase functions deploy validate-onboarding-step
--    supabase functions deploy process-payment
--    supabase functions deploy create-review-reward
--    supabase functions deploy award-vlog-points

-- 5. Test with:
--    curl -X POST http://localhost:54321/functions/v1/process-wallet-transaction \
--      -H "Authorization: Bearer YOUR_TOKEN" \
--      -H "Content-Type: application/json" \
--      -d '{"user_id": "...", "transaction_type": "review_received", "points": 50, "source": "review"}'
