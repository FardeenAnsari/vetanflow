import { z } from 'zod'
import { createSupabaseUserClient, getSupabaseServiceClient } from '../../lib/supabase.js'
import { postgresUuidSchema } from '../../lib/validation.js'
import {
  buildAttendanceSummaries,
  getMonthBounds,
  normalizePeriodMonth,
  type ApprovedLeaveRow,
  type AttendanceEmployee,
  type AttendanceEntry,
  type Holiday,
} from '../attendance/attendance-repository.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'
import type { AppRole } from '../employees/sample-data.js'
import { calculatePayrollPreview } from './calculate-payroll.js'

type DataSource = 'fixture' | 'supabase'

type Result<T> = {
  data: T
  source: DataSource
}

type WriteStatus = 'created' | 'forbidden' | 'locked_required' | 'not_configured' | 'not_found' | 'updated'
type PayrollRunStatus = 'draft' | 'reviewing' | 'approved' | 'finalized' | 'cancelled'
type PayrollAdjustmentComponentType = 'deduction' | 'earning' | 'reimbursement'
type PayrollAdjustmentTaxTreatment =
  | 'non_taxable_reimbursement'
  | 'post_tax_deduction'
  | 'pre_tax_deduction'
  | 'taxable'

export type PayrollVarianceWarning = {
  code: 'net_pay_variance'
  currentNetPay: number
  delta: number
  deltaPercent: number | null
  message: string
  previousNetPay: number
  severity: 'high' | 'medium'
}

export type PayrollLinePayslip = {
  id: string
  publishedAt: string | null
}

export type PayrollAdjustment = {
  amount: number
  componentCode: string
  componentName: string
  componentType: PayrollAdjustmentComponentType
  createdAt: string
  createdBy: string | null
  employeeId: string
  id: string
  notes: string | null
  payrollRunId: string
  taxTreatment: PayrollAdjustmentTaxTreatment
  updatedAt: string
}

export type PayrollRunLine = {
  adjustmentNetImpact: number
  adjustments: PayrollAdjustment[]
  calculationSnapshot: unknown
  employeeCode: string
  employeeId: string
  employeeName: string
  grossPay: number
  id: string
  lossOfPayDays: number
  netPay: number
  overtimeAmount: number
  payslip: PayrollLinePayslip | null
  totalDeductions: number
  totalEarnings: number
  varianceWarnings: PayrollVarianceWarning[]
}

export type PayrollRun = {
  approvedAt: string | null
  approvedBy: string | null
  attendanceMonthLockId: string | null
  createdAt: string
  createdBy: string | null
  finalizedBy: string | null
  finalizedAt: string | null
  grossPay: number
  id: string
  lineCount: number
  netPay: number
  periodEnd: string
  periodStart: string
  status: PayrollRunStatus
  submittedAt: string | null
  submittedBy: string | null
  totalDeductions: number
  totalEarnings: number
  updatedAt: string
}

export type PayrollRunDetail = PayrollRun & {
  lines: PayrollRunLine[]
}

export type PayrollDashboard = {
  currentUserRoles: AppRole[]
  organization: {
    id: string
    name: string
  } | null
  runs: PayrollRun[]
}

export const payrollRunCreateSchema = z.object({
  organizationId: postgresUuidSchema,
  periodMonth: z.iso.date(),
})

export type PayrollRunCreateInput = z.infer<typeof payrollRunCreateSchema>

export const payrollAdjustmentCreateSchema = z.object({
  amount: z.coerce.number().positive().max(99999999),
  componentCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .transform((value) => value.toUpperCase()),
  componentName: z.string().trim().min(2).max(120),
  componentType: z.enum(['earning', 'deduction', 'reimbursement']),
  employeeId: postgresUuidSchema,
  notes: z.string().trim().max(500).optional(),
  taxTreatment: z
    .enum(['taxable', 'pre_tax_deduction', 'post_tax_deduction', 'non_taxable_reimbursement'])
    .optional(),
})

export type PayrollAdjustmentCreateInput = z.infer<typeof payrollAdjustmentCreateSchema>

export class PayrollRunWriteError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

type ServiceClient = NonNullable<ReturnType<typeof getSupabaseServiceClient>>

type ProfileRow = {
  organization_id: string | null
  organizations: { id: string; name: string } | { id: string; name: string }[] | null
}

type RoleRow = {
  role: AppRole
}

type PayrollRunRow = {
  approved_at: string | null
  approved_by: string | null
  attendance_month_lock_id: string | null
  created_at: string
  created_by: string | null
  finalized_by: string | null
  finalized_at: string | null
  id: string
  period_end: string
  period_start: string
  status: PayrollRunStatus
  submitted_at: string | null
  submitted_by: string | null
  updated_at?: string
}

type PayrollRunLineRow = {
  calculation_snapshot: unknown
  employee_id: string
  employees: { employee_code: string; full_name: string } | { employee_code: string; full_name: string }[] | null
  gross_pay: number
  id: string
  net_pay: number
  payslips: { id: string; published_at: string | null } | { id: string; published_at: string | null }[] | null
  total_deductions: number
  total_earnings: number
}

type PayrollRunWithLinesRow = PayrollRunRow & {
  payroll_run_lines: PayrollRunLineRow[] | null
}

