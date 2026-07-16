import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function loadEnvFile(path: string) {
  if (!existsSync(path)) {
    return
  }

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '')
    process.env[key.trim()] ??= value
  }
}

function normalizePeriodMonth(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid DEMO_PERIOD_MONTH: ${value}`)
  }

  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function getMonthBounds(month: string) {
  const start = new Date(`${month}T00:00:00.000Z`)
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))

  return {
    calendarDays: end.getUTCDate(),
    endDate: end.toISOString().slice(0, 10),
    month,
    startDate: month,
  }
}

function hasValue(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : value != null
}

function firstRow<T>(rows: T[], label: string) {
  const row = rows[0]

  if (!row) {
    throw new Error(`${label} not found`)
  }

  return row
}

async function query<T>(label: string, request: PromiseLike<{ data: T; error: unknown }>) {
  const { data, error } = await request

  if (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error)
    throw new Error(`${label}: ${message}`)
  }

  return data
}

loadEnvFile(join(root, 'backend/.env'))

const { calculatePayrollPreview } = await import('../backend/src/modules/payroll/calculate-payroll.js')
const { createPayslipRepository } = await import('../backend/src/modules/payroll/payslip-service.js')
const { getSupabaseServiceClient } = await import('../backend/src/lib/supabase.js')

const supabase = getSupabaseServiceClient()

if (!supabase) {
  throw new Error('Supabase service client is not configured. Check backend/.env.')
}

const db = supabase as any
const period = getMonthBounds(normalizePeriodMonth(process.env.DEMO_PERIOD_MONTH ?? '2026-09-01'))

const buckets = await query('storage buckets', supabase.storage.listBuckets())
const bucketIds = new Set((buckets ?? []).map((bucket) => bucket.id))

for (const bucketId of ['employee-photos', 'payslips']) {
  if (!bucketIds.has(bucketId)) {
    await query(`create ${bucketId} bucket`, supabase.storage.createBucket(bucketId, { public: false }))
  }
}

const organizations = await query(
  'organizations',
  supabase.from('organizations').select('id,name').order('created_at', { ascending: true }),
)
const organization = firstRow(organizations ?? [], 'Organization')
const organizationId = process.env.DEMO_ORGANIZATION_ID ?? organization.id

const roles = await query(
  'user_roles',
  supabase.from('user_roles').select('role,user_id,organization_id').eq('organization_id', organizationId),
)
const makerRole = firstRow(
  (roles ?? []).filter((role) => ['owner', 'admin', 'hr'].includes(role.role)),
  'Owner/admin/HR role',
)
const checkerRole =
  (roles ?? []).find(
    (role) => ['owner', 'admin', 'finance'].includes(role.role) && role.user_id !== makerRole.user_id,
  ) ??
  firstRow(
    (roles ?? []).filter((role) => ['owner', 'admin', 'finance'].includes(role.role)),
    'Owner/admin/finance checker role',
  )

const employees = await query(
  'employees',
  supabase
    .from('employees')
    .select(
      'id,annual_ctc,bank_account_holder_name,bank_account_number,bank_ifsc,bank_name,department_id,designation,employee_code,full_name,organization_id,status,work_email',
    )
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('employee_code', { ascending: true }),
)

if (!employees?.length) {
  throw new Error('No active employees found for demo preparation')
}

let bankUpdates = 0

for (const [index, employee] of employees.entries()) {
  const isBankReady =
    hasValue(employee.bank_account_holder_name) &&
    hasValue(employee.bank_account_number) &&
    hasValue(employee.bank_ifsc) &&
    hasValue(employee.bank_name)

  if (isBankReady) {
    continue
  }

  const updateResult = await supabase
    .from('employees')
    .update({
      bank_account_holder_name: employee.bank_account_holder_name ?? employee.full_name,
      bank_account_number: employee.bank_account_number ?? `9000000000${String(index + 1).padStart(4, '0')}`,
      bank_ifsc: employee.bank_ifsc ?? `HDFC0${String(1000 + index).padStart(6, '0')}`,
      bank_name: employee.bank_name ?? 'HDFC Demo Bank',
    })
    .eq('id', employee.id)

  if (updateResult.error) {
    throw updateResult.error
  }

  bankUpdates += 1
}

const existingLockBeforeAttendance = await db
  .from('attendance_month_locks')
  .select('id')
  .eq('organization_id', organizationId)
  .eq('period_month', period.month)
  .maybeSingle()

if (existingLockBeforeAttendance.error) {
  throw existingLockBeforeAttendance.error
}

let attendanceEntriesCreated = 0

if (!existingLockBeforeAttendance.data) {
  const demoDates = [
    period.startDate,
    new Date(Date.UTC(new Date(`${period.startDate}T00:00:00.000Z`).getUTCFullYear(), new Date(`${period.startDate}T00:00:00.000Z`).getUTCMonth(), 2))
      .toISOString()
      .slice(0, 10),
    new Date(Date.UTC(new Date(`${period.startDate}T00:00:00.000Z`).getUTCFullYear(), new Date(`${period.startDate}T00:00:00.000Z`).getUTCMonth(), 3))
      .toISOString()
      .slice(0, 10),
  ]
  const attendanceRows = employees.flatMap((employee, employeeIndex) =>
    demoDates.map((workDate, dateIndex) => {
      const isHalfDay = employeeIndex === 0 && dateIndex === 1
      const hasOvertime = employeeIndex === 2 && dateIndex === 2

      return {
        attendance_status: isHalfDay ? 'half_day' : 'present',
        employee_id: employee.id,
        notes: 'Prepared by demo readiness script',
        organization_id: organizationId,
        overtime_hours: hasOvertime ? 2 : 0,
        payable_hours: isHalfDay ? 4 : 8,
        recorded_by: makerRole.user_id,
        updated_at: new Date().toISOString(),
        work_date: workDate,
      }
    }),
  )

  await query(
    'attendance_entries upsert',
    db.from('attendance_entries').upsert(attendanceRows, { onConflict: 'employee_id,work_date' }),
  )
  attendanceEntriesCreated = attendanceRows.length
}

const attendanceLockResult = await db
  .from('attendance_month_locks')
  .select('id')
  .eq('organization_id', organizationId)
  .eq('period_month', period.month)
  .maybeSingle()

if (attendanceLockResult.error) {
  throw attendanceLockResult.error
}

let attendanceLockId = attendanceLockResult.data?.id as string | undefined
let lockCreated = false

if (!attendanceLockId) {
  const createdLock = await query(
    'attendance_month_locks insert',
    db
      .from('attendance_month_locks')
      .insert({
        locked_by: makerRole.user_id,
        notes: 'Prepared by demo readiness script',
        organization_id: organizationId,
        period_month: period.month,
      })
      .select('id')
      .single(),
  )

  attendanceLockId = createdLock.id
  lockCreated = true

  await query(
    'attendance lock audit',
    supabase.from('audit_logs').insert({
      action: 'attendance_month_locked',
      actor_id: makerRole.user_id,
      entity_id: attendanceLockId,
      entity_type: 'attendance_month_lock',
      metadata: { period_month: period.month, source: 'demo_prepare' },
      organization_id: organizationId,
    }),
  )
}

const existingRun = await query(
  'payroll_runs lookup',
  db
    .from('payroll_runs')
    .select('id,status')
    .eq('organization_id', organizationId)
    .eq('period_start', period.startDate)
    .eq('period_end', period.endDate)
    .maybeSingle(),
)

let runId = existingRun?.id as string | undefined
let runCreated = false
let linesCreated = 0

if (!runId) {
  const createdRun = await query(
    'payroll_runs insert',
    db
      .from('payroll_runs')
      .insert({
        approved_at: null,
        approved_by: null,
        attendance_month_lock_id: attendanceLockId,
        created_by: makerRole.user_id,
        finalized_at: null,
        finalized_by: null,
        organization_id: organizationId,
        period_end: period.endDate,
        period_start: period.startDate,
        status: 'draft',
        submitted_at: null,
        submitted_by: null,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single(),
  )

  runId = createdRun.id
  runCreated = true
} else if (existingRun.status !== 'finalized') {
  const deleteLines = await supabase.from('payroll_run_lines').delete().eq('payroll_run_id', runId)

  if (deleteLines.error) {
    throw deleteLines.error
  }
}

const existingLines = await query(
  'payroll_run_lines lookup',
  supabase.from('payroll_run_lines').select('id').eq('payroll_run_id', runId),
)

if (!existingLines?.length) {
  if (existingRun?.status === 'finalized') {
    throw new Error('Demo run is finalized but has no lines. Create a new DEMO_PERIOD_MONTH or repair manually.')
  }

  const lineInserts = employees.map((employee, index) => {
    const lossOfPayDays = index === 0 ? 0.5 : 0
    const reimbursementAmount = index === 1 ? 1500 : 0
    const overtimeAmount = index === 2 ? 1200 : 0
    const payroll = calculatePayrollPreview({
      annualCtc: Number(employee.annual_ctc),
      employeeId: employee.id,
      overtimeAmount,
      payableDays: period.calendarDays,
      reimbursementAmount,
      unpaidLeaveDays: lossOfPayDays,
    })
    const snapshot = {
      adjustments: {
        items: [],
        netImpact: reimbursementAmount,
        totals: {
          deductions: 0,
          preTaxDeductions: 0,
          postTaxDeductions: 0,
          reimbursements: reimbursementAmount,
          taxableEarnings: 0,
        },
      },
      attendance: {
        absentDays: 0,
        approvedLeaveDays: 0,
        calendarDays: period.calendarDays,
        halfDays: lossOfPayDays ? 1 : 0,
        holidays: 0,
        lossOfPayDays,
        paidLeaveDays: 0,
        payableDays: period.calendarDays - lossOfPayDays,
        presentDays: period.calendarDays - lossOfPayDays,
        unpaidLeaveDays: 0,
        weeklyOffDays: 0,
      },
      employee: {
        code: employee.employee_code,
        id: employee.id,
        name: employee.full_name,
      },
      overtime: {
        amount: overtimeAmount,
        hours: overtimeAmount ? 4 : 0,
        multiplier: 1.5,
      },
      payroll,
      period: {
        endDate: period.endDate,
        month: period.month,
        startDate: period.startDate,
      },
      source: {
        attendanceMonthLockId: attendanceLockId,
        version: 'demo_prepare_v1',
      },
      variance: {
        netPayDelta: null,
        netPayDeltaPercent: null,
        previousNetPay: null,
      },
      varianceWarnings: [],
    }

    return {
      calculation_snapshot: snapshot,
      employee_id: employee.id,
      gross_pay: payroll.grossMonthly,
      net_pay: payroll.netPay,
      payroll_run_id: runId,
      total_deductions: payroll.totalDeductions,
      total_earnings: payroll.totalEarnings,
      updated_at: new Date().toISOString(),
    }
  })

  await query('payroll_run_lines insert', db.from('payroll_run_lines').insert(lineInserts))
  linesCreated = lineInserts.length

  if (existingRun?.status !== 'finalized') {
    const now = new Date().toISOString()
    await query(
      'payroll_runs finalize',
      db
        .from('payroll_runs')
        .update({
          approved_at: now,
          approved_by: checkerRole.user_id,
          attendance_month_lock_id: attendanceLockId,
          finalized_at: now,
          finalized_by: checkerRole.user_id,
          status: 'finalized',
          submitted_at: now,
          submitted_by: makerRole.user_id,
          updated_at: now,
        })
        .eq('id', runId),
    )
  }
}

await query(
  'payroll run audit',
  supabase.from('audit_logs').insert({
    action: runCreated ? 'payroll_run_created' : 'payroll_run_demo_prepared',
    actor_id: makerRole.user_id,
    entity_id: runId,
    entity_type: 'payroll_run',
    metadata: {
      line_count: linesCreated || existingLines?.length || 0,
      period_end: period.endDate,
      period_start: period.startDate,
      source: 'demo_prepare',
    },
    organization_id: organizationId,
  }),
)

const payslipRepository = createPayslipRepository()
const payslipResult = await payslipRepository.createForRun(runId, makerRole.user_id)

if (!payslipResult.data || payslipResult.status === 'forbidden' || payslipResult.status === 'not_found') {
  throw new Error(`Payslip generation failed with status ${payslipResult.status}`)
}

console.log('VetanFlow demo data prepared')
console.log(`Organization: ${organization.name}`)
console.log(`Period: ${period.startDate} to ${period.endDate}`)
console.log(`Attendance lock: ${lockCreated ? 'created' : 'already present'}`)
console.log(`Attendance entries prepared: ${attendanceEntriesCreated}`)
console.log(`Bank detail updates: ${bankUpdates}`)
console.log(`Payroll run: ${runCreated ? 'created' : 'already present'}`)
console.log(`Payroll lines created: ${linesCreated}`)
console.log(`Payslips generated: ${payslipResult.data.length}`)
