import { z } from 'zod'

export const payrollInputSchema = z.object({
  employeeId: z.string().min(1),
  annualCompensation: z.number().nonnegative(),
  unpaidLeaveDays: z.number().min(0).default(0),
  payableDays: z.number().positive().default(30),
  overtimeAmount: z.number().nonnegative().default(0),
  bonusAmount: z.number().nonnegative().default(0),
  taxableEarningsAmount: z.number().nonnegative().default(0),
  reimbursementAmount: z.number().nonnegative().default(0),
  retirementContributionAmount: z.number().nonnegative().default(0),
  socialInsuranceAmount: z.number().nonnegative().default(0),
  localPayrollTaxAmount: z.number().nonnegative().default(0),
  preTaxDeductionAmount: z.number().nonnegative().default(0),
  postTaxDeductionAmount: z.number().nonnegative().default(0),
  withholdingTaxAmount: z.number().nonnegative().default(0),
}).refine((input) => input.unpaidLeaveDays <= input.payableDays, {
  message: 'Unpaid leave cannot exceed the days in the payroll period',
  path: ['unpaidLeaveDays'],
})

export type PayrollInput = z.input<typeof payrollInputSchema>

export type PayrollPreview = {
  employeeId: string
  grossMonthly: number
  unpaidLeaveDeduction: number
  retirementContributionAmount: number
  socialInsuranceAmount: number
  localPayrollTaxAmount: number
  preTaxDeductionAmount: number
  postTaxDeductionAmount: number
  reimbursementAmount: number
  taxableEarningsAmount: number
  withholdingTaxAmount: number
  totalEarnings: number
  totalDeductions: number
  netPay: number
  earnings: {
    fixedGross: number
    overtime: number
    bonus: number
    taxableAdjustments: number
    reimbursements: number
  }
  deductions: {
    unpaidLeave: number
    retirementContribution: number
    socialInsurance: number
    localPayrollTax: number
    preTaxAdjustments: number
    postTaxAdjustments: number
    withholdingTax: number
  }
  deductionSummary: {
    retirementContribution: number
    socialInsurance: number
    localPayrollTax: number
    withholdingTax: number
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function calculatePayrollPreview(input: PayrollInput): PayrollPreview {
  const parsed = payrollInputSchema.parse(input)
  const grossMonthly = parsed.annualCompensation / 12
  const dailyRate = grossMonthly / parsed.payableDays
  const unpaidLeaveDeduction = dailyRate * parsed.unpaidLeaveDays
  const totalEarnings =
    grossMonthly +
    parsed.overtimeAmount +
    parsed.bonusAmount +
    parsed.taxableEarningsAmount +
    parsed.reimbursementAmount
  const totalDeductions =
    unpaidLeaveDeduction +
    parsed.retirementContributionAmount +
    parsed.socialInsuranceAmount +
    parsed.localPayrollTaxAmount +
    parsed.preTaxDeductionAmount +
    parsed.postTaxDeductionAmount +
    parsed.withholdingTaxAmount
  const roundedRetirementContribution = roundMoney(parsed.retirementContributionAmount)
  const roundedSocialInsurance = roundMoney(parsed.socialInsuranceAmount)
  const roundedLocalPayrollTax = roundMoney(parsed.localPayrollTaxAmount)
  const roundedUnpaidLeaveDeduction = roundMoney(unpaidLeaveDeduction)
  const roundedReimbursementAmount = roundMoney(parsed.reimbursementAmount)
  const roundedTaxableEarningsAmount = roundMoney(parsed.taxableEarningsAmount)
  const roundedPreTaxDeductionAmount = roundMoney(parsed.preTaxDeductionAmount)
  const roundedPostTaxDeductionAmount = roundMoney(parsed.postTaxDeductionAmount)
  const roundedWithholdingTaxAmount = roundMoney(parsed.withholdingTaxAmount)

  return {
    employeeId: parsed.employeeId,
    grossMonthly: roundMoney(grossMonthly),
    unpaidLeaveDeduction: roundedUnpaidLeaveDeduction,
    retirementContributionAmount: roundedRetirementContribution,
    socialInsuranceAmount: roundedSocialInsurance,
    localPayrollTaxAmount: roundedLocalPayrollTax,
    preTaxDeductionAmount: roundedPreTaxDeductionAmount,
    postTaxDeductionAmount: roundedPostTaxDeductionAmount,
    reimbursementAmount: roundedReimbursementAmount,
    taxableEarningsAmount: roundedTaxableEarningsAmount,
    withholdingTaxAmount: roundedWithholdingTaxAmount,
    totalEarnings: roundMoney(totalEarnings),
    totalDeductions: roundMoney(totalDeductions),
    netPay: roundMoney(totalEarnings - totalDeductions),
    earnings: {
      fixedGross: roundMoney(grossMonthly),
      overtime: roundMoney(parsed.overtimeAmount),
      bonus: roundMoney(parsed.bonusAmount),
      taxableAdjustments: roundedTaxableEarningsAmount,
      reimbursements: roundedReimbursementAmount,
    },
    deductions: {
      unpaidLeave: roundedUnpaidLeaveDeduction,
      retirementContribution: roundedRetirementContribution,
      socialInsurance: roundedSocialInsurance,
      localPayrollTax: roundedLocalPayrollTax,
      preTaxAdjustments: roundedPreTaxDeductionAmount,
      postTaxAdjustments: roundedPostTaxDeductionAmount,
      withholdingTax: roundedWithholdingTaxAmount,
    },
    deductionSummary: {
      retirementContribution: roundedRetirementContribution,
      socialInsurance: roundedSocialInsurance,
      localPayrollTax: roundedLocalPayrollTax,
      withholdingTax: roundedWithholdingTaxAmount,
    },
  }
}
