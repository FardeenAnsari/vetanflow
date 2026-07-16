import { describe, expect, it } from 'vitest'
import { buildPayrollCsvExport } from './payroll-export-service.js'

const finalizedRun = {
  id: 'run_001',
  organization_id: 'org_001',
  organizations: { legal_name: 'VetanFlow Demo India Pvt Ltd', name: 'VetanFlow Demo India' },
  period_end: '2026-07-31',
  period_start: '2026-07-01',
  status: 'finalized',
  payroll_run_lines: [
    {
      calculation_snapshot: {
        payroll: {
          statutory: {
            employeeEsi: 0,
            employeePf: 1800,
            professionalTax: 200,
            tds: 250,
          },
        },
      },
      employees: {
        bank_account_holder_name: 'Aarav Mehta',
        bank_account_number: '123456789012',
        bank_ifsc: 'HDFC0001234',
        bank_name: 'HDFC Bank',
        departments: { name: 'Engineering' },
        employee_code: 'IND-001',
        full_name: 'Aarav Mehta',
      },
      gross_pay: 100000,
      net_pay: 97750,
      total_deductions: 2250,
      total_earnings: 100000,
    },
    {
      calculation_snapshot: {
        payroll: {
          statutory: {
            employeeEsi: 75,
            employeePf: 1800,
            professionalTax: 200,
            tds: 0,
          },
        },
      },
      employees: {
        bank_account_holder_name: null,
        bank_account_number: null,
        bank_ifsc: null,
        bank_name: null,
        departments: { name: 'Finance' },
        employee_code: 'IND-002',
        full_name: 'Naina Kapoor',
      },
      gross_pay: 75000,
      net_pay: 72925,
      total_deductions: 2075,
      total_earnings: 75000,
    },
    {
      calculation_snapshot: {
        payroll: {
          statutory: {
            employeeEsi: 0,
            employeePf: 1800,
            professionalTax: 200,
            tds: 500,
          },
        },
      },
      employees: {
        bank_account_holder_name: 'Ritwik Sen',
        bank_account_number: '987654321098',
        bank_ifsc: 'ICIC0004321',
        bank_name: 'ICICI Bank',
        departments: { name: 'Engineering' },
        employee_code: 'IND-003',
        full_name: 'Ritwik Sen',
      },
      gross_pay: 125000,
      net_pay: 122500,
      total_deductions: 2500,
      total_earnings: 125000,
    },
  ],
}

describe('buildPayrollCsvExport', () => {
  it('marks bank payout rows that are missing bank details', () => {
    const report = buildPayrollCsvExport(finalizedRun, 'bank')

    expect(report.filename).toBe('bank-payout-2026-07.csv')
    expect(report.content).toContain('IND-001,Aarav Mehta,Aarav Mehta,HDFC Bank,123456789012,HDFC0001234,97750,Salary 2026-07,ready')
    expect(report.content).toContain('IND-002,Naina Kapoor,,,,,72925,Salary 2026-07,missing_bank_details')
  })

  it('adds a total row to statutory exports', () => {
    const report = buildPayrollCsvExport(finalizedRun, 'statutory')

    expect(report.filename).toBe('statutory-summary-2026-07.csv')
    expect(report.content).toContain('TOTAL,,300000,5400,75,600,750,6825,293175')
  })

  it('aggregates payroll cost by department', () => {
    const report = buildPayrollCsvExport(finalizedRun, 'department-cost')

    expect(report.filename).toBe('department-cost-2026-07.csv')
    expect(report.content).toContain('Engineering,2,225000,225000,4750,220250,3600,0,400,750')
    expect(report.content).toContain('Finance,1,75000,75000,2075,72925,1800,75,200,0')
  })
})
