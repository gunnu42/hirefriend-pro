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
    const { userId, orderId, signature } = await req.json()

    // Validate request
    if (!userId || !orderId || !signature) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', userId)
      .single()

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (payment.payment_status === 'success') {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Compute expected signature based on payment details and secret
    const secret = Deno.env.get('PAYMENT_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}:${userId}:${payment.plan_type}:${payment.amount}`))
    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
    const expectedSignature = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    const isValid = expectedSignature === signature

    if (isValid) {
      // Update payment status
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({ payment_status: 'success' })
        .eq('order_id', orderId)

      if (updatePaymentError) {
        return new Response(JSON.stringify({ error: updatePaymentError.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Update user subscription
      const planConnects = {
        silver: 25,
        gold: 60,
        platinum: 250,
      }

      const bonusAmount = payment.plan_type === 'gold' ? 100 : payment.plan_type === 'platinum' ? 200 : 0

      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          plan_type: payment.plan_type,
          connects_left: planConnects[payment.plan_type as keyof typeof planConnects],
          subscription_active: true,
          wallet_balance: supabase.sql`wallet_balance + ${bonusAmount}`,
        })
        .eq('id', userId)

      if (updateUserError) {
        return new Response(JSON.stringify({ error: updateUserError.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } else {
      // Update payment status to failed
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({ payment_status: 'failed' })
        .eq('order_id', orderId)

      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})