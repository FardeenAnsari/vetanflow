import { z } from 'zod'
import { getSupabaseServiceClient } from '../../lib/supabase.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'
import type { AppRole } from '../employees/sample-data.js'
import { PayrollRunWriteError } from './payroll-run-repository.js'

type WriteStatus = 'forbidden' | 'not_configured' | 'not_found' | 'updated'

type PayrollExportStatusResult<T> = {
  data?: T
  status: WriteStatus
}

type JsonRecord = Record<string, unknown>

type PayrollExportRunLineRow = {
  calculation_snapshot: unknown
  employees:
    | {
        bank_account_holder_name: string | null
        bank_account_number: string | null
        bank_ifsc: string | null
        bank_name: string | null
        departments: { name: string } | { name: string }[] | null
        employee_code: string
        full_name: string
      }
    | Array<{
        bank_account_holder_name: string | null
        bank_account_number: string | null
        bank_ifsc: string | null
        bank_name: string | null
        departments: { name: string } | { name: string }[] | null
        employee_code: string
        full_name: string
      }>
    | null
  gross_pay: number
  net_pay: number
  total_deductions: number
  total_earnings: number
}

type PayrollExportRunRow = {
  id: string
  organization_id: string
  organizations: { legal_name: string | null; name: string } | { legal_name: string | null; name: string }[] | null
  payroll_run_lines: PayrollExportRunLineRow[] | null
  period_end: string
  period_start: string
  status: string
}

type PayrollExportLine = {
  accountHolderName: string | null
  accountNumber: string | null
  bankName: string | null
  department: string
  employeeCode: string
  employeeName: string
  grossPay: number
  ifsc: string | null
  netPay: number
  statutory: {
    employeeEsi: number
    employeePf: number
    professionalTax: number
    tds: number
  }
  totalDeductions: number
  totalEarnings: number
}

export type PayrollCsvExport = {
  content: string
  filename: string
}

export const payrollExportTypeSchema = z.enum(['bank', 'department-cost', 'statutory'])

export type PayrollExportType = z.infer<typeof payrollExportTypeSchema>

export type PayrollExportRepository = {
  getExport: (
    runId: string,
    exportType: PayrollExportType,
    actorUserId: string | undefined,
  ) => Promise<PayrollExportStatusResult<PayrollCsvExport>>
}

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getNestedNumber(value: unknown, path: string[]) {
  let current = value

  for (const key of path) {
    if (!isRecord(current)) {
      return 0
    }

    current = current[key]
  }

  return typeof current === 'number' ? current : 0
}

function formatMoney(value: number) {
  return Math.round(value * 100) / 100
}

function getPeriodSlug(run: PayrollExportRunRow) {
  return run.period_start.slice(0, 7)
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value)

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

async function canExportPayroll(actorUserId: string | undefined, organizationId: string) {
  if (!actorUserId) {
    return false
  }

  const roles = await getUserRoles(actorUserId, organizationId)

  return hasAnyRole(roles, ['owner', 'admin', 'hr', 'finance'] satisfies AppRole[])
}

function toExportLine(row: PayrollExportRunLineRow): PayrollExportLine | null {
  const employee = firstRelation(row.employees)

  if (!employee) {
    return null
  }

  const department = firstRelation(employee.departments)

  return {
    accountHolderName: employee.bank_account_holder_name,
    accountNumber: employee.bank_account_number,
    bankName: employee.bank_name,
    department: department?.name ?? 'Unassigned',
    employeeCode: employee.employee_code,
    employeeName: employee.full_name,
    grossPay: Number(row.gross_pay),
    ifsc: employee.bank_ifsc,
    netPay: Number(row.net_pay),
    statutory: {
      employeeEsi: getNestedNumber(row.calculation_snapshot, ['payroll', 'statutory', 'employeeEsi']),
      employeePf: getNestedNumber(row.calculation_snapshot, ['payroll', 'statutory', 'employeePf']),
      professionalTax: getNestedNumber(row.calculation_snapshot, ['payroll', 'statutory', 'professionalTax']),
      tds: getNestedNumber(row.calculation_snapshot, ['payroll', 'statutory', 'tds']),
    },
    totalDeductions: Number(row.total_deductions),
    totalEarnings: Number(row.total_earnings),
  }
}

function getRunLines(run: PayrollExportRunRow) {
  return ((run.payroll_run_lines ?? []).flatMap((line) => {
    const exportLine = toExportLine(line)

    return exportLine ? [exportLine] : []
  })).sort((a, b) => a.employeeCode.localeCompare(b.employeeCode))
}

function buildBankExport(run: PayrollExportRunRow, lines: PayrollExportLine[]): PayrollCsvExport {
  const periodSlug = getPeriodSlug(run)
  const rows = lines.map((line) => {
    const isReady = Boolean(line.accountHolderName && line.accountNumber && line.ifsc)

    return [
      line.employeeCode,
      line.employeeName,
      line.accountHolderName,
      line.bankName,
      line.accountNumber,
      line.ifsc,
      formatMoney(line.netPay),
      `Salary ${periodSlug}`,
      isReady ? 'ready' : 'missing_bank_details',
    ]
  })

  return {
    content: toCsv(
      [
        'Employee Code',
        'Employee Name',
        'Account Holder Name',
        'Bank Name',
        'Account Number',
        'IFSC',
        'Net Pay',
        'Narration',
        'Status',
      ],
      rows,
    ),
    filename: `bank-payout-${periodSlug}.csv`,
  }
}

