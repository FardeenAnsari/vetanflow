import { describe, expect, it } from 'vitest'
import { buildPayslipPdf, getPayslipPortalItem } from './payslip-service.js'

describe('buildPayslipPdf', () => {
  it('creates a readable PDF payslip buffer', () => {
    const pdf = buildPayslipPdf({
      employee: {
        code: 'VF-001',
        designation: 'Payroll Analyst',
        email: 'aarav@example.com',
        name: 'Aarav Mehta',
      },
      line: {
        calculationSnapshot: {
          attendance: {
            lossOfPayDays: 0.5,
            payableDays: 29.5,
          },
          payroll: {
            deductions: {
              localPayrollTax: 200,
              postTaxAdjustments: 500,
              preTaxAdjustments: 0,
              retirementContribution: 1800,
              socialInsurance: 0,
              unpaidLeave: 1000,
              withholdingTax: 0,
            },
            earnings: {
              fixedGross: 80000,
              overtime: 1200,
              reimbursements: 750,
              taxableAdjustments: 1500,
            },
          },
        },
        grossPay: 80000,
        netPay: 79950,
        totalDeductions: 3500,
        totalEarnings: 83450,
      },
      organization: {
        legalName: 'VetanFlow Labs, Inc.',
        name: 'VetanFlow Labs',
      },
      periodEnd: '2026-07-31',
      periodStart: '2026-07-01',
    })
    const text = pdf.toString('latin1')

    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text).toContain('VetanFlow Payslip')
    expect(text).toContain('Aarav Mehta')
    expect(text).toContain('USD 79,950')
    expect(text).toContain('%%EOF')
  })
})

describe('getPayslipPortalItem', () => {
  it('hydrates run metadata when employee RLS hides the nested payroll run', () => {
    const item = getPayslipPortalItem(
      {
        id: 'payslip_001',
        payroll_run_line_id: 'line_001',
        published_at: '2026-07-15T00:00:00.000Z',
        storage_path: 'org/run/line.pdf',
        payroll_run_lines: {
          employee_id: 'employee_001',
          employees: {
            designation: 'Frontend Engineer',
            employee_code: 'VF-001',
            full_name: 'Aarav Mehta',
            work_email: 'aarav@example.com',
          },
          gross_pay: 100000,
          net_pay: 97750,
          payroll_run_id: 'run_001',
          payroll_runs: null,
          total_deductions: 2250,
          total_earnings: 100000,
        },
      },
      new Map([
        [
          'run_001',
          {
            period_end: '2026-09-30',
            period_start: '2026-09-01',
            status: 'finalized',
          },
        ],
      ]),
    )

    expect(item).toMatchObject({
      employeeCode: 'VF-001',
      employeeName: 'Aarav Mehta',
      netPay: 97750,
      periodEnd: '2026-09-30',
      periodStart: '2026-09-01',
      runStatus: 'finalized',
    })
  })
})
