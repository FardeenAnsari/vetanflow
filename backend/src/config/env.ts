import { z } from 'zod'

const optionalString = z.preprocess((value) => (value === '' ? undefined : value), z.string().optional())
const optionalUrl = z.preprocess((value) => (value === '' ? undefined : value), z.string().url().optional())

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PAYROLL_CURRENCY: z.string().length(3).default('INR'),
  PAYROLL_LOCALE: z.string().default('en-IN'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SENTRY_DSN: optionalUrl,
  SENTRY_ENVIRONMENT: optionalString,
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.05),
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

if (parsed.NODE_ENV === 'production') {
  const missingSupabaseValues = [
    ['SUPABASE_URL', parsed.SUPABASE_URL],
    ['SUPABASE_PUBLISHABLE_KEY', publishableKey],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missingSupabaseValues.length) {
    throw new Error(`Production configuration is missing: ${missingSupabaseValues.join(', ')}`)
  }

  if (!process.env.CORS_ORIGIN || configuredCorsOrigins.includes('*')) {
    throw new Error('Production CORS_ORIGIN must explicitly list the trusted frontend origin(s)')
  }

  for (const origin of configuredCorsOrigins) {
    const parsedOrigin = new URL(origin)

    if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin) {
      throw new Error(`CORS_ORIGIN must contain origin-only HTTP(S) URLs: ${origin}`)
    }
  }
}

export const env = {
  port: parsed.PORT,
  corsOrigins,
  payroll: {
    currencyCode: parsed.PAYROLL_CURRENCY.toUpperCase(),
    locale: parsed.PAYROLL_LOCALE,
  },
  sentry: {
    dsn: parsed.SENTRY_DSN,
    environment: parsed.SENTRY_ENVIRONMENT ?? parsed.NODE_ENV,
    tracesSampleRate: parsed.SENTRY_TRACES_SAMPLE_RATE,
  },
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
