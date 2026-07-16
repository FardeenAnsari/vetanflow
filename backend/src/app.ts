import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
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

  app.use(helmet())
  app.use(cors({ origin: env.corsOrigins }))
  app.use(express.json())

  app.use('/health', healthRouter)
  app.use('/api/attendance', createAttendanceRouter())
  app.use('/api/employees', createEmployeesRouter())
  app.use('/api/hr', createHrRouter())
  app.use('/api/invitations', invitationsRouter)
  app.use('/api/leave', createLeaveRouter())
  app.use('/api/payroll', createPayrollRouter())

  app.use((_, res) => {
    res.status(404).json({ error: 'Route not found' })
  })

  return app
}
