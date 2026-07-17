import { z } from 'zod'
import { calculatePayrollPreview, type PayrollPreview } from '../payroll/calculate-payroll.js'
import { createSupabaseUserClient, getSupabaseServiceClient } from '../../lib/supabase.js'
import { postgresUuidSchema } from '../../lib/validation.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'
import { employees as fixtureEmployees, type AppRole } from '../employees/sample-data.js'

type DataSource = 'fixture' | 'supabase'

type Result<T> = {
  data: T
  source: DataSource
}

type WriteStatus = 'created' | 'deleted' | 'forbidden' | 'locked' | 'not_configured' | 'not_found' | 'updated'

const attendanceStatuses = [
  'present',
  'absent',
  'half_day',
  'paid_leave',
  'unpaid_leave',
  'holiday',
  'weekly_off',
] as const

export type AttendanceStatus = (typeof attendanceStatuses)[number]

export type AttendanceEmployee = {
  annualCompensation: number
  code: string
  fullName: string
  id: string
  organizationId: string
}

export type AttendanceEntry = {
  attendanceStatus: AttendanceStatus
  employeeCode: string
  employeeId: string
  employeeName: string
  id: string
  notes: string | null
  overtimeHours: number
  payableHours: number
  workDate: string
}

export type Holiday = {
  holidayDate: string
  id: string
  name: string
  region: string
}

export type AttendanceMonthLock = {
  id: string
  lockedAt: string
  lockedBy: string | null
  notes: string | null
  periodMonth: string
}

export type AttendanceSummary = {
  absentDays: number
  approvedLeaveDays: number
  calendarDays: number
  employeeCode: string
  employeeId: string
  employeeName: string
  grossMonthly: number
  halfDays: number
  holidays: number
  lossOfPayDays: number
  overtimeHours: number
  paidLeaveDays: number
  payableDays: number
  payrollPreview: PayrollPreview
  presentDays: number
  unpaidLeaveDays: number
  weeklyOffDays: number
}

export type AttendanceDashboard = {
  currentUserRoles: AppRole[]
  employees: AttendanceEmployee[]
  entries: AttendanceEntry[]
  holidays: Holiday[]
  locks: AttendanceMonthLock[]
  organization: {
    id: string
    name: string
  } | null
  period: {
    endDate: string
    month: string
    startDate: string
  }
  summaries: AttendanceSummary[]
}

export const attendancePeriodQuerySchema = z.object({
  periodMonth: z.iso.date().optional(),
})

export const attendanceEntryUpsertSchema = z.object({
  attendanceStatus: z.enum(attendanceStatuses).default('present'),
  employeeId: postgresUuidSchema,
  notes: z.string().trim().max(500).optional(),
  organizationId: postgresUuidSchema,
  overtimeHours: z.coerce.number().min(0).max(24).default(0),
  payableHours: z.coerce.number().min(0).max(24).optional(),
  workDate: z.iso.date(),
})

export const holidayCreateSchema = z.object({
  holidayDate: z.iso.date(),
  name: z.string().trim().min(2).max(120),
  organizationId: postgresUuidSchema,
  region: z.string().trim().min(2).max(24).default('GLOBAL'),
})

export const attendanceMonthLockSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  organizationId: postgresUuidSchema,
  periodMonth: z.iso.date(),
})

export type AttendanceEntryUpsertInput = z.infer<typeof attendanceEntryUpsertSchema>
export type HolidayCreateInput = z.infer<typeof holidayCreateSchema>
export type AttendanceMonthLockInput = z.infer<typeof attendanceMonthLockSchema>

export class AttendanceWriteError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

type ProfileRow = {
  id: string
  organization_id: string | null
  organizations: { id: string; name: string } | { id: string; name: string }[] | null
}

type RoleRow = {
  role: AppRole
}

type EmployeeRow = {
  annual_compensation: number
  employee_code: string
  full_name: string
  id: string
  manager_profile_id: string | null
  organization_id: string
  profile_id: string | null
}

