import { env } from '../../config/env.js'
import { createSupabaseUserClient, getSupabaseServiceClient } from '../../lib/supabase.js'
import { getUserRoles, hasAnyRole } from '../auth/roles.js'
import type { AppRole } from '../employees/sample-data.js'
import { PayrollRunWriteError } from './payroll-run-repository.js'

type DataSource = 'fixture' | 'supabase'
type WriteStatus = 'created' | 'forbidden' | 'not_configured' | 'not_found' | 'updated'

type Result<T> = {
  data: T
  source: DataSource
}

type PayslipStatusResult<T> = {
  data?: T
  status: WriteStatus
}

type JsonRecord = Record<string, unknown>

type PayslipEmployeeRow = {
  employee_code: string
  full_name: string
  designation: string
  work_email: string | null
}

type PayslipRunLineRow = {
  calculation_snapshot: unknown
  employee_id: string
  employees: PayslipEmployeeRow | PayslipEmployeeRow[] | null
  gross_pay: number
  id: string
  net_pay: number
  total_deductions: number
  total_earnings: number
}

type PayslipOrganizationRow = {
  currency_code: string
  legal_name: string | null
  locale: string
  name: string
}

type PayslipRunRow = {
  id: string
  organization_id: string
  organizations: PayslipOrganizationRow | PayslipOrganizationRow[] | null
  payroll_run_lines: PayslipRunLineRow[] | null
  period_end: string
  period_start: string
  status: string
}

type PayslipRow = {
  id: string
  payroll_run_line_id: string
  published_at: string | null
  storage_path: string | null
}

type PayslipDownloadRow = PayslipRow & {
  payroll_run_lines:
    | {
        employees: PayslipEmployeeRow | PayslipEmployeeRow[] | null
        payroll_run_id: string
        payroll_runs:
          | {
              period_end: string
              period_start: string
            }
          | Array<{
              period_end: string
              period_start: string
            }>
          | null
      }
    | Array<{
        employees: PayslipEmployeeRow | PayslipEmployeeRow[] | null
        payroll_run_id: string
        payroll_runs:
          | {
              period_end: string
              period_start: string
            }
          | Array<{
              period_end: string
              period_start: string
            }>
          | null
      }>
    | null
}

type PayslipPortalRunRow = {
  id?: string
  period_end: string
  period_start: string
  status: string
}

type PayslipPortalRunLineRow = {
  employee_id: string
  employees: PayslipEmployeeRow | PayslipEmployeeRow[] | null
  gross_pay: number
  net_pay: number
  payroll_run_id: string
  payroll_runs:
    | PayslipPortalRunRow
    | PayslipPortalRunRow[]
    | null
  total_deductions: number
  total_earnings: number
}

type PayslipPortalRow = PayslipRow & {
  payroll_run_lines: PayslipPortalRunLineRow | PayslipPortalRunLineRow[] | null
}

export type GeneratedPayslip = {
  employeeCode: string
  employeeId: string
  employeeName: string
  id: string
  payrollRunLineId: string
  publishedAt: string | null
}

export type PayslipPortalItem = {
  employeeCode: string
  employeeId: string
  employeeName: string
  grossPay: number
  id: string
  netPay: number
  payrollRunLineId: string
  periodEnd: string
  periodStart: string
  publishedAt: string | null
  runStatus: string
  totalDeductions: number
  totalEarnings: number
}

export type PayslipPortal = {
  payslips: PayslipPortalItem[]
}

export type PayslipDownload = {
  expiresInSeconds: number
  filename: string
  signedUrl: string
}

export type PayslipPdfInput = {
  employee: {
    code: string
    designation: string
    email: string | null
    name: string
  }
  line: {
    calculationSnapshot: unknown
    grossPay: number
    netPay: number
    totalDeductions: number
    totalEarnings: number
  }
  organization: {
    currencyCode?: string
    legalName: string | null
    locale?: string
    name: string
  }
  periodEnd: string
  periodStart: string
}