type PayrollAdjustmentRow = {
  amount: number
  component_code: string
  component_name: string
  component_type: PayrollAdjustmentComponentType
  created_at: string
  created_by: string | null
  employee_id: string
  id: string
  notes: string | null
  payroll_run_id: string
  tax_treatment: PayrollAdjustmentTaxTreatment
  updated_at: string
}

type PreviousPayrollRunRow = {
  payroll_run_lines: { employee_id: string; net_pay: number }[] | null
}

type PayrollEmployeeRow = {
  annual_ctc: number
  employee_code: string
  full_name: string
  id: string
  organization_id: string
}

type AttendanceEntryRow = {
  attendance_status: AttendanceEntry['attendanceStatus']
  employee_id: string
  employees: { employee_code: string; full_name: string } | { employee_code: string; full_name: string }[] | null
  id: string
  notes: string | null
  overtime_hours: number
  payable_hours: number
  work_date: string
}

type HolidayRow = {
  holiday_date: string
  id: string
  name: string
  region: string
}

export type PayrollRunRepository = {
  approveRun: (
    runId: string,
    actorUserId: string | undefined,
  ) => Promise<{ data?: PayrollRunDetail; status: WriteStatus }>
  createAdjustment: (
    runId: string,
    actorUserId: string | undefined,
    input: PayrollAdjustmentCreateInput,
  ) => Promise<{ data?: PayrollRunDetail; status: WriteStatus }>
  createRun: (
    actorUserId: string | undefined,
    input: PayrollRunCreateInput,
  ) => Promise<{ data?: PayrollRunDetail; status: WriteStatus }>
  deleteAdjustment: (
    runId: string,
    adjustmentId: string,
    actorUserId: string | undefined,
  ) => Promise<{ data?: PayrollRunDetail; status: WriteStatus }>
  finalizeRun: (
    runId: string,
    actorUserId: string | undefined,
  ) => Promise<{ data?: PayrollRunDetail; status: WriteStatus }>
  getRun: (accessToken: string | undefined, runId: string) => Promise<Result<PayrollRunDetail | null>>
  list: (accessToken?: string) => Promise<Result<PayrollDashboard>>
  recalculateRun: (
    runId: string,
    actorUserId: string | undefined,
  ) => Promise<{ data?: PayrollRunDetail; status: WriteStatus }>
  submitRun: (
    runId: string,
    actorUserId: string | undefined,
  ) => Promise<{ data?: PayrollRunDetail; status: WriteStatus }>
}

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function toPayrollAdjustment(row: PayrollAdjustmentRow): PayrollAdjustment {
  return {
    amount: Number(row.amount),
    componentCode: row.component_code,
    componentName: row.component_name,
    componentType: row.component_type,
    createdAt: row.created_at,
    createdBy: row.created_by,
    employeeId: row.employee_id,
    id: row.id,
    notes: row.notes,
    payrollRunId: row.payroll_run_id,
    taxTreatment: row.tax_treatment,
    updatedAt: row.updated_at,
  }
}

function getDefaultTaxTreatment(componentType: PayrollAdjustmentComponentType): PayrollAdjustmentTaxTreatment {
  if (componentType === 'deduction') {
    return 'post_tax_deduction'
  }

  if (componentType === 'reimbursement') {
    return 'non_taxable_reimbursement'
  }

  return 'taxable'
}

function normalizeAdjustmentInput(input: PayrollAdjustmentCreateInput) {
  const taxTreatment = input.taxTreatment ?? getDefaultTaxTreatment(input.componentType)

  return {
    ...input,
    notes: input.notes?.trim() ? input.notes.trim() : null,
    taxTreatment,
  }
}

function getSnapshotArray<T>(snapshot: unknown, key: string): T[] {
  if (!isRecord(snapshot)) {
    return []
  }

  const value = snapshot[key]

  return Array.isArray(value) ? (value as T[]) : []
}

function getSnapshotNumber(snapshot: unknown, path: string[]) {
  let current: unknown = snapshot

  for (const key of path) {
    if (!isRecord(current)) {
      return 0
    }

    current = current[key]
  }

  return typeof current === 'number' ? current : 0
}

function getFallbackDashboard(): PayrollDashboard {
  return {
    currentUserRoles: ['owner'],
    organization: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'VetanFlow Demo India',
    },
    runs: [],
  }
}

function toPayrollLine(row: PayrollRunLineRow): PayrollRunLine {
  const employee = firstRelation(row.employees)
  const payslip = firstRelation(row.payslips)
  const snapshot = isRecord(row.calculation_snapshot) ? row.calculation_snapshot : null
  const adjustmentSnapshot = snapshot && isRecord(snapshot.adjustments) ? snapshot.adjustments : null
  const adjustmentItems = Array.isArray(adjustmentSnapshot?.items)
    ? (adjustmentSnapshot.items as PayrollAdjustment[])
    : []
  const varianceWarnings = getSnapshotArray<PayrollVarianceWarning>(snapshot, 'varianceWarnings')

  return {
    adjustmentNetImpact: getSnapshotNumber(snapshot, ['adjustments', 'netImpact']),
    adjustments: adjustmentItems,
    calculationSnapshot: row.calculation_snapshot,
    employeeCode: employee?.employee_code ?? 'Unknown',
    employeeId: row.employee_id,
    employeeName: employee?.full_name ?? 'Unknown employee',
    grossPay: Number(row.gross_pay),
    id: row.id,
    lossOfPayDays: getSnapshotNumber(snapshot, ['attendance', 'lossOfPayDays']),
    netPay: Number(row.net_pay),
    overtimeAmount: getSnapshotNumber(snapshot, ['overtime', 'amount']),
    payslip: payslip
      ? {
          id: payslip.id,
          publishedAt: payslip.published_at,
        }
      : null,
    totalDeductions: Number(row.total_deductions),
    totalEarnings: Number(row.total_earnings),
    varianceWarnings,
  }
}

