import { describe, expect, it } from 'vitest'
import { calculatePayrollPreview } from './calculate-payroll.js'

describe('calculatePayrollPreview', () => {
  it('rejects unpaid leave beyond the payroll period', () => {
    expect(() => calculatePayrollPreview({ employeeId: 'a', annualCompensation: 1200000, payableDays: 30, unpaidLeaveDays: 31 })).toThrow('Unpaid leave cannot exceed')
  })

  it('calculates the payroll preview with retirement and local tax deductions', () => {
    const preview = calculatePayrollPreview({
      employeeId: 'emp_001',
      annualCompensation: 1200000,
      unpaidLeaveDays: 2,
      payableDays: 30,
      overtimeAmount: 5000,
      bonusAmount: 10000,
      localPayrollTaxAmount: 200,
      reimbursementAmount: 2500,
      retirementContributionAmount: 1800,
    })

    expect(preview.grossMonthly).toBe(100000)
    expect(preview.retirementContributionAmount).toBe(1800)
    expect(preview.socialInsuranceAmount).toBe(0)
    expect(preview.localPayrollTaxAmount).toBe(200)
    expect(preview.unpaidLeaveDeduction).toBe(6666.67)
    expect(preview.netPay).toBe(108833.33)
  })

  it('supports half-day loss of pay', () => {
    const preview = calculatePayrollPreview({
      employeeId: 'emp_001',
      annualCompensation: 1200000,
      unpaidLeaveDays: 0.5,
      payableDays: 30,
    })

    expect(preview.unpaidLeaveDeduction).toBe(1666.67)
  })

  it('breaks out adjustments, reimbursements, insurance, and withholding deductions', () => {
    const preview = calculatePayrollPreview({
      employeeId: 'emp_002',
      annualCompensation: 240000,
      payableDays: 30,
      localPayrollTaxAmount: 200,
      postTaxDeductionAmount: 400,
      preTaxDeductionAmount: 300,
      reimbursementAmount: 500,
      retirementContributionAmount: 1200,
      socialInsuranceAmount: 150,
      taxableEarningsAmount: 1000,
      unpaidLeaveDays: 0,
      withholdingTaxAmount: 250,
    })

    expect(preview.socialInsuranceAmount).toBe(150)
    expect(preview.earnings.taxableAdjustments).toBe(1000)
    expect(preview.earnings.reimbursements).toBe(500)
    expect(preview.deductions.preTaxAdjustments).toBe(300)
    expect(preview.deductions.postTaxAdjustments).toBe(400)
    expect(preview.deductionSummary.withholdingTax).toBe(250)
    expect(preview.totalEarnings).toBe(21500)
    expect(preview.totalDeductions).toBe(2500)
    expect(preview.netPay).toBe(19000)
  })
})
