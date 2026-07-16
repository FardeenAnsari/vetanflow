import * as Sentry from '@sentry/node'
import { env } from './config/env.js'

if (env.sentry.dsn) {
  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.sentry.environment,
    sendDefaultPii: false,
    tracesSampleRate: env.sentry.tracesSampleRate,
  })
}
