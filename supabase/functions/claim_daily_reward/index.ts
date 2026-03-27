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
    const { userId } = await req.json()

    // Validate request
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if user already claimed today (you might want to add a claims table)
    // For now, just add the reward

    const rewardAmount = 50 // Daily reward amount

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        wallet_balance: supabase.sql`wallet_balance + ${rewardAmount}`,
      })
      .eq('id', userId)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Insert activity log (you might want to add an activity_logs table)
    // For now, just return success

    return new Response(JSON.stringify({ success: true, reward: rewardAmount }), {
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