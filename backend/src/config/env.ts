import { z } from 'zod'

const optionalString = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional())
const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional())

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: optionalUrl,
  SUPABASE_PUBLISHABLE_KEY: optionalString,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPABASE_SECRET_KEY: optionalString,
})

const parsed = envSchema.parse(process.env)
const publishableKey = parsed.SUPABASE_PUBLISHABLE_KEY ?? parsed.SUPABASE_ANON_KEY
const serviceRoleKey = parsed.SUPABASE_SERVICE_ROLE_KEY ?? parsed.SUPABASE_SECRET_KEY
const configuredCorsOrigins = parsed.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const localCorsOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
const corsOrigins =
  parsed.NODE_ENV === 'production'
    ? configuredCorsOrigins
    : Array.from(new Set([...configuredCorsOrigins, ...localCorsOrigins]))

export const env = {
  port: parsed.PORT,
  corsOrigins,
  supabase:
    parsed.SUPABASE_URL || publishableKey || serviceRoleKey
      ? {
          url: parsed.SUPABASE_URL,
          publishableKey,
          serviceRoleKey,
        }
      : null,
}

function getSupabaseBaseConfig() {
  if (!env.supabase) {
    return null
  }

  const { publishableKey, serviceRoleKey, url } = env.supabase

  if (!url) {
    throw new Error('SUPABASE_URL must be set when Supabase keys are configured')
  }

  return {
    publishableKey,
    serviceRoleKey,
    url,
  }
}

export function getSupabasePublicConfig() {
  const config = getSupabaseBaseConfig()

  if (!config) {
    return null
  }

  const { publishableKey, url } = config

  if (!publishableKey) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY must be set when Supabase Auth is configured')
  }

  return {
    url,
    publishableKey,
  }
}

export function getSupabaseServiceConfig() {
  const config = getSupabaseBaseConfig()

  if (!config) {
    return null
  }

  const { serviceRoleKey, url } = config

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set for server-side Supabase admin operations')
  }

  return {
    url,
    serviceRoleKey,
  }
}