function buildStatutoryExport(run: PayrollExportRunRow, lines: PayrollExportLine[]): PayrollCsvExport {
  const periodSlug = getPeriodSlug(run)
  const total = lines.reduce(
    (summary, line) => ({
      employeeEsi: summary.employeeEsi + line.statutory.employeeEsi,
      employeePf: summary.employeePf + line.statutory.employeePf,
      grossPay: summary.grossPay + line.grossPay,
      netPay: summary.netPay + line.netPay,
      professionalTax: summary.professionalTax + line.statutory.professionalTax,
      tds: summary.tds + line.statutory.tds,
      totalDeductions: summary.totalDeductions + line.totalDeductions,
    }),
    {
      employeeEsi: 0,
      employeePf: 0,
      grossPay: 0,
      netPay: 0,
      professionalTax: 0,
      tds: 0,
      totalDeductions: 0,
    },
  )
  const rows = [
    ...lines.map((line) => [
      line.employeeCode,
      line.employeeName,
      formatMoney(line.grossPay),
      formatMoney(line.statutory.employeePf),
      formatMoney(line.statutory.employeeEsi),
      formatMoney(line.statutory.professionalTax),
      formatMoney(line.statutory.tds),
      formatMoney(line.totalDeductions),
      formatMoney(line.netPay),
    ]),
    [
      'TOTAL',
      '',
      formatMoney(total.grossPay),
      formatMoney(total.employeePf),
      formatMoney(total.employeeEsi),
      formatMoney(total.professionalTax),
      formatMoney(total.tds),
      formatMoney(total.totalDeductions),
      formatMoney(total.netPay),
    ],
  ]

  return {
    content: toCsv(
      [
        'Employee Code',
        'Employee Name',
        'Gross Pay',
        'Employee PF',
        'Employee ESI',
        'Professional Tax',
        'TDS',
        'Total Deductions',
        'Net Pay',
      ],
      rows,
    ),
    filename: `statutory-summary-${periodSlug}.csv`,
  }
}

function buildDepartmentCostExport(run: PayrollExportRunRow, lines: PayrollExportLine[]): PayrollCsvExport {
  const periodSlug = getPeriodSlug(run)
  const byDepartment = new Map<
    string,
    {
      employeeEsi: number
      employeePf: number
      grossPay: number
      headcount: number
      netPay: number
      professionalTax: number
      tds: number
      totalDeductions: number
      totalEarnings: number
    }
  >()

  for (const line of lines) {
    const current =
      byDepartment.get(line.department) ??
      {
        employeeEsi: 0,
        employeePf: 0,
        grossPay: 0,
        headcount: 0,
        netPay: 0,
        professionalTax: 0,
        tds: 0,
        totalDeductions: 0,
        totalEarnings: 0,
      }

    current.employeeEsi += line.statutory.employeeEsi
    current.employeePf += line.statutory.employeePf
    current.grossPay += line.grossPay
    current.headcount += 1
    current.netPay += line.netPay
    current.professionalTax += line.statutory.professionalTax
    current.tds += line.statutory.tds
    current.totalDeductions += line.totalDeductions
    current.totalEarnings += line.totalEarnings
    byDepartment.set(line.department, current)
  }

  const rows = [...byDepartment.entries()]
    .sort(([departmentA], [departmentB]) => departmentA.localeCompare(departmentB))
    .map(([department, summary]) => [
      department,
      summary.headcount,
      formatMoney(summary.grossPay),
      formatMoney(summary.totalEarnings),
      formatMoney(summary.totalDeductions),
      formatMoney(summary.netPay),
      formatMoney(summary.employeePf),
      formatMoney(summary.employeeEsi),
      formatMoney(summary.professionalTax),
      formatMoney(summary.tds),
    ])

  return {
    content: toCsv(
      [
        'Department',
        'Headcount',
        'Gross Pay',
        'Total Earnings',
        'Total Deductions',
        'Net Pay',
        'Employee PF',
        'Employee ESI',
        'Professional Tax',
        'TDS',
      ],
      rows,
    ),
    filename: `department-cost-${periodSlug}.csv`,
  }
}

function buildExport(run: PayrollExportRunRow, exportType: PayrollExportType) {
  const lines = getRunLines(run)

  if (exportType === 'bank') {
    return buildBankExport(run, lines)
  }

  if (exportType === 'statutory') {
    return buildStatutoryExport(run, lines)
  }

  return buildDepartmentCostExport(run, lines)
}

export function buildPayrollCsvExport(run: unknown, exportType: PayrollExportType) {
  return buildExport(run as PayrollExportRunRow, exportType)
}

export function createPayrollExportRepository(): PayrollExportRepository {
  return {
    async getExport(runId, exportType, actorUserId) {
      const supabase = getSupabaseServiceClient()

      if (!supabase) {
        return { status: 'not_configured' }
      }

      const db = supabase as any
      const runResult = await db
        .from('payroll_runs')
        .select(
          `
            id,
            organization_id,
            period_end,
            period_start,
            status,
            organizations(name, legal_name),
            payroll_run_lines(
              calculation_snapshot,
              gross_pay,
              net_pay,
              total_deductions,
              total_earnings,
              employees(
                employee_code,
                full_name,
                bank_account_holder_name,
                bank_account_number,
                bank_ifsc,
                bank_name,
                departments(name)
              )
            )
          `,
        )
        .eq('id', runId)
        .maybeSingle()

      if (runResult.error) {
        throw runResult.error
      }

      const run = runResult.data as PayrollExportRunRow | null

      if (!run) {
        return { status: 'not_found' }
      }

      if (!(await canExportPayroll(actorUserId, run.organization_id))) {
        return { status: 'forbidden' }
      }

      if (run.status !== 'finalized') {
        throw new PayrollRunWriteError(409, 'Finalize payroll before exporting reports')
      }

      return {
        data: buildExport(run, exportType),
        status: 'updated',
      }
    },
  }
}
