import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://vekguvhzvudcerubffnv.supabase.co"
const supabaseKey = "sb_publishable_gapEWbq_U-QygR7DVOdvvQ_EHtauG65"

export const supabase = createClient(supabaseUrl, supabaseKey)

