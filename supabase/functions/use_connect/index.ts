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

    // Check current connects
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('connects_left')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (user.connects_left <= 0) {
      return new Response(JSON.stringify({ error: 'No connects remaining' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Update connects_left
    const { error: updateError } = await supabase
      .from('users')
      .update({
        connects_left: supabase.sql`connects_left - 1`,
      })
      .eq('id', userId)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
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