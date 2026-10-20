import { createClient } from '@supabase/supabase-js'
import { fetchWithTimeout } from './api-client'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export function createIsolatedAuthClient() {
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase is not configured')
  return createClient(supabaseUrl, supabaseKey, {
    global: { fetch: fetchWithTimeout },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `vetanflow-sign-in-${crypto.randomUUID()}`,
    },
  })
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseKey as string, {
      global: { fetch: fetchWithTimeout },
      auth: {
        persistSession: true,
      },
    })
  : null