function summarizeRun(row: PayrollRunWithLinesRow): PayrollRun {
  const lines = (row.payroll_run_lines ?? []).map(toPayrollLine)

  return {
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    attendanceMonthLockId: row.attendance_month_lock_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    finalizedBy: row.finalized_by,
    finalizedAt: row.finalized_at,
    grossPay: sumMoney(lines, 'grossPay'),
    id: row.id,
    lineCount: lines.length,
    netPay: sumMoney(lines, 'netPay'),
    periodEnd: row.period_end,
    periodStart: row.period_start,
    status: row.status,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
    totalDeductions: sumMoney(lines, 'totalDeductions'),
    totalEarnings: sumMoney(lines, 'totalEarnings'),
    updatedAt: row.updated_at ?? row.created_at,
  }
}

function toPayrollRunDetail(row: PayrollRunWithLinesRow): PayrollRunDetail {
  return {
    ...summarizeRun(row),
    lines: (row.payroll_run_lines ?? []).map(toPayrollLine),
  }
}

function sumMoney(lines: PayrollRunLine[], key: 'grossPay' | 'netPay' | 'totalDeductions' | 'totalEarnings') {
  return Math.round(lines.reduce((total, line) => total + line[key], 0) * 100) / 100
}

async function canWritePayroll(actorUserId: string | undefined, organizationId: string) {
  if (!actorUserId) {
    return false
  }

  const roles = await getUserRoles(actorUserId, organizationId)

  return hasAnyRole(roles, ['owner', 'admin', 'hr', 'finance'])
}

async function canApprovePayroll(actorUserId: string | undefined, organizationId: string) {
  if (!actorUserId) {
    return false
  }

  const roles = await getUserRoles(actorUserId, organizationId)

  return hasAnyRole(roles, ['owner', 'admin', 'finance'])
}

export type PayrollMakerCheckerRun = {
  created_by: string | null
  submitted_by: string | null
}

export function getPayrollMakerCheckerConflict(
  run: PayrollMakerCheckerRun,
  actorUserId: string | undefined,
) {
  if (!actorUserId) {
    return null
  }

  if (run.submitted_by === actorUserId) {
    return 'submitter' as const
  }

  if (run.created_by === actorUserId) {
    return 'creator' as const
  }

  return null
}

function ensureDifferentPayrollChecker(
  run: PayrollMakerCheckerRun,
  actorUserId: string | undefined,
  action: 'approve' | 'finalize',
) {
  if (getPayrollMakerCheckerConflict(run, actorUserId)) {
    throw new PayrollRunWriteError(
      409,
      `Maker-checker control requires a different user to ${action} this payroll run`,
    )
  }
}

function toAttendanceEmployee(row: PayrollEmployeeRow): AttendanceEmployee {
  return {
    annualCtc: row.annual_ctc,
    code: row.employee_code,
    fullName: row.full_name,
    id: row.id,
    organizationId: row.organization_id,
  }
}

function toAttendanceEntry(row: AttendanceEntryRow): AttendanceEntry {
  const employee = firstRelation(row.employees)

  return {
    attendanceStatus: row.attendance_status,
    employeeCode: employee?.employee_code ?? 'Unknown',
    employeeId: row.employee_id,
    employeeName: employee?.full_name ?? 'Unknown employee',
    id: row.id,
    notes: row.notes,
    overtimeHours: Number(row.overtime_hours),
    payableHours: Number(row.payable_hours),
    workDate: row.work_date,
  }
}

function toHoliday(row: HolidayRow): Holiday {
  return {
    holidayDate: row.holiday_date,
    id: row.id,
    name: row.name,
    region: row.region,
  }
}

