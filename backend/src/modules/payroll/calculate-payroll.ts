import { z } from 'zod'

export const payrollInputSchema = z.object({
  employeeId: z.string().min(1),
  annualCtc: z.number().nonnegative(),
  unpaidLeaveDays: z.number().min(0).default(0),
  payableDays: z.number().positive().default(30),
  overtimeAmount: z.number().nonnegative().default(0),
  bonusAmount: z.number().nonnegative().default(0),
  taxableEarningsAmount: z.number().nonnegative().default(0),
  reimbursementAmount: z.number().nonnegative().default(0),
  preTaxDeductionAmount: z.number().nonnegative().default(0),
  postTaxDeductionAmount: z.number().nonnegative().default(0),
  tdsAmount: z.number().nonnegative().default(0),
})

export type PayrollInput = z.input<typeof payrollInputSchema>

export type PayrollPreview = {
  employeeId: string
  grossMonthly: number
  basic: number
  hra: number
  specialAllowance: number
  unpaidLeaveDeduction: number
  employeePf: number
  employeeEsi: number
  professionalTax: number
  preTaxDeductionAmount: number
  postTaxDeductionAmount: number
  reimbursementAmount: number
  taxableEarningsAmount: number
  tdsAmount: number
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
    employeePf: number
    employeeEsi: number
    professionalTax: number
    preTaxAdjustments: number
    postTaxAdjustments: number
    tds: number
  }
  statutory: {
    employeePf: number
    employeeEsi: number
    professionalTax: number
    tds: number
  }
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function calculatePayrollPreview(input: PayrollInput): PayrollPreview {
  const parsed = payrollInputSchema.parse(input)
  const grossMonthly = parsed.annualCtc / 12
  const basic = grossMonthly * 0.5
  const hra = basic * 0.4
  const specialAllowance = grossMonthly - basic - hra
  const dailyRate = grossMonthly / parsed.payableDays
  const unpaidLeaveDeduction = dailyRate * parsed.unpaidLeaveDays
  const employeePf = Math.min(basic * 0.12, 1800)
  const employeeEsi = grossMonthly <= 21000 ? grossMonthly * 0.0075 : 0
  const professionalTax = grossMonthly > 10000 ? 200 : 0
  const totalEarnings =
    grossMonthly +
    parsed.overtimeAmount +
    parsed.bonusAmount +
    parsed.taxableEarningsAmount +
    parsed.reimbursementAmount
  const totalDeductions =
    unpaidLeaveDeduction +
    employeePf +
    employeeEsi +
    professionalTax +
    parsed.preTaxDeductionAmount +
    parsed.postTaxDeductionAmount +
    parsed.tdsAmount
  const roundedEmployeePf = roundMoney(employeePf)
  const roundedEmployeeEsi = roundMoney(employeeEsi)
  const roundedProfessionalTax = roundMoney(professionalTax)
  const roundedUnpaidLeaveDeduction = roundMoney(unpaidLeaveDeduction)
  const roundedReimbursementAmount = roundMoney(parsed.reimbursementAmount)
  const roundedTaxableEarningsAmount = roundMoney(parsed.taxableEarningsAmount)
  const roundedPreTaxDeductionAmount = roundMoney(parsed.preTaxDeductionAmount)
  const roundedPostTaxDeductionAmount = roundMoney(parsed.postTaxDeductionAmount)
  const roundedTdsAmount = roundMoney(parsed.tdsAmount)

  return {
    employeeId: parsed.employeeId,
    grossMonthly: roundMoney(grossMonthly),
    basic: roundMoney(basic),
    hra: roundMoney(hra),
    specialAllowance: roundMoney(specialAllowance),
    unpaidLeaveDeduction: roundedUnpaidLeaveDeduction,
    employeePf: roundedEmployeePf,
    employeeEsi: roundedEmployeeEsi,
    professionalTax: roundedProfessionalTax,
    preTaxDeductionAmount: roundedPreTaxDeductionAmount,
    postTaxDeductionAmount: roundedPostTaxDeductionAmount,
    reimbursementAmount: roundedReimbursementAmount,
    taxableEarningsAmount: roundedTaxableEarningsAmount,
    tdsAmount: roundedTdsAmount,
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
      employeePf: roundedEmployeePf,
      employeeEsi: roundedEmployeeEsi,
      professionalTax: roundedProfessionalTax,
      preTaxAdjustments: roundedPreTaxDeductionAmount,
      postTaxAdjustments: roundedPostTaxDeductionAmount,
      tds: roundedTdsAmount,
    },
    statutory: {
      employeePf: roundedEmployeePf,
      employeeEsi: roundedEmployeeEsi,
      professionalTax: roundedProfessionalTax,
      tds: roundedTdsAmount,
    },
  }
}
