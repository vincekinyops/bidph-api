import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Env } from '../env.js'

export function createAdminClient(config: Env): SupabaseClient {
  return createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
