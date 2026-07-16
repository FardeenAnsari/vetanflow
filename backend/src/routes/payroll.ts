import { Router } from 'express'
import type { Response } from 'express'
import { postgresUuidSchema } from '../lib/validation.js'
import { requireAuth } from '../modules/auth/auth-middleware.js'
import { calculatePayrollPreview, payrollInputSchema } from '../modules/payroll/calculate-payroll.js'
import {
  createPayrollRunRepository,
  payrollAdjustmentCreateSchema,
  payrollRunCreateSchema,
  PayrollRunWriteError,
  type PayrollRunRepository,
} from '../modules/payroll/payroll-run-repository.js'
import {
  createPayrollExportRepository,
  payrollExportTypeSchema,
  type PayrollExportRepository,
} from '../modules/payroll/payroll-export-service.js'
import {
  createPayslipRepository,
  type PayslipRepository,
} from '../modules/payroll/payslip-service.js'

export function createPayrollRouter(
  repository: PayrollRunRepository = createPayrollRunRepository(),
  payslipRepository: PayslipRepository = createPayslipRepository(),
  exportRepository: PayrollExportRepository = createPayrollExportRepository(),
) {
  const router = Router()

  router.post('/preview', (req, res) => {
    const result = payrollInputSchema.safeParse(req.body)

    if (!result.success) {
      res.status(400).json({ error: 'Invalid payroll input', details: result.error.flatten() })
      return
    }

    res.json({ data: calculatePayrollPreview(result.data) })
  })

  router.get('/runs', requireAuth, async (_, res) => {
    try {
      const result = await repository.list(res.locals.auth?.accessToken)

      res.json({ data: result.data, meta: { source: result.source } })
    } catch (error) {
      sendRouteError(res, error, 'Unable to load payroll runs')
    }
  })

  router.get('/runs/:runId', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    try {
      const result = await repository.getRun(res.locals.auth?.accessToken, runId.data)

      if (!result.data) {
        res.status(404).json({ error: 'Payroll run not found' })
        return
      }

      res.json({ data: result.data, meta: { source: result.source } })
    } catch (error) {
      sendRouteError(res, error, 'Unable to load payroll run')
    }
  })

  router.get('/runs/:runId/exports/:exportType', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    const exportType = payrollExportTypeSchema.safeParse(req.params.exportType)

    if (!exportType.success) {
      res.status(400).json({ error: 'Invalid payroll export type' })
      return
    }

    try {
      const result = await exportRepository.getExport(runId.data, exportType.data, res.locals.auth?.userId)

      sendExportResponse(res, result)
    } catch (error) {
      sendRouteError(res, error, 'Unable to export payroll report')
    }
  })

  router.post('/runs', requireAuth, async (req, res) => {
    const parsed = payrollRunCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payroll run input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.createRun(res.locals.auth?.userId, parsed.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Payroll run not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to create payroll run')
    }
  })

  router.post('/runs/:runId/adjustments', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    const parsed = payrollAdjustmentCreateSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payroll adjustment input', details: parsed.error.flatten() })
      return
    }

    try {
      const result = await repository.createAdjustment(runId.data, res.locals.auth?.userId, parsed.data)

      sendWriteResponse(
        res,
        result,
        'Supabase service role is not configured',
        'Payroll run or employee not found',
      )
    } catch (error) {
      sendRouteError(res, error, 'Unable to create payroll adjustment')
    }
  })

  router.delete('/runs/:runId/adjustments/:adjustmentId', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)
    const adjustmentId = postgresUuidSchema.safeParse(req.params.adjustmentId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    if (!adjustmentId.success) {
      res.status(400).json({ error: 'Invalid payroll adjustment id' })
      return
    }

    try {
      const result = await repository.deleteAdjustment(runId.data, adjustmentId.data, res.locals.auth?.userId)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Payroll adjustment not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to delete payroll adjustment')
    }
  })

  router.post('/runs/:runId/recalculate', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    try {
      const result = await repository.recalculateRun(runId.data, res.locals.auth?.userId)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Payroll run not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to recalculate payroll run')
    }
  })

  router.post('/runs/:runId/submit', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    try {
      const result = await repository.submitRun(runId.data, res.locals.auth?.userId)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Payroll run not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to submit payroll run')
    }
  })

  router.post('/runs/:runId/approve', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    try {
      const result = await repository.approveRun(runId.data, res.locals.auth?.userId)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Payroll run not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to approve payroll run')
    }
  })

  router.post('/runs/:runId/finalize', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    try {
      const result = await repository.finalizeRun(runId.data, res.locals.auth?.userId)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Payroll run not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to finalize payroll run')
    }
  })

  router.post('/runs/:runId/payslips', requireAuth, async (req, res) => {
    const runId = postgresUuidSchema.safeParse(req.params.runId)

    if (!runId.success) {
      res.status(400).json({ error: 'Invalid payroll run id' })
      return
    }

    try {
      const result = await payslipRepository.createForRun(runId.data, res.locals.auth?.userId)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Payroll run not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to generate payslips')
    }
  })

  router.get('/payslips', requireAuth, async (_, res) => {
    try {
      const result = await payslipRepository.listForUser(res.locals.auth?.accessToken)

      res.json({ data: result.data, meta: { source: result.source } })
    } catch (error) {
      sendRouteError(res, error, 'Unable to load payslips')
    }
  })

  router.get('/payslips/:payslipId/download', requireAuth, async (req, res) => {
    const payslipId = postgresUuidSchema.safeParse(req.params.payslipId)

    if (!payslipId.success) {
      res.status(400).json({ error: 'Invalid payslip id' })
      return
    }

    try {
      const result = await payslipRepository.getDownload(res.locals.auth?.accessToken, payslipId.data)

      sendWriteResponse(res, result, 'Supabase service role is not configured', 'Payslip not found')
    } catch (error) {
      sendRouteError(res, error, 'Unable to prepare payslip download')
    }
  })

  return router
}

function sendExportResponse(
  res: Response,
  result: {
    data?: {
      content: string
      filename: string
    }
    status: 'forbidden' | 'not_configured' | 'not_found' | 'updated'
  },
) {
  if (result.status === 'not_configured') {
    res.status(501).json({ error: 'Supabase service role is not configured' })
    return
  }

  if (result.status === 'forbidden') {
    res.status(403).json({ error: 'You do not have permission to export payroll reports' })
    return
  }

  if (result.status === 'not_found' || !result.data) {
    res.status(404).json({ error: 'Payroll run not found' })
    return
  }

  res.status(200)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`)
  res.type('text/csv')
  res.send(result.data.content)
}

function sendWriteResponse<T>(
  res: Response,
  result: {
    data?: T
    status: 'created' | 'forbidden' | 'locked_required' | 'not_configured' | 'not_found' | 'updated'
  },
  notConfiguredMessage: string,
  notFoundMessage: string,
) {
  if (result.status === 'not_configured') {
    res.status(501).json({ error: notConfiguredMessage })
    return
  }

  if (result.status === 'forbidden') {
    res.status(403).json({ error: 'You do not have permission to change payroll runs' })
    return
  }

  if (result.status === 'locked_required') {
    res.status(409).json({ error: 'Lock attendance for this month before creating payroll' })
    return
  }

  if (result.status === 'not_found') {
    res.status(404).json({ error: notFoundMessage })
    return
  }

  res.status(result.status === 'created' ? 201 : 200).json({ data: result.data, meta: { source: 'supabase' } })
}

function sendRouteError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof PayrollRunWriteError) {
    res.status(error.statusCode).json({ error: error.message })
    return
  }

  console.error(error)
  res.status(500).json({ error: fallbackMessage })
}