export type PayslipRepository = {
  createForRun: (runId: string, actorUserId: string | undefined) => Promise<PayslipStatusResult<GeneratedPayslip[]>>
  getDownload: (accessToken: string | undefined, payslipId: string) => Promise<PayslipStatusResult<PayslipDownload>>
  listForUser: (accessToken: string | undefined) => Promise<Result<PayslipPortal>>
}

const payslipBucket = 'payslips'
const signedUrlTtlSeconds = 60 * 5

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getNestedNumber(value: unknown, path: string[], fallback = 0) {
  let current = value

  for (const key of path) {
    if (!isRecord(current)) {
      return fallback
    }

    current = current[key]
  }

  return typeof current === 'number' ? current : fallback
}

function getDeductionValue(payroll: unknown, key: string) {
  return getNestedNumber(payroll, ['deductions', key])
}

function formatDate(value: string, locale = env.payroll.locale) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatMoney(
  value: number,
  currencyCode = env.payroll.currencyCode,
  locale = env.payroll.locale,
) {
  return `${currencyCode} ${Math.round(value).toLocaleString(locale)}`
}

function safePdfText(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function pdfLine(
  x: number,
  y: number,
  text: string,
  options: { bold?: boolean; color?: string; size?: number } = {},
) {
  const font = options.bold ? 'F2' : 'F1'
  const size = options.size ?? 10
  const color = options.color ? `${options.color} rg ` : ''

  return `${color}BT /${font} ${size} Tf ${x} ${y} Td (${safePdfText(text)}) Tj ET`
}

function pdfRect(x: number, y: number, width: number, height: number, color: string) {
  return `q ${color} rg ${x} ${y} ${width} ${height} re f Q`
}

function pdfStrokeRect(x: number, y: number, width: number, height: number, color = '0.82 0.82 0.75') {
  return `q ${color} RG ${x} ${y} ${width} ${height} re S Q`
}

function buildPdfDocument(content: string) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(pdf, 'latin1')
}

