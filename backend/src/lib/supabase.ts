import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js'
import WebSocket from 'ws'
import { getSupabasePublicConfig, getSupabaseServiceConfig } from '../config/env.js'
import type { Database } from './database.types.js'

type AppSupabaseClient = SupabaseClient<Database, 'public', 'public'>
type AppSupabaseOptions = SupabaseClientOptions<'public'>

let serviceClient: AppSupabaseClient | null = null
let publicClient: AppSupabaseClient | null = null

const realtimeTransport: AppSupabaseOptions['realtime'] = {
  transport: WebSocket as unknown as NonNullable<AppSupabaseOptions['realtime']>['transport'],
}

export function getSupabaseServiceClient() {
  const config = getSupabaseServiceConfig()

  if (!config) {
    return null
  }

  serviceClient ??= createClient<Database, 'public'>(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: realtimeTransport,
  })

  return serviceClient
}

export function getSupabasePublicClient() {
  const config = getSupabasePublicConfig()

  if (!config) {
    return null
  }

  publicClient ??= createClient<Database, 'public'>(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: realtimeTransport,
  })

  return publicClient
}

export function createSupabaseUserClient(accessToken: string) {
  const config = getSupabasePublicConfig()

  if (!config) {
    return null
  }

  return createClient<Database, 'public'>(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: realtimeTransport,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
