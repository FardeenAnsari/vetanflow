import { Router } from 'express'

export const healthRouter = Router()

healthRouter.get('/', (_, res) => {
  res.json({
    ok: true,
    service: 'payroll-api',
    timestamp: new Date().toISOString(),
  })
})