export function buildPayslipPdf(input: PayslipPdfInput) {
  const currencyCode = input.organization.currencyCode ?? env.payroll.currencyCode
  const locale = input.organization.locale ?? env.payroll.locale
  const formatPayslipDate = (value: string) => formatDate(value, locale)
  const formatPayslipMoney = (value: number) => formatMoney(value, currencyCode, locale)
  const payroll = isRecord(input.line.calculationSnapshot) ? input.line.calculationSnapshot.payroll : null
  const attendance = isRecord(input.line.calculationSnapshot) ? input.line.calculationSnapshot.attendance : null
  const earnings = [
    ['Fixed gross', getNestedNumber(payroll, ['earnings', 'fixedGross'], input.line.grossPay)],
    ['Overtime', getNestedNumber(payroll, ['earnings', 'overtime'])],
    ['Taxable adjustments', getNestedNumber(payroll, ['earnings', 'taxableAdjustments'])],
    ['Reimbursements', getNestedNumber(payroll, ['earnings', 'reimbursements'])],
  ]
  const deductions = [
    ['Loss of pay', getNestedNumber(payroll, ['deductions', 'unpaidLeave'])],
    ['Retirement contribution', getDeductionValue(payroll, 'retirementContribution')],
    ['Social insurance', getDeductionValue(payroll, 'socialInsurance')],
    ['Local payroll tax', getDeductionValue(payroll, 'localPayrollTax')],
    ['Pre-tax adjustments', getNestedNumber(payroll, ['deductions', 'preTaxAdjustments'])],
    ['Post-tax adjustments', getNestedNumber(payroll, ['deductions', 'postTaxAdjustments'])],
    ['Withholding tax', getDeductionValue(payroll, 'withholdingTax')],
  ]
  const commands = [
    pdfRect(0, 735, 612, 57, '0.039 0.161 0.278'),
    pdfLine(40, 760, 'VetanFlow Payslip', { bold: true, color: '1 1 1', size: 18 }),
    pdfLine(40, 742, `${formatPayslipDate(input.periodStart)} to ${formatPayslipDate(input.periodEnd)}`, {
      color: '1 1 1',
      size: 10,
    }),
    pdfLine(405, 760, input.organization.legalName ?? input.organization.name, {
      bold: true,
      color: '1 1 1',
      size: 11,
    }),
    pdfLine(405, 744, 'Confidential payroll statement', {
      color: '1 1 1',
      size: 9,
    }),
    pdfLine(40, 700, input.employee.name, { bold: true, size: 16 }),
    pdfLine(40, 682, `${input.employee.code} - ${input.employee.designation}`, { size: 10 }),
    pdfLine(40, 666, input.employee.email ?? 'No work email', { size: 10 }),
    pdfRect(370, 658, 190, 54, '0.918 0.945 1'),
    pdfStrokeRect(370, 658, 190, 54),
    pdfLine(388, 691, 'Net Pay', { bold: true, size: 11 }),
    pdfLine(388, 670, formatPayslipMoney(input.line.netPay), { bold: true, size: 18 }),
    pdfLine(
      40,
      632,
      `Attendance: ${getNestedNumber(attendance, ['payableDays'])} payable days, ${getNestedNumber(attendance, ['lossOfPayDays'])} LOP days`,
      { size: 10 },
    ),
    pdfRect(40, 590, 250, 28, '0.91 0.925 0.945'),
    pdfLine(55, 600, 'Earnings', { bold: true, size: 12 }),
    pdfRect(322, 590, 250, 28, '0.91 0.925 0.945'),
    pdfLine(337, 600, 'Deductions', { bold: true, size: 12 }),
  ]

  earnings.forEach(([label, value], index) => {
    const y = 560 - index * 25
    commands.push(pdfLine(55, y, label as string, { size: 10 }))
    commands.push(pdfLine(205, y, formatPayslipMoney(value as number), { size: 10 }))
  })

  deductions.forEach(([label, value], index) => {
    const y = 560 - index * 25
    commands.push(pdfLine(337, y, label as string, { size: 10 }))
    commands.push(pdfLine(487, y, formatPayslipMoney(value as number), { size: 10 }))
  })

  commands.push(
    pdfStrokeRect(40, 350, 250, 32),
    pdfStrokeRect(322, 350, 250, 32),
    pdfLine(55, 361, `Total earnings ${formatPayslipMoney(input.line.totalEarnings)}`, { bold: true, size: 11 }),
    pdfLine(337, 361, `Total deductions ${formatPayslipMoney(input.line.totalDeductions)}`, { bold: true, size: 11 }),
    pdfLine(40, 95, 'This is a system generated payslip for payroll review records.', { size: 9 }),
    pdfLine(40, 78, `Generated by VetanFlow. Values use ${currencyCode} and are rounded to whole units.`, { size: 9 }),
  )

  return buildPdfDocument(commands.join('\n'))
}

async function canCreatePayslips(actorUserId: string | undefined, organizationId: string) {
  if (!actorUserId) {
    return false
  }

  const roles = await getUserRoles(actorUserId, organizationId)

  return hasAnyRole(roles, ['owner', 'admin', 'hr', 'finance'] satisfies AppRole[])
}

function getGeneratedPayslip(row: PayslipRow, line: PayslipRunLineRow): GeneratedPayslip {
  const employee = firstRelation(line.employees)

  return {
    employeeCode: employee?.employee_code ?? 'Unknown',
    employeeId: line.employee_id,
    employeeName: employee?.full_name ?? 'Unknown employee',
    id: row.id,
    payrollRunLineId: row.payroll_run_line_id,
    publishedAt: row.published_at,
  }
}

function getPayslipFileName(employeeCode: string, periodStart: string) {
  return `payslip-${employeeCode}-${periodStart.slice(0, 7)}.pdf`.toLowerCase()
}

