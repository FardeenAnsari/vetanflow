import { Router } from 'express'
import type { Response } from 'express'
import { requireAuth } from '../modules/auth/auth-middleware.js'
import {
  attendanceEntryUpsertSchema,
  attendanceMonthLockSchema,
  attendancePeriodQuerySchema,
  AttendanceWriteError,
  createAttendanceRepository,
  holidayCreateSchema,
  type AttendanceRepository,
} from '../modules/attendance/attendance-repository.js'

export function createAttendanceRouter(repository: AttendanceRepository = createAttendanceRepository()) {
  const router = Router()

  router.get('/dashboard', requireAuth, async (req, res) => {
    const parsed = attendancePeriodQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid attendance period input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.list(res.locals.auth?.accessToken, parsed.data.periodMonth)

      res.json({ data: result.data, meta: { source: result.source } })
    } catch (error) {
      sendRouteError(res, error, 'Unable to load attendance dashboard')
    }
  })

  router.post('/entries', requireAuth, async (req, res) => {
    const parsed = attendanceEntryUpsertSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid attendance entry input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.upsertAttendanceEntry(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Employee not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to save attendance entry')
    }
  })

  router.post('/holidays', requireAuth, async (req, res) => {
    const parsed = holidayCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid holiday input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.createHoliday(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Holiday organization not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to save holiday')
    }
  })

  router.post('/month-locks', requireAuth, async (req, res) => {
    const parsed = attendanceMonthLockSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid attendance lock input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.lockMonth(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Attendance month not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to lock attendance month')
    }
  })

  router.post('/month-locks/unlock', requireAuth, async (req, res) => {
    const parsed = attendanceMonthLockSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid attendance unlock input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.unlockMonth(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Attendance month lock not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to unlock attendance month')
    }
  })

  return router
}

function sendWriteResponse<T>(
  res: Response,
  result: {
    data?: T
    status: 'created' | 'deleted' | 'forbidden' | 'locked' | 'not_configured' | 'not_found' | 'updated'
  },
  notConfiguredMessage: string,
  notFoundMessage: string,
) {
  if (result.status === 'not_configured') {
    res.status(501).json({ error: notConfiguredMessage })
    return
  }

  if (result.status === 'forbidden') {
    res.status(403).json({ error: 'You do not have permission to change attendance data' })
    return
  }

  if (result.status === 'locked') {
    res.status(409).json({ error: 'This attendance month is locked' })
    return
  }

  if (result.status === 'not_found') {
    res.status(404).json({ error: notFoundMessage })
    return
  }

  const statusCode = result.status === 'created' ? 201 : 200

  res.status(statusCode).json({ data: result.data, meta: { source: 'supabase' } })
}

function sendRouteError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof AttendanceWriteError) {
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  console.error(error)
  res.status(500).json({ error: fallbackMessage })
}
