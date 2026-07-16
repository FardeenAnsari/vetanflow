import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import * as Sentry from '@sentry/node'
import { env } from './config/env.js'
import { createAttendanceRouter } from './routes/attendance.js'
import { createEmployeesRouter } from './routes/employees.js'
import { healthRouter } from './routes/health.js'
import { createHrRouter } from './routes/hr.js'
import { invitationsRouter } from './routes/invitations.js'
import { createLeaveRouter } from './routes/leave.js'
import { createPayrollRouter } from './routes/payroll.js'

export function createApp() {
  const app = express()
  const apiRateLimiter = rateLimit({
    legacyHeaders: false,
    limit: 300,
    message: { error: 'Too many requests. Try again later.' },
    standardHeaders: 'draft-8',
    windowMs: 15 * 60 * 1000,
  })

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
  }

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.corsOrigins }))
  app.use(express.json({ limit: '100kb' }))

  app.use('/health', healthRouter)
  app.use('/api', apiRateLimiter)
  app.use('/api/attendance', createAttendanceRouter())
  app.use('/api/employees', createEmployeesRouter())
  app.use('/api/hr', createHrRouter())
  app.use('/api/invitations', invitationsRouter)
  app.use('/api/leave', createLeaveRouter())
  app.use('/api/payroll', createPayrollRouter())

  app.use((_, res) => {
    res.status(404).json({ error: 'Route not found' })
  })

  Sentry.setupExpressErrorHandler(app)

  const finalErrorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    Sentry.captureException(error)
    response.status(500).json({ error: 'Internal server error' })
  }

  app.use(finalErrorHandler)

  return app
}
