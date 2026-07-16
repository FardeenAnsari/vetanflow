import { Router } from 'express'
import type { Response } from 'express'
import { postgresUuidSchema } from '../lib/validation.js'
import { requireAuth } from '../modules/auth/auth-middleware.js'
import {
  createLeaveRepository,
  LeaveWriteError,
  leaveRequestCancelSchema,
  leaveRequestCreateSchema,
  leaveRequestReviewSchema,
  type LeaveRepository,
} from '../modules/leave/leave-repository.js'

export function createLeaveRouter(repository: LeaveRepository = createLeaveRepository()) {
  const router = Router()

  router.get('/dashboard', requireAuth, async (_, res) => {
    try {
      const result = await repository.list(res.locals.auth?.accessToken)

      res.json({ data: result.data, meta: { source: result.source } })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Unable to load leave dashboard' })
    }
  })

  router.post('/requests', requireAuth, async (req, res) => {
    const parsed = leaveRequestCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid leave request input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.createLeaveRequest(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Employee not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to create leave request')
    }
  })

  router.patch('/requests/:requestId/review', requireAuth, async (req, res) => {
    const requestId = postgresUuidSchema.safeParse(req.params.requestId)
    const parsed = leaveRequestReviewSchema.safeParse(req.body)

    if (!requestId.success) {
      res.status(400).json({ error: 'Invalid leave request id' })
      return
    }

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid leave review input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.reviewLeaveRequest(requestId.data, res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Leave request not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to review leave request')
    }
  })

  router.patch('/requests/:requestId/cancel', requireAuth, async (req, res) => {
    const requestId = postgresUuidSchema.safeParse(req.params.requestId)
    const parsed = leaveRequestCancelSchema.safeParse(req.body)

    if (!requestId.success) {
      res.status(400).json({ error: 'Invalid leave request id' })
      return
    }

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid leave cancel input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.cancelLeaveRequest(requestId.data, res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Leave request not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to cancel leave request')
    }
  })

  return router
}

function sendWriteResponse<T>(
  res: Response,
  result: { data?: T; status: 'created' | 'forbidden' | 'not_configured' | 'not_found' | 'updated' },
  notConfiguredMessage: string,
  notFoundMessage: string,
) {
  if (result.status === 'not_configured') {
    res.status(501).json({ error: notConfiguredMessage })
    return
  }

  if (result.status === 'forbidden') {
    res.status(403).json({ error: 'You do not have permission to change leave requests' })
    return
  }

  if (result.status === 'not_found') {
    res.status(404).json({ error: notFoundMessage })
    return
  }

  res.status(result.status === 'updated' ? 200 : 201).json({ data: result.data, meta: { source: 'supabase' } })
}

function sendRouteError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof LeaveWriteError) {
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  console.error(error)
  res.status(500).json({ error: fallbackMessage })
}
