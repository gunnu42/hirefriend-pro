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
    const { userId, points, transactionType, source, referenceId } = await req.json()

    if (!userId || typeof points !== 'number' || !transactionType || !source) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update wallet balance atomically
    const { error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: supabase.sql`wallet_balance + ${points}` })
      .eq('id', userId)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Optionally log a transaction in a dedicated table (if exists)
    await supabase.from('wallet_transactions').insert([
      {
        user_id: userId,
        transaction_type: transactionType,
        points,
        source,
        reference_id: referenceId || null,
      },
    ])

    // Create a notification for the user
    await supabase.from('notifications').insert([
      {
        user_id: userId,
        notification_type: 'points_earned',
        title: 'Points Updated',
        message: `${points > 0 ? '+' : ''}${points} points ${points > 0 ? 'added to' : 'deducted from'} your wallet`,
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
