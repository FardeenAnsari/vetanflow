import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { postgresUuidSchema } from '../lib/validation.js'
import { requireAuth } from '../modules/auth/auth-middleware.js'
import {
  createHrMasterDataRepository,
  departmentArchiveSchema,
  departmentCreateSchema,
  departmentUpdateSchema,
  HrMasterDataWriteError,
  hrEmployeeCreateSchema,
  hrEmployeeUpdateSchema,
  locationArchiveSchema,
  locationCreateSchema,
  locationUpdateSchema,
  salaryRevisionCreateSchema,
  type HrMasterDataRepository,
} from '../modules/hr/hr-master-data-repository.js'

const employeePhotoMaxBytes = 2 * 1024 * 1024
const employeePhotoUpload = multer({
  limits: {
    fileSize: employeePhotoMaxBytes,
    files: 1,
  },
  storage: multer.memoryStorage(),
})

export function createHrRouter(repository: HrMasterDataRepository = createHrMasterDataRepository()) {
  const router = Router()

  router.get('/master-data', requireAuth, async (_, res) => {
    try {
      const result = await repository.list(res.locals.auth?.accessToken)

      res.json({ data: result.data, meta: { source: result.source } })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Unable to load HR master data' })
    }
  })

  router.post('/employees', requireAuth, async (req, res) => {
    const parsed = hrEmployeeCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid employee input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.createEmployee(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured')
    } catch (error) {
      sendRouteError(res, error, 'Unable to create employee', 'Employee code already exists for this organization')
    }
  })

  router.post('/employees/:employeeId/photo', requireAuth, parseEmployeePhoto, async (req, res) => {
    const employeeId = postgresUuidSchema.safeParse(req.params.employeeId)

    if (!employeeId.success) {
      res.status(400).json({ error: 'Invalid employee id' })
      return
    }

    if (!req.file) {
      res.status(400).json({ error: 'Choose a photo before uploading' })
      return
    }

    try {
      const result = await repository.uploadEmployeePhoto(employeeId.data, res.locals.auth?.userId, {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        size: req.file.size,
      })

      sendWriteResponse(res, result, 'Supabase service role is not configured')
    } catch (error) {
      sendRouteError(res, error, 'Unable to upload employee photo', 'Employee photo already exists')
    }
  })

  router.patch('/employees/:employeeId', requireAuth, async (req, res) => {
    const employeeId = postgresUuidSchema.safeParse(req.params.employeeId)
    const parsed = hrEmployeeUpdateSchema.safeParse(req.body)

    if (!employeeId.success) {
      res.status(400).json({ error: 'Invalid employee id' })
      return
    }

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid employee input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.updateEmployee(employeeId.data, res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured')
    } catch (error) {
      sendRouteError(res, error, 'Unable to update employee', 'Employee code already exists for this organization')
    }
  })

  router.post('/departments', requireAuth, async (req, res) => {
    const parsed = departmentCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid department input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.createDepartment(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured')
    } catch (error) {
      sendRouteError(res, error, 'Unable to create department', 'Department name already exists')
    }
  })

  router.patch('/departments/:departmentId', requireAuth, async (req, res) => {
    const departmentId = postgresUuidSchema.safeParse(req.params.departmentId)
    const parsed = departmentUpdateSchema.safeParse(req.body)

    if (!departmentId.success) {
      res.status(400).json({ error: 'Invalid department id' })
      return
    }

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid department input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.updateDepartment(departmentId.data, res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Department not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to update department', 'Department name already exists')
    }
  })

  router.post('/departments/:departmentId/archive', requireAuth, async (req, res) => {
    const departmentId = postgresUuidSchema.safeParse(req.params.departmentId)
    const parsed = departmentArchiveSchema.safeParse(req.body)

    if (!departmentId.success) {
      res.status(400).json({ error: 'Invalid department id' })
      return
    }

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid department input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.archiveDepartment(departmentId.data, res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Department not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to archive department', 'Department name already exists')
    }
  })

  router.post('/locations', requireAuth, async (req, res) => {
    const parsed = locationCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid location input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.createLocation(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured')
    } catch (error) {
      sendRouteError(res, error, 'Unable to create location', 'Location name already exists')
    }
  })

  router.patch('/locations/:locationId', requireAuth, async (req, res) => {
    const locationId = postgresUuidSchema.safeParse(req.params.locationId)
    const parsed = locationUpdateSchema.safeParse(req.body)

    if (!locationId.success) {
      res.status(400).json({ error: 'Invalid location id' })
      return
    }

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid location input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.updateLocation(locationId.data, res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Location not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to update location', 'Location name already exists')
    }
  })

  router.post('/locations/:locationId/archive', requireAuth, async (req, res) => {
    const locationId = postgresUuidSchema.safeParse(req.params.locationId)
    const parsed = locationArchiveSchema.safeParse(req.body)

    if (!locationId.success) {
      res.status(400).json({ error: 'Invalid location id' })
      return
    }

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid location input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.archiveLocation(locationId.data, res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Location not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to archive location', 'Location name already exists')
    }
  })

  router.post('/salary-revisions', requireAuth, async (req, res) => {
    const parsed = salaryRevisionCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid salary revision input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.recordSalaryRevision(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured')
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Unable to record salary revision' })
    }
  })

  return router
}

function parseEmployeePhoto(req: Request, res: Response, next: NextFunction) {
  employeePhotoUpload.single('photo')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'Photo must be 2 MB or smaller' })
      return
    }

    if (error) {
      res.status(400).json({ error: 'Invalid photo upload' })
      return
    }

    next()
  })
}

function sendWriteResponse<T>(
  res: Response,
  result: { data?: T; status: 'created' | 'forbidden' | 'not_configured' | 'not_found' | 'updated' },
  notConfiguredMessage: string,
  notFoundMessage = 'Employee not found',
) {
  if (result.status === 'not_configured') {
    res.status(501).json({ error: notConfiguredMessage })
    return
  }

  if (result.status === 'forbidden') {
    res.status(403).json({ error: 'You do not have permission to change HR master data' })
    return
  }

  if (result.status === 'not_found') {
    res.status(404).json({ error: notFoundMessage })
    return
  }

  res.status(result.status === 'updated' ? 200 : 201).json({ data: result.data, meta: { source: 'supabase' } })
}

function sendRouteError(res: Response, error: unknown, fallbackMessage: string, conflictMessage: string) {
  if (error instanceof HrMasterDataWriteError) {
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  if (hasPostgresErrorCode(error, '23505')) {
    res.status(409).json({ error: conflictMessage })
    return
  }

  console.error(error)
  res.status(500).json({ error: fallbackMessage })
}

function hasPostgresErrorCode(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  )
}