type AttendanceEntryRow = {
  attendance_status: AttendanceStatus
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

type AttendanceMonthLockRow = {
  id: string
  locked_at: string
  locked_by: string | null
  notes: string | null
  period_month: string
}

export type ApprovedLeaveRow = {
  employee_id: string
  end_date: string
  leave_type: string
  start_date: string
}

type ServiceClient = NonNullable<ReturnType<typeof getSupabaseServiceClient>>

export type AttendanceRepository = {
  createHoliday: (
    actorUserId: string | undefined,
    input: HolidayCreateInput,
  ) => Promise<{ data?: Holiday; status: WriteStatus }>
  list: (accessToken?: string, periodMonth?: string) => Promise<Result<AttendanceDashboard>>
  lockMonth: (
    actorUserId: string | undefined,
    input: AttendanceMonthLockInput,
  ) => Promise<{ data?: AttendanceMonthLock; status: WriteStatus }>
  unlockMonth: (
    actorUserId: string | undefined,
    input: AttendanceMonthLockInput,
  ) => Promise<{ data?: AttendanceMonthLock; status: WriteStatus }>
  upsertAttendanceEntry: (
    actorUserId: string | undefined,
    input: AttendanceEntryUpsertInput,
  ) => Promise<{ data?: AttendanceEntry; status: WriteStatus }>
}

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getDefaultPeriodMonth() {
  const now = new Date()

  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`
}

export function normalizePeriodMonth(periodMonth?: string) {
  const source = periodMonth ?? getDefaultPeriodMonth()
  const parsed = new Date(`${source}T00:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    throw new AttendanceWriteError(400, 'Invalid attendance period month')
  }

  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-01`
}

export function getMonthBounds(periodMonth?: string) {
  const month = normalizePeriodMonth(periodMonth)
  const start = new Date(`${month}T00:00:00.000Z`)
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))

  return {
    endDate: toDateInputValue(end),
    month,
    startDate: month,
  }
}

function getDateKey(date: Date) {
  return toDateInputValue(date)
}

function getDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return []
  }

  const dates: string[] = []

  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(getDateKey(cursor))
  }

  return dates
}

function getOverlapDateRange(startDate: string, endDate: string, periodStart: string, periodEnd: string) {
  const start = startDate > periodStart ? startDate : periodStart
  const end = endDate < periodEnd ? endDate : periodEnd

  return getDateRange(start, end)
}

function getCalendarDays(startDate: string, endDate: string) {
  return getDateRange(startDate, endDate).length
}

function getDefaultPayableHours(status: AttendanceStatus) {
  if (status === 'half_day') {
    return 4
  }

  if (status === 'absent' || status === 'unpaid_leave') {
    return 0
  }

  return 8
}

function hoursToDays(hours: number) {
  return Math.round((hours / 8) * 100) / 100
}

function roundDay(value: number) {
  return Math.round(value * 100) / 100
}

function toAttendanceEmployee(row: EmployeeRow): AttendanceEmployee {
  return {
    annualCompensation: row.annual_compensation,
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

function toAttendanceMonthLock(row: AttendanceMonthLockRow): AttendanceMonthLock {
  return {
    id: row.id,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by,
    notes: row.notes,
    periodMonth: row.period_month,
  }
}

export function buildAttendanceSummaries(
  employees: AttendanceEmployee[],
  entries: AttendanceEntry[],
  holidays: Holiday[],
  approvedLeaves: ApprovedLeaveRow[],
  period: AttendanceDashboard['period'],
) {
  const calendarDays = getCalendarDays(period.startDate, period.endDate)
  const holidayDates = new Set(holidays.map((holiday) => holiday.holidayDate))
  const entriesByEmployee = new Map<string, Map<string, AttendanceEntry>>()
  const leaveDatesByEmployee = new Map<string, Map<string, 'paid' | 'unpaid'>>()

  for (const entry of entries) {
    const employeeEntries = entriesByEmployee.get(entry.employeeId) ?? new Map<string, AttendanceEntry>()
    employeeEntries.set(entry.workDate, entry)
    entriesByEmployee.set(entry.employeeId, employeeEntries)
  }

  for (const leave of approvedLeaves) {
    const employeeLeaves = leaveDatesByEmployee.get(leave.employee_id) ?? new Map<string, 'paid' | 'unpaid'>()
    const leaveMode = leave.leave_type === 'unpaid' ? 'unpaid' : 'paid'

    for (const date of getOverlapDateRange(leave.start_date, leave.end_date, period.startDate, period.endDate)) {
      if (!employeeLeaves.has(date)) {
        employeeLeaves.set(date, leaveMode)
      }
    }

    leaveDatesByEmployee.set(leave.employee_id, employeeLeaves)
  }

  return employees.map((employee) => {
    const employeeEntries = entriesByEmployee.get(employee.id) ?? new Map<string, AttendanceEntry>()
    const employeeLeaves = leaveDatesByEmployee.get(employee.id) ?? new Map<string, 'paid' | 'unpaid'>()
    const summary = {
      absentDays: 0,
      approvedLeaveDays: 0,
      halfDays: 0,
      holidays: 0,
      lossOfPayDays: 0,
      overtimeHours: 0,
      paidLeaveDays: 0,
      payableDays: 0,
      presentDays: 0,
      unpaidLeaveDays: 0,
      weeklyOffDays: 0,
    }

    for (const date of getDateRange(period.startDate, period.endDate)) {
      const entry = employeeEntries.get(date)
      const approvedLeaveMode = employeeLeaves.get(date)
      const isHoliday = holidayDates.has(date)

      if (entry) {
        const payableDay = hoursToDays(entry.payableHours)
        summary.overtimeHours += entry.overtimeHours

        if (entry.attendanceStatus === 'present') {
          summary.presentDays += 1
          summary.payableDays += payableDay
        } else if (entry.attendanceStatus === 'half_day') {
          summary.halfDays += 1
          summary.presentDays += 0.5
          summary.payableDays += payableDay
          summary.lossOfPayDays += Math.max(0, 1 - payableDay)
        } else if (entry.attendanceStatus === 'paid_leave') {
          summary.paidLeaveDays += 1
          summary.approvedLeaveDays += 1
          summary.payableDays += payableDay
        } else if (entry.attendanceStatus === 'unpaid_leave') {
          summary.unpaidLeaveDays += 1
          summary.approvedLeaveDays += 1
          summary.lossOfPayDays += 1
        } else if (entry.attendanceStatus === 'absent') {
          summary.absentDays += 1
          summary.lossOfPayDays += 1
        } else if (entry.attendanceStatus === 'holiday') {
          summary.holidays += 1
          summary.payableDays += payableDay
        } else if (entry.attendanceStatus === 'weekly_off') {
          summary.weeklyOffDays += 1
          summary.payableDays += payableDay
        }

        continue
      }

      if (approvedLeaveMode === 'paid') {
        summary.paidLeaveDays += 1
        summary.approvedLeaveDays += 1
        summary.payableDays += 1
        continue
      }

      if (approvedLeaveMode === 'unpaid') {
        summary.unpaidLeaveDays += 1
        summary.approvedLeaveDays += 1
        summary.lossOfPayDays += 1
        continue
      }

      if (isHoliday) {
        summary.holidays += 1
        summary.payableDays += 1
      }
    }

    const payrollPreview = calculatePayrollPreview({
      annualCompensation: employee.annualCompensation,
      bonusAmount: 0,
      employeeId: employee.id,
      overtimeAmount: 0,
      payableDays: calendarDays,
      reimbursementAmount: 0,
      unpaidLeaveDays: roundDay(summary.lossOfPayDays),
    })

    return {
      absentDays: roundDay(summary.absentDays),
      approvedLeaveDays: roundDay(summary.approvedLeaveDays),
      calendarDays,
      employeeCode: employee.code,
      employeeId: employee.id,
      employeeName: employee.fullName,
      grossMonthly: payrollPreview.grossMonthly,
      halfDays: roundDay(summary.halfDays),
      holidays: roundDay(summary.holidays),
      lossOfPayDays: roundDay(summary.lossOfPayDays),
      overtimeHours: roundDay(summary.overtimeHours),
      paidLeaveDays: roundDay(summary.paidLeaveDays),
      payableDays: roundDay(summary.payableDays),
      payrollPreview,
      presentDays: roundDay(summary.presentDays),
      unpaidLeaveDays: roundDay(summary.unpaidLeaveDays),
      weeklyOffDays: roundDay(summary.weeklyOffDays),
    }
  })
}

function getFallbackDashboard(periodMonth?: string): AttendanceDashboard {
  const period = getMonthBounds(periodMonth)
  const attendanceEmployees = fixtureEmployees.map((employee) => ({
    annualCompensation: employee.annualCompensation,
    code: employee.code,
    fullName: employee.fullName,
    id: employee.id,
    organizationId: '00000000-0000-0000-0000-000000000001',
  }))
  const holidays = [
    {
      holidayDate: '2026-09-18',
      id: 'holiday_company_day',
      name: 'Company day',
      region: 'GLOBAL',
    },
  ].filter((holiday) => holiday.holidayDate >= period.startDate && holiday.holidayDate <= period.endDate)

  return {
    currentUserRoles: ['owner'],
    employees: attendanceEmployees,
    entries: [],
    holidays,
    locks: [],
    organization: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'VetanFlow Labs',
    },
    period,
    summaries: buildAttendanceSummaries(attendanceEmployees, [], holidays, [], period),
  }
}

async function canWrite(actorUserId: string | undefined, organizationId: string, allowedRoles: AppRole[]) {
  if (!actorUserId) {
    return false
  }

  const actorRoles = await getUserRoles(actorUserId, organizationId)

  return hasAnyRole(actorRoles, allowedRoles)
}

async function assertMonthIsOpen(supabase: ServiceClient, organizationId: string, dateInMonth: string) {
  const periodMonth = normalizePeriodMonth(dateInMonth)
  const db = supabase as any
  const { data, error } = await db
    .from('attendance_month_locks')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('period_month', periodMonth)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return false
  }

  return true
}

async function getEmployee(supabase: ServiceClient, employeeId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id, organization_id, employee_code, full_name, annual_compensation')
    .eq('id', employeeId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as EmployeeRow | null
}

export function createAttendanceRepository(): AttendanceRepository {
  return {
    async list(accessToken, periodMonth) {
      const period = getMonthBounds(periodMonth)
      const supabase = accessToken ? createSupabaseUserClient(accessToken) : null

      if (!supabase) {
        return { data: getFallbackDashboard(period.month), source: 'fixture' }
      }

      const profileResult = await supabase
        .from('profiles')
        .select('id, organization_id, organizations(id, name)')
        .single()

      if (profileResult.error) {
        throw profileResult.error
      }

      const earlyProfile = profileResult.data as ProfileRow | null

      const rolesResult = await supabase
        .from('user_roles')
        .select('role')
        .eq('organization_id', earlyProfile?.organization_id ?? '')
        .order('role')

      if (rolesResult.error) {
        throw rolesResult.error
      }

      const profile = profileResult.data as ProfileRow | null
      const organization = firstRelation(profile?.organizations ?? null)
      const currentUserRoles = ((rolesResult.data ?? []) as RoleRow[]).map((row) => row.role)
      const canViewCompensation = hasAnyRole(currentUserRoles, ['owner', 'admin', 'hr', 'finance'])
      const serviceClient = getSupabaseServiceClient()

      if (!profile?.organization_id || !serviceClient) {
        throw new Error('Supabase service role is required to load protected attendance data')
      }

      const db = supabase as any

      const [employeesResult, entriesResult, holidaysResult, locksResult, leavesResult] = await Promise.all([
        serviceClient
          .from('employees')
          .select('id, organization_id, employee_code, full_name, annual_compensation, profile_id, manager_profile_id')
          .eq('organization_id', profile.organization_id)
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
          .gte('work_date', period.startDate)
          .lte('work_date', period.endDate)
          .order('work_date', { ascending: true }),
        supabase
          .from('holidays')
          .select('holiday_date, id, name, region')
          .gte('holiday_date', period.startDate)
          .lte('holiday_date', period.endDate)
          .order('holiday_date', { ascending: true }),
        db
          .from('attendance_month_locks')
          .select('id, locked_at, locked_by, notes, period_month')
          .eq('period_month', period.month),
        supabase
          .from('leave_requests')
          .select('employee_id, end_date, leave_type, start_date')
          .eq('status', 'approved')
          .lte('start_date', period.endDate)
          .gte('end_date', period.startDate),
      ])

      for (const result of [employeesResult, entriesResult, holidaysResult, locksResult, leavesResult]) {
        if (result.error) {
          throw result.error
        }
      }

      const attendanceEmployees = ((employeesResult.data ?? []) as EmployeeRow[])
        .filter(
          (employee) =>
            canViewCompensation ||
            employee.profile_id === profile.id ||
            employee.manager_profile_id === profile.id,
        )
        .map(toAttendanceEmployee)
      const visibleAttendanceEmployees = canViewCompensation
        ? attendanceEmployees
        : attendanceEmployees.map((employee) => ({ ...employee, annualCompensation: 0 }))
      const entries = ((entriesResult.data ?? []) as AttendanceEntryRow[]).map(toAttendanceEntry)
      const holidays = ((holidaysResult.data ?? []) as HolidayRow[]).map(toHoliday)
      const locks = ((locksResult.data ?? []) as AttendanceMonthLockRow[]).map(toAttendanceMonthLock)
      const approvedLeaves = (leavesResult.data ?? []) as ApprovedLeaveRow[]

      return {
        data: {
          currentUserRoles,
          employees: visibleAttendanceEmployees,
          entries,
          holidays,
          locks,
          organization: organization
            ? {
                id: organization.id,
                name: organization.name,
              }
            : null,
          period,
          summaries: buildAttendanceSummaries(visibleAttendanceEmployees, entries, holidays, approvedLeaves, period),
        },
        source: 'supabase',
      }
    },

    async upsertAttendanceEntry(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWrite(actorUserId, input.organizationId, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const employee = await getEmployee(supabase, input.employeeId)

      if (!employee) {
        return { status: 'not_found' }
      }

      if (employee.organization_id !== input.organizationId) {
        return { status: 'forbidden' }
      }

      if (!(await assertMonthIsOpen(supabase, input.organizationId, input.workDate))) {
        return { status: 'locked' }
      }

      const db = supabase as any
      const existingResult = await supabase
        .from('attendance_entries')
        .select('id')
        .eq('employee_id', input.employeeId)
        .eq('work_date', input.workDate)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const payableHours = input.payableHours ?? getDefaultPayableHours(input.attendanceStatus)
      const { data, error } = await db
        .from('attendance_entries')
        .upsert(
          {
            attendance_status: input.attendanceStatus,
            employee_id: input.employeeId,
            notes: input.notes?.trim() || null,
            organization_id: input.organizationId,
            overtime_hours: input.overtimeHours,
            payable_hours: payableHours,
            recorded_by: actorUserId,
            updated_at: new Date().toISOString(),
            work_date: input.workDate,
          },
          { onConflict: 'employee_id,work_date' },
        )
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
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: existingResult.data ? 'attendance_entry_updated' : 'attendance_entry_created',
        actor_id: actorUserId,
        entity_id: data.id,
        entity_type: 'attendance_entry',
        metadata: {
          attendance_status: input.attendanceStatus,
          employee_code: employee.employee_code,
          payable_hours: payableHours,
          work_date: input.workDate,
        },
        organization_id: input.organizationId,
      })

      return {
        data: toAttendanceEntry(data as AttendanceEntryRow),
        status: existingResult.data ? 'updated' : 'created',
      }
    },

    async createHoliday(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWrite(actorUserId, input.organizationId, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      if (!(await assertMonthIsOpen(supabase, input.organizationId, input.holidayDate))) {
        return { status: 'locked' }
      }

      const db = supabase as any
      const existingResult = await supabase
        .from('holidays')
        .select('id')
        .eq('organization_id', input.organizationId)
        .eq('holiday_date', input.holidayDate)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      const { data, error } = await supabase
        .from('holidays')
        .upsert(
          {
            holiday_date: input.holidayDate,
            name: input.name.trim(),
            organization_id: input.organizationId,
            region: input.region.trim().toUpperCase(),
          },
          { onConflict: 'organization_id,holiday_date' },
        )
        .select('holiday_date, id, name, region')
        .single()

      if (error) {
        throw error
      }

      await db.from('audit_logs').insert({
        action: existingResult.data ? 'holiday_updated' : 'holiday_created',
        actor_id: actorUserId,
        entity_id: data.id,
        entity_type: 'holiday',
        metadata: {
          holiday_date: input.holidayDate,
          name: input.name.trim(),
          region: input.region.trim().toUpperCase(),
        },
        organization_id: input.organizationId,
      })

      return {
        data: toHoliday(data as HolidayRow),
        status: existingResult.data ? 'updated' : 'created',
      }
    },

    async lockMonth(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWrite(actorUserId, input.organizationId, ['owner', 'admin', 'hr']))) {
        return { status: 'forbidden' }
      }

      const periodMonth = normalizePeriodMonth(input.periodMonth)
      const db = supabase as any
      const existingResult = await db
        .from('attendance_month_locks')
        .select('id, locked_at, locked_by, notes, period_month')
        .eq('organization_id', input.organizationId)
        .eq('period_month', periodMonth)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      if (existingResult.data) {
        return { data: toAttendanceMonthLock(existingResult.data as AttendanceMonthLockRow), status: 'updated' }
      }

      const { data, error } = await db
        .from('attendance_month_locks')
        .insert({
          locked_by: actorUserId,
          notes: input.notes?.trim() || null,
          organization_id: input.organizationId,
          period_month: periodMonth,
        })
        .select('id, locked_at, locked_by, notes, period_month')
        .single()

      if (error) {
        throw error
      }

      await supabase.from('audit_logs').insert({
        action: 'attendance_month_locked',
        actor_id: actorUserId,
        entity_id: data.id,
        entity_type: 'attendance_month_lock',
        metadata: { period_month: periodMonth },
        organization_id: input.organizationId,
      })

      return { data: toAttendanceMonthLock(data as AttendanceMonthLockRow), status: 'created' }
    },

    async unlockMonth(actorUserId, input) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      if (!(await canWrite(actorUserId, input.organizationId, ['owner', 'admin']))) {
        return { status: 'forbidden' }
      }

      const periodMonth = normalizePeriodMonth(input.periodMonth)
      const db = supabase as any
      const existingResult = await db
        .from('attendance_month_locks')
        .select('id, locked_at, locked_by, notes, period_month')
        .eq('organization_id', input.organizationId)
        .eq('period_month', periodMonth)
        .maybeSingle()

      if (existingResult.error) {
        throw existingResult.error
      }

      if (!existingResult.data) {
        return { status: 'not_found' }
      }

      const deleteResult = await db
        .from('attendance_month_locks')
        .delete()
        .eq('organization_id', input.organizationId)
        .eq('period_month', periodMonth)

      if (deleteResult.error) {
        throw deleteResult.error
      }

      await supabase.from('audit_logs').insert({
        action: 'attendance_month_unlocked',
        actor_id: actorUserId,
        entity_id: existingResult.data.id,
        entity_type: 'attendance_month_lock',
        metadata: {
          period_month: periodMonth,
          reason: input.notes?.trim() || null,
        },
        organization_id: input.organizationId,
      })

      return { data: toAttendanceMonthLock(existingResult.data as AttendanceMonthLockRow), status: 'deleted' }
    },
  }
}