export function getPayslipPortalItem(row: PayslipPortalRow, runsById = new Map<string, PayslipPortalRunRow>()): PayslipPortalItem | null {
  const line = firstRelation(row.payroll_run_lines)
  const employee = firstRelation(line?.employees ?? null)
  const run = firstRelation(line?.payroll_runs ?? null) ?? (line?.payroll_run_id ? runsById.get(line.payroll_run_id) : null)

  if (!line || !employee || !run) {
    return null
  }

  return {
    employeeCode: employee.employee_code,
    employeeId: line.employee_id,
    employeeName: employee.full_name,
    grossPay: Number(line.gross_pay),
    id: row.id,
    netPay: Number(line.net_pay),
    payrollRunLineId: row.payroll_run_line_id,
    periodEnd: run.period_end,
    periodStart: run.period_start,
    publishedAt: row.published_at,
    runStatus: run.status,
    totalDeductions: Number(line.total_deductions),
    totalEarnings: Number(line.total_earnings),
  }
}

export function createPayslipRepository(): PayslipRepository {
  return {
    async createForRun(runId, actorUserId) {
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
            organizations(name, legal_name, currency_code, locale),
            payroll_run_lines(
              calculation_snapshot,
              employee_id,
              gross_pay,
              id,
              net_pay,
              total_deductions,
              total_earnings,
              employees(employee_code, full_name, designation, work_email)
            )
          `,
        )
        .eq('id', runId)
        .maybeSingle()

      if (runResult.error) {
        throw runResult.error
      }

      const run = runResult.data as PayslipRunRow | null

      if (!run) {
        return { status: 'not_found' }
      }

      if (!(await canCreatePayslips(actorUserId, run.organization_id))) {
        return { status: 'forbidden' }
      }

      if (run.status !== 'finalized') {
        throw new PayrollRunWriteError(409, 'Finalize payroll before generating payslips')
      }

      const organization = firstRelation(run.organizations)
      const lines = run.payroll_run_lines ?? []

      if (!organization || !lines.length) {
        return { status: 'not_found' }
      }

      const publishedAt = new Date().toISOString()
      const generatedPayslips: GeneratedPayslip[] = []

      for (const line of lines) {
        const employee = firstRelation(line.employees)

        if (!employee) {
          continue
        }

        const storagePath = `${run.organization_id}/${run.id}/${line.id}.pdf`
        const pdf = buildPayslipPdf({
          employee: {
            code: employee.employee_code,
            designation: employee.designation,
            email: employee.work_email,
            name: employee.full_name,
          },
          line: {
            calculationSnapshot: line.calculation_snapshot,
            grossPay: Number(line.gross_pay),
            netPay: Number(line.net_pay),
            totalDeductions: Number(line.total_deductions),
            totalEarnings: Number(line.total_earnings),
          },
          organization: {
            currencyCode: organization.currency_code,
            legalName: organization.legal_name,
            locale: organization.locale,
            name: organization.name,
          },
          periodEnd: run.period_end,
          periodStart: run.period_start,
        })
        const uploadResult = await supabase.storage.from(payslipBucket).upload(storagePath, pdf, {
          contentType: 'application/pdf',
          upsert: true,
        })

        if (uploadResult.error) {
          throw uploadResult.error
        }

        const upsertResult = await db
          .from('payslips')
          .upsert(
            {
              payroll_run_line_id: line.id,
              published_at: publishedAt,
              storage_path: storagePath,
            },
            { onConflict: 'payroll_run_line_id' },
          )
          .select('id, payroll_run_line_id, published_at, storage_path')
          .single()

        if (upsertResult.error) {
          throw upsertResult.error
        }

        generatedPayslips.push(getGeneratedPayslip(upsertResult.data as PayslipRow, line))
      }

      await supabase.from('audit_logs').insert({
        action: 'payslips_generated',
        actor_id: actorUserId,
        entity_id: run.id,
        entity_type: 'payroll_run',
        metadata: {
          payslip_count: generatedPayslips.length,
          period_end: run.period_end,
          period_start: run.period_start,
        },
        organization_id: run.organization_id,
      })

      return { data: generatedPayslips, status: 'updated' }
    },

    async getDownload(accessToken, payslipId) {
      const userClient = accessToken ? createSupabaseUserClient(accessToken) : null
      const serviceClient = getSupabaseServiceClient()

      if (!userClient || !serviceClient) {
        return { status: 'not_configured' }
      }

      const db = userClient as any
      const payslipResult = await db
        .from('payslips')
        .select(
          `
            id,
            payroll_run_line_id,
            published_at,
            storage_path,
            payroll_run_lines(
              payroll_run_id,
              employees(employee_code, full_name, designation, work_email),
              payroll_runs(period_end, period_start)
            )
          `,
        )
        .eq('id', payslipId)
        .maybeSingle()

      if (payslipResult.error) {
        throw payslipResult.error
      }

      const payslip = payslipResult.data as PayslipDownloadRow | null

      if (!payslip?.storage_path) {
        return { status: 'not_found' }
      }

      const line = firstRelation(payslip.payroll_run_lines)
      const employee = firstRelation(line?.employees ?? null)
      let run = firstRelation(line?.payroll_runs ?? null)

      if (!run && line?.payroll_run_id) {
        const runResult = await serviceClient
          .from('payroll_runs')
          .select('period_end,period_start')
          .eq('id', line.payroll_run_id)
          .maybeSingle()

        if (runResult.error) {
          throw runResult.error
        }

        run = runResult.data
      }

      if (!employee || !run) {
        return { status: 'not_found' }
      }

      const signedUrlResult = await serviceClient.storage
        .from(payslipBucket)
        .createSignedUrl(payslip.storage_path, signedUrlTtlSeconds)

      if (signedUrlResult.error) {
        throw signedUrlResult.error
      }

      return {
        data: {
          expiresInSeconds: signedUrlTtlSeconds,
          filename: getPayslipFileName(employee.employee_code, run.period_start),
          signedUrl: signedUrlResult.data.signedUrl,
        },
        status: 'updated',
      }
    },

    async listForUser(accessToken) {
      const userClient = accessToken ? createSupabaseUserClient(accessToken) : null
      const serviceClient = getSupabaseServiceClient()

      if (!userClient) {
        return { data: { payslips: [] }, source: 'fixture' }
      }

      const db = userClient as any
      const payslipsResult = await db
        .from('payslips')
        .select(
          `
            id,
            payroll_run_line_id,
            published_at,
            storage_path,
            payroll_run_lines(
              employee_id,
              gross_pay,
              net_pay,
              payroll_run_id,
              total_deductions,
              total_earnings,
              employees(employee_code, full_name, designation, work_email),
              payroll_runs(period_end, period_start, status)
            )
          `,
        )
        .order('published_at', { ascending: false })

      if (payslipsResult.error) {
        throw payslipsResult.error
      }

      const visiblePayslipRows = (payslipsResult.data as PayslipPortalRow[] | null) ?? []
      const runIds = Array.from(
        new Set(
          visiblePayslipRows.flatMap((row) => {
            const line = firstRelation(row.payroll_run_lines)

            return line?.payroll_run_id ? [line.payroll_run_id] : []
          }),
        ),
      )
      const runsById = new Map<string, PayslipPortalRunRow>()

      if (serviceClient && runIds.length) {
        const runResult = await serviceClient.from('payroll_runs').select('id,period_end,period_start,status').in('id', runIds)

        if (runResult.error) {
          throw runResult.error
        }

        for (const run of (runResult.data ?? []) as PayslipPortalRunRow[]) {
          if (run.id) {
            runsById.set(run.id, run)
          }
        }
      }

      const payslips = visiblePayslipRows.flatMap((row) => {
        const item = getPayslipPortalItem(row, runsById)

        return item ? [item] : []
      })

      return { data: { payslips }, source: 'supabase' }
    },
  }
}

export function getFallbackPayslipDownload(): Result<null> {
  return {
    data: null,
    source: 'fixture',
  }
}
