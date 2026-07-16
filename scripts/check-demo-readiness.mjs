import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const root = process.cwd()

function loadEnvFile(path) {
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

loadEnvFile(join(root, 'backend/.env'))

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
const demoPeriodMonth = normalizePeriodMonth(
  process.env.DEMO_PERIOD_MONTH ?? getDefaultDemoPeriodMonth(),
)

const checks = []

function record(status, label, detail) {
  checks.push({ detail, label, status })
}

async function query(label, request) {
  const { data, error } = await request

  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return data
}

function countRows(rows) {
  return Array.isArray(rows) ? rows.length : 0
}

function hasValue(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value != null
}

function normalizePeriodMonth(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid DEMO_PERIOD_MONTH: ${value}`)
  }

  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function getDefaultDemoPeriodMonth() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10)
}

function getMonthBounds(month) {
  const start = new Date(`${month}T00:00:00.000Z`)
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))

  return {
    endDate: end.toISOString().slice(0, 10),
    month,
    startDate: month,
  }
}

if (!supabaseUrl || !serviceRoleKey) {
  record('fail', 'Supabase admin env', 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.')
} else {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: WebSocket,
    },
  })

  try {
    const period = getMonthBounds(demoPeriodMonth)
    const organizations = await query(
      'organizations',
      supabase.from('organizations').select('id,name').order('created_at', { ascending: true }),
    )
    const organization = organizations[0] ?? null
    record(organization ? 'pass' : 'fail', 'Organization', organization ? organization.name : 'No organization found.')

    const roles = await query(
      'user_roles',
      supabase.from('user_roles').select('role,user_id,organization_id'),
    )
    const ownerLikeRoles = roles.filter((role) => ['owner', 'admin'].includes(role.role))
    const checkerRoles = roles.filter((role) => ['owner', 'admin', 'finance'].includes(role.role))
    const employeeRoles = roles.filter((role) => role.role === 'employee')
    record(
      ownerLikeRoles.length > 0 ? 'pass' : 'fail',
      'Owner/admin role',
      `${ownerLikeRoles.length} owner/admin role assignment${ownerLikeRoles.length === 1 ? '' : 's'} found.`,
    )
    record(
      checkerRoles.length > 1 ? 'pass' : 'warn',
      'Payroll checker role',
      `${checkerRoles.length} owner/admin/finance role assignment${checkerRoles.length === 1 ? '' : 's'} found.`,
    )
    record(
      employeeRoles.length > 0 ? 'pass' : 'fail',
      'Employee role',
      `${employeeRoles.length} employee role assignment${employeeRoles.length === 1 ? '' : 's'} found.`,
    )

    const employees = await query(
      'employees',
      supabase
        .from('employees')
        .select(
          'id,employee_code,full_name,status,profile_id,bank_account_holder_name,bank_account_number,bank_routing_code,bank_name',
        )
        .order('employee_code', { ascending: true }),
    )
    const activeEmployees = employees.filter((employee) => employee.status === 'active')
    const linkedEmployees = activeEmployees.filter((employee) => hasValue(employee.profile_id))
    const bankReadyEmployees = activeEmployees.filter(
      (employee) =>
        hasValue(employee.bank_account_holder_name) &&
        hasValue(employee.bank_account_number) &&
        hasValue(employee.bank_routing_code) &&
        hasValue(employee.bank_name),
    )

    record(
      activeEmployees.length > 0 ? 'pass' : 'fail',
      'Active employees',
      `${activeEmployees.length} active employee${activeEmployees.length === 1 ? '' : 's'} found.`,
    )
    record(
      linkedEmployees.length > 0 ? 'pass' : 'fail',
      'Linked employee profile',
      `${linkedEmployees.length} active employee${linkedEmployees.length === 1 ? '' : 's'} linked to auth profiles.`,
    )
    record(
      bankReadyEmployees.length > 0 ? 'pass' : 'fail',
      'Bank-ready employee',
      `${bankReadyEmployees.length} active employee${bankReadyEmployees.length === 1 ? '' : 's'} have payout details.`,
    )

    const attendanceLocks = await query(
      'attendance_month_locks',
      supabase
        .from('attendance_month_locks')
        .select('id,period_month,organization_id')
        .eq('period_month', period.month)
        .order('period_month', { ascending: false }),
    )
    const latestLock = attendanceLocks[0] ?? null
    record(
      latestLock ? 'pass' : 'fail',
      'Locked attendance month',
      latestLock ? `Demo lock: ${latestLock.period_month}.` : `No locked attendance month found for ${period.month}.`,
    )

    const attendanceEntries = await query(
      'attendance_entries',
      supabase
        .from('attendance_entries')
        .select('id')
        .gte('work_date', period.startDate)
        .lte('work_date', period.endDate),
    )
    record(
      attendanceEntries.length > 0 ? 'pass' : 'warn',
      'Attendance entries',
      `${attendanceEntries.length} attendance entr${attendanceEntries.length === 1 ? 'y' : 'ies'} found for the demo month.`,
    )

    const finalizedRuns = await query(
      'payroll_runs',
      supabase
        .from('payroll_runs')
        .select('id,period_start,period_end,status')
        .eq('status', 'finalized')
        .eq('period_start', period.startDate)
        .eq('period_end', period.endDate)
        .order('period_start', { ascending: false }),
    )
    const latestFinalizedRun = finalizedRuns[0] ?? null
    record(
      latestFinalizedRun ? 'pass' : 'fail',
      'Finalized payroll run',
      latestFinalizedRun
        ? `Demo finalized run: ${latestFinalizedRun.period_start} to ${latestFinalizedRun.period_end}.`
        : `No finalized payroll run found for ${period.startDate} to ${period.endDate}.`,
    )

    if (latestFinalizedRun) {
      const lines = await query(
        'payroll_run_lines',
        supabase
          .from('payroll_run_lines')
          .select('id,employee_id,net_pay')
          .eq('payroll_run_id', latestFinalizedRun.id),
      )
      const payslips = await query(
        'payslips',
        supabase.from('payslips').select('id,payroll_run_line_id,storage_path,published_at'),
      )
      const latestLineIds = new Set(lines.map((line) => line.id))
      const runPayslips = payslips.filter((payslip) => latestLineIds.has(payslip.payroll_run_line_id))
      const downloadablePayslips = runPayslips.filter(
        (payslip) => hasValue(payslip.storage_path) && hasValue(payslip.published_at),
      )
      const lineEmployeeIds = new Set(lines.map((line) => line.employee_id))
      const lineEmployees = employees.filter((employee) => lineEmployeeIds.has(employee.id))
      const missingBankEmployees = lineEmployees.filter(
        (employee) =>
          !hasValue(employee.bank_account_holder_name) ||
          !hasValue(employee.bank_account_number) ||
          !hasValue(employee.bank_routing_code) ||
          !hasValue(employee.bank_name),
      )

      record(
        lines.length > 0 ? 'pass' : 'fail',
        'Finalized run lines',
        `${lines.length} payroll line${lines.length === 1 ? '' : 's'} found for latest finalized run.`,
      )
      record(
        lines.length > 0 && downloadablePayslips.length >= lines.length ? 'pass' : 'warn',
        'Payslips for latest run',
        `${downloadablePayslips.length}/${lines.length} line${lines.length === 1 ? '' : 's'} have published Storage paths.`,
      )
      record(
        missingBankEmployees.length === 0 ? 'pass' : 'warn',
        'Bank export readiness',
        missingBankEmployees.length === 0
          ? 'All latest finalized run employees have bank details.'
          : `${missingBankEmployees.length} latest-run employee${missingBankEmployees.length === 1 ? '' : 's'} missing bank details.`,
      )
    }

    const buckets = await query('storage buckets', supabase.storage.listBuckets())
    const bucketIds = new Set(buckets.map((bucket) => bucket.id))
    record(
      bucketIds.has('employee-photos') ? 'pass' : 'warn',
      'Employee photo bucket',
      bucketIds.has('employee-photos') ? 'employee-photos bucket exists.' : 'employee-photos bucket missing.',
    )
    record(
      bucketIds.has('payslips') ? 'pass' : 'fail',
      'Payslip bucket',
      bucketIds.has('payslips') ? 'payslips bucket exists.' : 'payslips bucket missing.',
    )
  } catch (error) {
    record('fail', 'Supabase readiness query', error instanceof Error ? error.message : String(error))
  }
}

const symbols = {
  fail: 'FAIL',
  pass: 'PASS',
  warn: 'WARN',
}

console.log('VetanFlow demo readiness')
console.log('')

for (const check of checks) {
  console.log(`[${symbols[check.status]}] ${check.label}: ${check.detail}`)
}

const failures = checks.filter((check) => check.status === 'fail')
const warnings = checks.filter((check) => check.status === 'warn')

console.log('')
console.log(`${checks.length - failures.length - warnings.length} passed, ${warnings.length} warning, ${failures.length} failed`)

if (failures.length > 0) {
  process.exitCode = 1
}
