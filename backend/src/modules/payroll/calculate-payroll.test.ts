import { describe, expect, it } from 'vitest'
import { calculatePayrollPreview } from './calculate-payroll.js'

describe('calculatePayrollPreview', () => {
  it('calculates India-first payroll preview with PF and professional tax', () => {
    const preview = calculatePayrollPreview({
      employeeId: 'emp_001',
      annualCtc: 1200000,
      unpaidLeaveDays: 2,
      payableDays: 30,
      overtimeAmount: 5000,
      bonusAmount: 10000,
      reimbursementAmount: 2500,
    })

    expect(preview.grossMonthly).toBe(100000)
    expect(preview.basic).toBe(50000)
    expect(preview.hra).toBe(20000)
    expect(preview.employeePf).toBe(1800)
    expect(preview.employeeEsi).toBe(0)
    expect(preview.professionalTax).toBe(200)
    expect(preview.unpaidLeaveDeduction).toBe(6666.67)
    expect(preview.netPay).toBe(108833.33)
  })

  it('supports half-day loss of pay', () => {
    const preview = calculatePayrollPreview({
      employeeId: 'emp_001',
      annualCtc: 1200000,
      unpaidLeaveDays: 0.5,
      payableDays: 30,
    })

    expect(preview.unpaidLeaveDeduction).toBe(1666.67)
  })

  it('breaks out adjustments, reimbursements, ESI, and TDS-ready deductions', () => {
    const preview = calculatePayrollPreview({
      employeeId: 'emp_002',
      annualCtc: 240000,
      payableDays: 30,
      postTaxDeductionAmount: 400,
      preTaxDeductionAmount: 300,
      reimbursementAmount: 500,
      taxableEarningsAmount: 1000,
      tdsAmount: 250,
      unpaidLeaveDays: 0,
    })

    expect(preview.employeeEsi).toBe(150)
    expect(preview.earnings.taxableAdjustments).toBe(1000)
    expect(preview.earnings.reimbursements).toBe(500)
    expect(preview.deductions.preTaxAdjustments).toBe(300)
    expect(preview.deductions.postTaxAdjustments).toBe(400)
    expect(preview.statutory.tds).toBe(250)
    expect(preview.totalEarnings).toBe(21500)
    expect(preview.totalDeductions).toBe(2500)
    expect(preview.netPay).toBe(19000)
  })
})
