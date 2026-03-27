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
    const { userId, planType, amount } = await req.json()

    // Validate request
    if (!userId || !planType || !amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${userId.slice(0, 8)}`

    // Compute internal signature to validate webhook callbacks
    const secret = Deno.env.get('PAYMENT_SECRET') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(`${orderId}:${userId}:${planType}:${amount}`))
    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
    const signature = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    // Insert payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          user_id: userId,
          order_id: orderId,
          plan_type: planType,
          amount: amount,
          payment_status: 'pending',
        },
      ])
      .select()
      .single()

    if (paymentError) {
      return new Response(JSON.stringify({ error: paymentError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      orderId,
      userId,
      planType,
      amount,
      status: 'pending',
      signature,
      createdAt: payment.created_at,
    }), {
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