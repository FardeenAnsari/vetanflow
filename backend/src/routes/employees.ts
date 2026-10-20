import { Router } from 'express'
import { requireAuth } from '../modules/auth/auth-middleware.js'
import { EmployeeAccountLinkError } from '../modules/auth/employee-account-link.js'
import {
  createEmployeeRepository,
  employeeCreateSchema,
  type EmployeeRepository,
} from '../modules/employees/employee-repository.js'

export function createEmployeesRouter(repository: EmployeeRepository = createEmployeeRepository()) {
  const router = Router()

  router.get('/', requireAuth, async (_, res) => {
    try {
      const result = await repository.list(res.locals.auth?.accessToken)

      res.json({ data: result.data, meta: { source: result.source } })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Unable to load employees' })
    }
  })

  router.get('/:id', requireAuth, async (req, res) => {
    try {
      const employeeId = String(req.params.id)
      const result = await repository.findById(employeeId, res.locals.auth?.accessToken)

      if (!result.data) {
        res.status(404).json({ error: 'Employee not found' })
        return
      }

      res.json({ data: result.data, meta: { source: result.source } })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Unable to load employee' })
    }
  })

  router.post('/', requireAuth, async (req, res) => {
    const parsed = employeeCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid employee input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.create(res.locals.auth?.userId, parsed.data)

      if (result.status === 'not_configured') {
        res.status(501).json({ error: 'Supabase service role is not configured' })
        return
      }

      if (result.status === 'forbidden') {
        res.status(403).json({ error: 'You do not have permission to create employees' })
        return
      }

      res.status(201).json({ data: result.data, meta: { source: 'supabase' } })
    } catch (error) {
      console.error(error)
      if (error instanceof EmployeeAccountLinkError) {
        res.status(error.statusCode).json({ error: error.message })
        return
      }
      res.status(500).json({ error: 'Unable to create employee' })
    }
  })

  return router
}