async function loadAdjustmentsForRun(supabase: ServiceClient, runId: string) {
  const db = supabase as any
  const { data, error } = await db
    .from('payroll_adjustments')
    .select(
      `
        amount,
        component_code,
        component_name,
        component_type,
        created_at,
        created_by,
        employee_id,
        id,
        notes,
        payroll_run_id,
        tax_treatment,
        updated_at
      `,
    )
    .eq('payroll_run_id', runId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return ((data ?? []) as PayrollAdjustmentRow[]).map(toPayrollAdjustment)
}

async function loadPreviousNetPayByEmployee(
  supabase: ServiceClient,
  organizationId: string,
  periodStart: string,
) {
  const db = supabase as any
  const { data, error } = await db
    .from('payroll_runs')
    .select(
      `
        payroll_run_lines(employee_id, net_pay)
      `,
    )
    .eq('organization_id', organizationId)
    .lt('period_start', periodStart)
    .in('status', ['approved', 'finalized'])
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  const previousRun = data as PreviousPayrollRunRow | null
  const netPayByEmployee = new Map<string, number>()

  for (const line of previousRun?.payroll_run_lines ?? []) {
    netPayByEmployee.set(line.employee_id, Number(line.net_pay))
  }

  return netPayByEmployee
}

function groupAdjustmentsByEmployee(adjustments: PayrollAdjustment[]) {
  const grouped = new Map<string, PayrollAdjustment[]>()

  for (const adjustment of adjustments) {
    const employeeAdjustments = grouped.get(adjustment.employeeId) ?? []
    employeeAdjustments.push(adjustment)
    grouped.set(adjustment.employeeId, employeeAdjustments)
  }

  return grouped
}

function summarizeAdjustments(adjustments: PayrollAdjustment[]) {
  return adjustments.reduce(
    (totals, adjustment) => {
      if (adjustment.componentType === 'reimbursement') {
        totals.reimbursementAmount += adjustment.amount
        return totals
      }

      if (adjustment.componentType === 'deduction') {
        if (adjustment.taxTreatment === 'pre_tax_deduction') {
          totals.preTaxDeductionAmount += adjustment.amount
        } else {
          totals.postTaxDeductionAmount += adjustment.amount
        }
        return totals
      }

      totals.taxableEarningsAmount += adjustment.amount
      return totals
    },
    {
      postTaxDeductionAmount: 0,
      preTaxDeductionAmount: 0,
      reimbursementAmount: 0,
      taxableEarningsAmount: 0,
    },
  )
}

function calculateOvertimeAmount(summary: ReturnType<typeof buildAttendanceSummaries>[number]) {
  if (!summary.overtimeHours) {
    return 0
  }

  const hourlyRate = summary.grossMonthly / Math.max(summary.calendarDays, 1) / 8

  return roundMoney(hourlyRate * summary.overtimeHours * 1.5)
}

function buildVarianceWarnings(currentNetPay: number, previousNetPay: number | undefined): PayrollVarianceWarning[] {
  if (typeof previousNetPay !== 'number') {
    return []
  }

  const delta = roundMoney(currentNetPay - previousNetPay)
  const deltaPercent = previousNetPay === 0 ? null : roundMoney((delta / previousNetPay) * 100)
  const absolutePercent = Math.abs(deltaPercent ?? 0)

  if (Math.abs(delta) < 5000 && absolutePercent < 10) {
    return []
  }

  const direction = delta > 0 ? 'increased' : 'decreased'
  const amount = Math.abs(delta)

  return [
    {
      code: 'net_pay_variance',
      currentNetPay,
      delta,
      deltaPercent,
      message: `Net pay ${direction} by INR ${amount.toFixed(2)} from the previous approved run`,
      previousNetPay,
      severity: absolutePercent >= 20 || Math.abs(delta) >= 20000 ? 'high' : 'medium',
    },
  ]
}

async function loadPayrollRun(supabase: ServiceClient, runId: string) {
  const db = supabase as any
  const { data, error } = await db
    .from('payroll_runs')
    .select(
      `
        attendance_month_lock_id,
        approved_at,
        approved_by,
        created_at,
        created_by,
        finalized_by,
        finalized_at,
        id,
        period_end,
        period_start,
        status,
        submitted_at,
        submitted_by,
        updated_at,
        payroll_run_lines(
          calculation_snapshot,
          employee_id,
          gross_pay,
          id,
          net_pay,
          total_deductions,
          total_earnings,
          payslips(id, published_at),
          employees(employee_code, full_name)
        )
      `,
    )
    .eq('id', runId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as PayrollRunWithLinesRow | null
}

async function loadPayrollRunForWrite(supabase: ServiceClient, runId: string) {
  const db = supabase as any
  const { data, error } = await db
    .from('payroll_runs')
    .select(
      `
        approved_at,
        approved_by,
        attendance_month_lock_id,
        created_at,
        created_by,
        finalized_by,
        finalized_at,
        id,
        organization_id,
        period_end,
        period_start,
        status,
        submitted_at,
        submitted_by,
        updated_at
      `,
    )
    .eq('id', runId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as (PayrollRunRow & { organization_id: string }) | null
}

async function ensureRunHasLines(supabase: ServiceClient, runId: string, action: string) {
  const { count, error } = await supabase
    .from('payroll_run_lines')
    .select('id', { count: 'exact', head: true })
    .eq('payroll_run_id', runId)

  if (error) {
    throw error
  }

  if (!count) {
    throw new PayrollRunWriteError(409, `Cannot ${action} a payroll run without employee lines`)
  }
}

async function updateRunStatus(
  supabase: ServiceClient,
  run: PayrollRunRow & { organization_id: string },
  actorUserId: string | undefined,
  update: Record<string, string | null>,
  auditAction: string,
) {
  const db = supabase as any
  const { error } = await db
    .from('payroll_runs')
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq('id', run.id)

  if (error) {
    throw error
  }

  await supabase.from('audit_logs').insert({
    action: auditAction,
    actor_id: actorUserId,
    entity_id: run.id,
    entity_type: 'payroll_run',
    metadata: {
      from_status: run.status,
      period_end: run.period_end,
      period_start: run.period_start,
      to_status: update.status,
    },
    organization_id: run.organization_id,
  })

  const detail = await loadPayrollRun(supabase, run.id)

  return { data: detail ? toPayrollRunDetail(detail) : undefined, status: 'updated' as const }
}

async function loadAttendanceInputs(supabase: ServiceClient, organizationId: string, periodMonth: string) {
  const period = getMonthBounds(periodMonth)
  const db = supabase as any
  const [lockResult, employeesResult, entriesResult, holidaysResult, leavesResult] = await Promise.all([
    db
      .from('attendance_month_locks')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('period_month', period.month)
      .maybeSingle(),
    supabase
      .from('employees')
      .select('id, organization_id, employee_code, full_name, annual_ctc')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('employee_code', { ascending: true }),
    db
      .from('attendance_entries')
      .select(
        `
          attendance_status,
          employee_id,
          id,
          notes,
          overtime_hours,
          payable_hours,
          work_date,
          employees(employee_code, full_name)
        `,
      )
      .eq('organization_id', organizationId)
      .gte('work_date', period.startDate)
      .lte('work_date', period.endDate)
      .order('work_date', { ascending: true }),
    supabase
      .from('holidays')
      .select('holiday_date, id, name, region')
      .eq('organization_id', organizationId)
      .gte('holiday_date', period.startDate)
      .lte('holiday_date', period.endDate)
      .order('holiday_date', { ascending: true }),
    supabase
      .from('leave_requests')
      .select('employee_id, end_date, leave_type, start_date')
      .eq('organization_id', organizationId)
      .eq('status', 'approved')
      .lte('start_date', period.endDate)
      .gte('end_date', period.startDate),
  ])

  for (const result of [lockResult, employeesResult, entriesResult, holidaysResult, leavesResult]) {
    if (result.error) {
      throw result.error
    }
  }

  const lock = lockResult.data as { id: string } | null

  if (!lock) {
    return { lock: null, period, summaries: [] }
  }

  const employees = ((employeesResult.data ?? []) as PayrollEmployeeRow[]).map(toAttendanceEmployee)
  const entries = ((entriesResult.data ?? []) as AttendanceEntryRow[]).map(toAttendanceEntry)
  const holidays = ((holidaysResult.data ?? []) as HolidayRow[]).map(toHoliday)
  const approvedLeaves = (leavesResult.data ?? []) as ApprovedLeaveRow[]

  return {
    lock,
    period,
    summaries: buildAttendanceSummaries(employees, entries, holidays, approvedLeaves, period),
  }
}

function buildLineInsert(
  runId: string,
  attendanceMonthLockId: string,
  period: ReturnType<typeof getMonthBounds>,
  adjustmentsByEmployee: Map<string, PayrollAdjustment[]>,
  previousNetPayByEmployee: Map<string, number>,
) {
  return (summary: ReturnType<typeof buildAttendanceSummaries>[number]) => {
    const adjustments = adjustmentsByEmployee.get(summary.employeeId) ?? []
    const adjustmentTotals = summarizeAdjustments(adjustments)
    const overtimeAmount = calculateOvertimeAmount(summary)
    const payrollPreview = calculatePayrollPreview({
      annualCtc: summary.grossMonthly * 12,
      employeeId: summary.employeeId,
      overtimeAmount,
      payableDays: summary.calendarDays,
      postTaxDeductionAmount: adjustmentTotals.postTaxDeductionAmount,
      preTaxDeductionAmount: adjustmentTotals.preTaxDeductionAmount,
      reimbursementAmount: adjustmentTotals.reimbursementAmount,
      taxableEarningsAmount: adjustmentTotals.taxableEarningsAmount,
      unpaidLeaveDays: summary.lossOfPayDays,
    })
    const adjustmentNetImpact = roundMoney(
      adjustmentTotals.taxableEarningsAmount +
        adjustmentTotals.reimbursementAmount -
        adjustmentTotals.preTaxDeductionAmount -
        adjustmentTotals.postTaxDeductionAmount,
    )
    const previousNetPay = previousNetPayByEmployee.get(summary.employeeId)
    const varianceWarnings = buildVarianceWarnings(payrollPreview.netPay, previousNetPay)
    const netPayDelta = typeof previousNetPay === 'number' ? roundMoney(payrollPreview.netPay - previousNetPay) : null
    const netPayDeltaPercent =
      typeof previousNetPay === 'number' && previousNetPay !== 0 ? roundMoney((netPayDelta! / previousNetPay) * 100) : null
    const snapshot = {
      adjustments: {
        items: adjustments,
        netImpact: adjustmentNetImpact,
        totals: {
          deductions: roundMoney(
            adjustmentTotals.preTaxDeductionAmount + adjustmentTotals.postTaxDeductionAmount,
          ),
          preTaxDeductions: roundMoney(adjustmentTotals.preTaxDeductionAmount),
          postTaxDeductions: roundMoney(adjustmentTotals.postTaxDeductionAmount),
          reimbursements: roundMoney(adjustmentTotals.reimbursementAmount),
          taxableEarnings: roundMoney(adjustmentTotals.taxableEarningsAmount),
        },
      },
      attendance: {
        absentDays: summary.absentDays,
        approvedLeaveDays: summary.approvedLeaveDays,
        calendarDays: summary.calendarDays,
        halfDays: summary.halfDays,
        holidays: summary.holidays,
        lossOfPayDays: summary.lossOfPayDays,
        paidLeaveDays: summary.paidLeaveDays,
        payableDays: summary.payableDays,
        presentDays: summary.presentDays,
        unpaidLeaveDays: summary.unpaidLeaveDays,
        weeklyOffDays: summary.weeklyOffDays,
      },
      employee: {
        code: summary.employeeCode,
        id: summary.employeeId,
        name: summary.employeeName,
      },
      overtime: {
        amount: overtimeAmount,
        hours: summary.overtimeHours,
        multiplier: 1.5,
      },
      payroll: payrollPreview,
      period,
      source: {
        attendanceMonthLockId,
        version: 'phase_4c_v1',
      },
      variance: {
        netPayDelta,
        netPayDeltaPercent,
        previousNetPay: previousNetPay ?? null,
      },
      varianceWarnings,
    }

    return {
      calculation_snapshot: snapshot,
      employee_id: summary.employeeId,
      gross_pay: payrollPreview.grossMonthly,
      net_pay: payrollPreview.netPay,
      payroll_run_id: runId,
      total_deductions: payrollPreview.totalDeductions,
      total_earnings: payrollPreview.totalEarnings,
      updated_at: new Date().toISOString(),
    }
  }
}

async function replaceRunLines(
  supabase: ServiceClient,
  runId: string,
  attendanceMonthLockId: string,
  period: ReturnType<typeof getMonthBounds>,
  summaries: ReturnType<typeof buildAttendanceSummaries>,
  adjustments: PayrollAdjustment[],
  previousNetPayByEmployee: Map<string, number>,
) {
  const db = supabase as any
  const deleteResult = await supabase.from('payroll_run_lines').delete().eq('payroll_run_id', runId)

  if (deleteResult.error) {
    throw deleteResult.error
  }

  if (!summaries.length) {
    return
  }

  const { error } = await db
    .from('payroll_run_lines')
    .insert(
      summaries.map(
        buildLineInsert(
          runId,
          attendanceMonthLockId,
          period,
          groupAdjustmentsByEmployee(adjustments),
          previousNetPayByEmployee,
        ),
      ),
    )

  if (error) {
    throw error
  }
}

async function regenerateRun(
  supabase: ServiceClient,
  run: PayrollRunRow & { organization_id: string },
  actorUserId: string | undefined,
) {
  if (run.status !== 'draft' && run.status !== 'reviewing') {
    throw new PayrollRunWriteError(409, 'Only draft or reviewing payroll runs can be recalculated')
  }

  const periodMonth = normalizePeriodMonth(run.period_start)
  const attendance = await loadAttendanceInputs(supabase, run.organization_id, periodMonth)

  if (!attendance.lock) {
    return { status: 'locked_required' as const }
  }

  const [adjustments, previousNetPayByEmployee] = await Promise.all([
    loadAdjustmentsForRun(supabase, run.id),
    loadPreviousNetPayByEmployee(supabase, run.organization_id, attendance.period.startDate),
  ])

  await replaceRunLines(
    supabase,
    run.id,
    attendance.lock.id,
    attendance.period,
    attendance.summaries,
    adjustments,
    previousNetPayByEmployee,
  )

  const db = supabase as any
  const updateResult = await db
    .from('payroll_runs')
    .update({
      attendance_month_lock_id: attendance.lock.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', run.id)

  if (updateResult.error) {
    throw updateResult.error
  }

  await supabase.from('audit_logs').insert({
    action: 'payroll_run_recalculated',
    actor_id: actorUserId,
    entity_id: run.id,
    entity_type: 'payroll_run',
    metadata: {
      line_count: attendance.summaries.length,
      period_end: attendance.period.endDate,
      period_start: attendance.period.startDate,
    },
    organization_id: run.organization_id,
  })

  const detail = await loadPayrollRun(supabase, run.id)

  return { data: detail ? toPayrollRunDetail(detail) : undefined, status: 'updated' as const }
}

export function createPayrollRunRepository(): PayrollRunRepository {
  return {
    async list(accessToken) {
      const supabase = accessToken ? createSupabaseUserClient(accessToken) : null

      if (!supabase) {
        return { data: getFallbackDashboard(), source: 'fixture' }
      }

      const db = supabase as any
      const [profileResult, rolesResult, runsResult] = await Promise.all([
        supabase.from('profiles').select('organization_id, organizations(id, name)').single(),
        supabase.from('user_roles').select('role').order('role'),
        db
          .from('payroll_runs')
          .select(
            `
              attendance_month_lock_id,
              approved_at,
              approved_by,
              created_at,
              created_by,
              finalized_by,
              finalized_at,
              id,
              period_end,
              period_start,
              status,
              submitted_at,
              submitted_by,
              updated_at,
              payroll_run_lines(
                calculation_snapshot,
                employee_id,
                gross_pay,
                id,
                net_pay,
                total_deductions,
                total_earnings,
                payslips(id, published_at),
                employees(employee_code, full_name)
              )
            `,
          )
          .order('period_start', { ascending: false })
          .limit(24),
      ])

      for (const result of [profileResult, rolesResult, runsResult]) {
        if (result.error) {
          throw result.error
        }
      }

      const profile = profileResult.data as ProfileRow | null
      const organization = firstRelation(profile?.organizations ?? null)

      return {
        data: {
          currentUserRoles: ((rolesResult.data ?? []) as RoleRow[]).map((row) => row.role),
          organization: organization ? { id: organization.id, name: organization.name } : null,
          runs: ((runsResult.data ?? []) as PayrollRunWithLinesRow[]).map(summarizeRun),
        },
        source: 'supabase',
      }
    },

    async getRun(accessToken, runId) {
      const supabase = accessToken ? createSupabaseUserClient(accessToken) : null

      if (!supabase) {
        return { data: null, source: 'fixture' }
      }

      const db = supabase as any
      const { data, error } = await db
        .from('payroll_runs')
        .select(
          `
            attendance_month_lock_id,
            approved_at,
            approved_by,
            created_at,
            created_by,
            finalized_by,
            finalized_at,
            id,
            period_end,
            period_start,
            status,
            submitted_at,
            submitted_by,
            updated_at,
            payroll_run_lines(
              calculation_snapshot,
              employee_id,
              gross_pay,
              id,
              net_pay,
              total_deductions,
              total_earnings,
              payslips(id, published_at),
              employees(employee_code, full_name)
            )
          `,
        )
        .eq('id', runId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return {
        data: data ? toPayrollRunDetail(data as PayrollRunWithLinesRow) : null,
        source: 'supabase',
      }
    },

    async createRun(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWritePayroll(actorUserId, input.organizationId))) {
        return { status: 'forbidden' }
      }

      const periodMonth = normalizePeriodMonth(input.periodMonth)
      const attendance = await loadAttendanceInputs(supabase, input.organizationId, periodMonth)

      if (!attendance.lock) {
        return { status: 'locked_required' }
      }

      const existingResult = await supabase
        .from('payroll_runs')
        .select(
          'id, organization_id, period_start, period_end, status, attendance_month_lock_id, created_at, created_by, submitted_at, submitted_by, approved_at, approved_by, finalized_at, finalized_by',
        )
        .eq('organization_id', input.organizationId)
        .eq('period_start', attendance.period.startDate)
        .eq('period_end', attendance.period.endDate)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const existing = existingResult.data as
        | (PayrollRunRow & { organization_id: string })
        | null

      if (existing) {
        const regenerated = await regenerateRun(supabase, existing, actorUserId)

        return regenerated.status === 'locked_required' ? regenerated : { ...regenerated, status: 'updated' }
      }

      const db = supabase as any
      const { data, error } = await db
        .from('payroll_runs')
        .insert({
          attendance_month_lock_id: attendance.lock.id,
          created_by: actorUserId,
          organization_id: input.organizationId,
          period_end: attendance.period.endDate,
          period_start: attendance.period.startDate,
          status: 'draft',
          submitted_at: null,
          submitted_by: null,
          approved_at: null,
          approved_by: null,
          finalized_at: null,
          finalized_by: null,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      const previousNetPayByEmployee = await loadPreviousNetPayByEmployee(
        supabase,
        input.organizationId,
        attendance.period.startDate,
      )

      await replaceRunLines(
        supabase,
        data.id,
        attendance.lock.id,
        attendance.period,
        attendance.summaries,
        [],
        previousNetPayByEmployee,
      )

      await supabase.from('audit_logs').insert({
        action: 'payroll_run_created',
        actor_id: actorUserId,
        entity_id: data.id,
        entity_type: 'payroll_run',
        metadata: {
          line_count: attendance.summaries.length,
          period_end: attendance.period.endDate,
          period_start: attendance.period.startDate,
        },
        organization_id: input.organizationId,
      })

      const detail = await loadPayrollRun(supabase, data.id)

      return { data: detail ? toPayrollRunDetail(detail) : undefined, status: 'created' }
    },

    async createAdjustment(runId, actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const run = await loadPayrollRunForWrite(supabase, runId)

      if (!run) {
        return { status: 'not_found' }
      }

      if (!(await canWritePayroll(actorUserId, run.organization_id))) {
        return { status: 'forbidden' }
      }

      if (run.status !== 'draft' && run.status !== 'reviewing') {
        throw new PayrollRunWriteError(409, 'Only draft or reviewing payroll runs can accept adjustments')
      }

      const db = supabase as any
      const employeeResult = await db
        .from('employees')
        .select('id')
        .eq('id', input.employeeId)
        .eq('organization_id', run.organization_id)
        .maybeSingle()

      if (employeeResult.error) {
        throw employeeResult.error
      }

      if (!employeeResult.data) {
        return { status: 'not_found' }
      }

      const normalized = normalizeAdjustmentInput(input)
      const insertResult = await db
        .from('payroll_adjustments')
        .insert({
          amount: normalized.amount,
          component_code: normalized.componentCode,
          component_name: normalized.componentName,
          component_type: normalized.componentType,
          created_by: actorUserId,
          employee_id: normalized.employeeId,
          notes: normalized.notes,
          organization_id: run.organization_id,
          payroll_run_id: run.id,
          tax_treatment: normalized.taxTreatment,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertResult.error) {
        throw insertResult.error
      }

      await supabase.from('audit_logs').insert({
        action: 'payroll_adjustment_created',
        actor_id: actorUserId,
        entity_id: insertResult.data.id,
        entity_type: 'payroll_adjustment',
        metadata: {
          amount: normalized.amount,
          component_code: normalized.componentCode,
          component_type: normalized.componentType,
          employee_id: normalized.employeeId,
          payroll_run_id: run.id,
          tax_treatment: normalized.taxTreatment,
        },
        organization_id: run.organization_id,
      })

      return regenerateRun(supabase, run, actorUserId)
    },

    async deleteAdjustment(runId, adjustmentId, actorUserId) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const run = await loadPayrollRunForWrite(supabase, runId)

      if (!run) {
        return { status: 'not_found' }
      }

      if (!(await canWritePayroll(actorUserId, run.organization_id))) {
        return { status: 'forbidden' }
      }

      if (run.status !== 'draft' && run.status !== 'reviewing') {
        throw new PayrollRunWriteError(409, 'Only draft or reviewing payroll runs can change adjustments')
      }

      const db = supabase as any
      const existingResult = await db
        .from('payroll_adjustments')
        .select('amount, component_code, component_type, employee_id, id, tax_treatment')
        .eq('id', adjustmentId)
        .eq('payroll_run_id', run.id)
        .eq('organization_id', run.organization_id)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      if (!existingResult.data) {
        return { status: 'not_found' }
      }

      const deleteResult = await db.from('payroll_adjustments').delete().eq('id', adjustmentId)

      if (deleteResult.error) {
        throw deleteResult.error
      }

      await supabase.from('audit_logs').insert({
        action: 'payroll_adjustment_deleted',
        actor_id: actorUserId,
        entity_id: adjustmentId,
        entity_type: 'payroll_adjustment',
        metadata: {
          amount: Number(existingResult.data.amount),
          component_code: existingResult.data.component_code,
          component_type: existingResult.data.component_type,
          employee_id: existingResult.data.employee_id,
          payroll_run_id: run.id,
          tax_treatment: existingResult.data.tax_treatment,
        },
        organization_id: run.organization_id,
      })

      return regenerateRun(supabase, run, actorUserId)
    },

    async recalculateRun(runId, actorUserId) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const run = await loadPayrollRunForWrite(supabase, runId)

      if (!run) {
        return { status: 'not_found' }
      }

      if (!(await canWritePayroll(actorUserId, run.organization_id))) {
        return { status: 'forbidden' }
      }

      return regenerateRun(supabase, run, actorUserId)
    },

    async submitRun(runId, actorUserId) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const run = await loadPayrollRunForWrite(supabase, runId)

      if (!run) {
        return { status: 'not_found' }
      }

      if (!(await canWritePayroll(actorUserId, run.organization_id))) {
        return { status: 'forbidden' }
      }

      if (run.status !== 'draft') {
        throw new PayrollRunWriteError(409, 'Only draft payroll runs can be submitted for review')
      }

      await ensureRunHasLines(supabase, run.id, 'submit')

      const now = new Date().toISOString()

      return updateRunStatus(
        supabase,
        run,
        actorUserId,
        {
          status: 'reviewing',
          submitted_at: now,
          submitted_by: actorUserId ?? null,
        },
        'payroll_run_submitted',
      )
    },

    async approveRun(runId, actorUserId) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const run = await loadPayrollRunForWrite(supabase, runId)

      if (!run) {
        return { status: 'not_found' }
      }

      if (!(await canApprovePayroll(actorUserId, run.organization_id))) {
        return { status: 'forbidden' }
      }

      if (run.status !== 'reviewing') {
        throw new PayrollRunWriteError(409, 'Only reviewing payroll runs can be approved')
      }

      ensureDifferentPayrollChecker(run, actorUserId, 'approve')
      await ensureRunHasLines(supabase, run.id, 'approve')

      const now = new Date().toISOString()

      return updateRunStatus(
        supabase,
        run,
        actorUserId,
        {
          approved_at: now,
          approved_by: actorUserId ?? null,
          status: 'approved',
        },
        'payroll_run_approved',
      )
    },

    async finalizeRun(runId, actorUserId) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const run = await loadPayrollRunForWrite(supabase, runId)

      if (!run) {
        return { status: 'not_found' }
      }

      if (!(await canApprovePayroll(actorUserId, run.organization_id))) {
        return { status: 'forbidden' }
      }

      if (run.status !== 'approved') {
        throw new PayrollRunWriteError(409, 'Only approved payroll runs can be finalized')
      }

      ensureDifferentPayrollChecker(run, actorUserId, 'finalize')
      await ensureRunHasLines(supabase, run.id, 'finalize')

      const now = new Date().toISOString()

      return updateRunStatus(
        supabase,
        run,
        actorUserId,
        {
          finalized_at: now,
          finalized_by: actorUserId ?? null,
          status: 'finalized',
        },
        'payroll_run_finalized',
      )
    },
  }
}
