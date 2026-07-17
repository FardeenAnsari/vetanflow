import {
  Archive,
  Banknote,
  Building2,
  Camera,
  CalendarCheck,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  Globe2,
  History,
  KeyRound,
  ListChecks,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRoundCog,
  UserPlus,
  WalletCards,
  X,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrandLogo } from './components/BrandLogo'
import { EmployeeIdCard } from './components/EmployeeIdCard'
import { Folder } from './components/Folder'
import { IdCardPrintAnimation } from './components/IdCardPrintAnimation'
import { OperationsOverview } from './components/OperationsOverview'
import { StatusBadge, type StatusTone } from './components/StatusBadge'
import {
  WorkspaceNavigation,
} from './components/WorkspaceNavigation'
import {
  getAllowedWorkspaceSections,
  getPrimaryWorkspaceRole,
  isWorkspaceSection,
  roleLabels,
  type WorkspaceSection,
} from './components/workspace-navigation-model'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  countryOptions,
  currencyOptions,
  getCountryOption,
  localeOptions,
  timezoneOptions,
} from './lib/organization-options'
import { PublicSite } from './public-site/PublicSite'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:4000')
const defaultCurrencyCode = import.meta.env.VITE_DEFAULT_CURRENCY ?? 'USD'
const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE ?? 'en-US'
const PayrollWorkspaceSkeleton = lazy(() =>
  import('./components/SkeletonShimmer').then((module) => ({
    default: module.PayrollWorkspaceSkeleton,
  })),
)

type AppRole = 'owner' | 'admin' | 'hr' | 'finance' | 'manager' | 'employee'

const appRoles: AppRole[] = ['owner', 'admin', 'hr', 'finance', 'manager', 'employee']

function getDevelopmentFixtureRole() {
  if (!import.meta.env.DEV || isSupabaseConfigured) {
    return null
  }

  const role = new URLSearchParams(window.location.search).get('role') as AppRole | null

  return role && appRoles.includes(role) ? role : null
}

const developmentFixtureRole = getDevelopmentFixtureRole()

function withDevelopmentFixtureRole<T extends { currentUserRoles: AppRole[] }>(data: T): T {
  return developmentFixtureRole ? { ...data, currentUserRoles: [developmentFixtureRole] } : data
}

function clearLocalSupabaseAuthStorage() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        storage.removeItem(key)
      }
    }
  }
}

type HrEmployee = {
  id: string
  annualCompensation: number
  bankAccountHolderName: string | null
  bankAccountNumber: string | null
  bankRoutingCode: string | null
  bankName: string | null
  code: string
  department: string
  departmentId: string | null
  fullName: string
  joiningDate: string
  location: string
  photoUrl: string | null
  role: string
  status: 'draft' | 'active' | 'on_leave' | 'exit_pending' | 'inactive'
  workEmail: string | null
  workLocationId: string | null
}

type HrDepartment = {
  id: string
  isActive: boolean
  name: string
  organizationId: string
}

type HrLocation = {
  id: string
  city: string
  countryCode: string
  isActive: boolean
  name: string
  organizationId: string
  state: string
}

type SalaryRevision = {
  id: string
  annualCompensation: number
  createdAt: string
  effectiveFrom: string
  employeeId: string
  reason: string
}

type AuditEntry = {
  id: string
  action: string
  createdAt: string
  entityId: string | null
  entityType: string
  metadata: unknown
}

type OrganizationSettings = {
  countryCode: string
  currencyCode: string
  id: string
  locale: string
  name: string
  timezone: string
}

type HrMasterData = {
  auditEntries: AuditEntry[]
  currentUserRoles: AppRole[]
  departments: HrDepartment[]
  employees: HrEmployee[]
  locations: HrLocation[]
  organization: OrganizationSettings | null
  salaryRevisions: SalaryRevision[]
}

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
type LeaveApprovalStage = 'manager' | 'hr' | 'closed'
type LeaveDecision = 'approved' | 'rejected' | 'escalated'

type LeaveEmployee = {
  code: string
  fullName: string
  id: string
  managerEmployeeId: string | null
  organizationId: string
}

type LeaveRequest = {
  approvalStage: LeaveApprovalStage
  createdAt: string
  decisionNote: string | null
  employeeCode: string
  employeeId: string
  employeeName: string
  endDate: string
  id: string
  leaveType: string
  reason: string
  reviewedAt: string | null
  startDate: string
  status: LeaveStatus
  totalDays: number
}

type LeaveDashboard = {
  currentUserRoles: AppRole[]
  employees: LeaveEmployee[]
  organization: {
    id: string
    name: string
  } | null
  requests: LeaveRequest[]
}

type MasterDataResponse = {
  data: HrMasterData
  meta?: {
    source?: 'fixture' | 'supabase'
  }
}

type LeaveDashboardResponse = {
  data: LeaveDashboard
  meta?: {
    source?: 'fixture' | 'supabase'
  }
}

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'paid_leave'
  | 'unpaid_leave'
  | 'holiday'
  | 'weekly_off'

type AttendanceEmployee = {
  annualCompensation: number
  code: string
  fullName: string
  id: string
  organizationId: string
}

type AttendanceEntry = {
  attendanceStatus: AttendanceStatus
  employeeCode: string
  employeeId: string
  employeeName: string
  id: string
  notes: string | null
  overtimeHours: number
  payableHours: number
  workDate: string
}

type AttendanceHoliday = {
  holidayDate: string
  id: string
  name: string
  region: string
}

type AttendanceMonthLock = {
  id: string
  lockedAt: string
  lockedBy: string | null
  notes: string | null
  periodMonth: string
}

type PayrollPreview = {
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

type AttendanceSummary = {
  absentDays: number
  approvedLeaveDays: number
  calendarDays: number
  employeeCode: string
  employeeId: string
  employeeName: string
  grossMonthly: number
  halfDays: number
  holidays: number
  lossOfPayDays: number
  overtimeHours: number
  paidLeaveDays: number
  payableDays: number
  payrollPreview: PayrollPreview
  presentDays: number
  unpaidLeaveDays: number
  weeklyOffDays: number
}

type AttendanceDashboard = {
  currentUserRoles: AppRole[]
  employees: AttendanceEmployee[]
  entries: AttendanceEntry[]
  holidays: AttendanceHoliday[]
  locks: AttendanceMonthLock[]
  organization: {
    id: string
    name: string
  } | null
  period: {
    endDate: string
    month: string
    startDate: string
  }
  summaries: AttendanceSummary[]
}

type AttendanceDashboardResponse = {
  data: AttendanceDashboard
  meta?: {
    source?: 'fixture' | 'supabase'
  }
}

type PayrollRunStatus = 'draft' | 'reviewing' | 'approved' | 'finalized' | 'cancelled'
type PayrollAdjustmentComponentType = 'deduction' | 'earning' | 'reimbursement'
type PayrollAdjustmentTaxTreatment =
  | 'non_taxable_reimbursement'
  | 'post_tax_deduction'
  | 'pre_tax_deduction'
  | 'taxable'

type PayrollAdjustment = {
  amount: number
  componentCode: string
  componentName: string
  componentType: PayrollAdjustmentComponentType
  createdAt: string
  createdBy: string | null
  employeeId: string
  id: string
  notes: string | null
  payrollRunId: string
  taxTreatment: PayrollAdjustmentTaxTreatment
  updatedAt: string
}

type PayrollLinePayslip = {
  id: string
  publishedAt: string | null
}

type PayrollVarianceWarning = {
  code: 'net_pay_variance'
  currentNetPay: number
  delta: number
  deltaPercent: number | null
  message: string
  previousNetPay: number
  severity: 'high' | 'medium'
}

type PayrollRunLine = {
  adjustmentNetImpact: number
  adjustments: PayrollAdjustment[]
  calculationSnapshot: unknown
  employeeCode: string
  employeeId: string
  employeeName: string
  grossPay: number
  id: string
  lossOfPayDays: number
  netPay: number
  overtimeAmount: number
  payslip: PayrollLinePayslip | null
  totalDeductions: number
  totalEarnings: number
  varianceWarnings: PayrollVarianceWarning[]
}

type PayrollRun = {
  approvedAt: string | null
  approvedBy: string | null
  attendanceMonthLockId: string | null
  createdAt: string
  createdBy: string | null
  finalizedBy: string | null
  finalizedAt: string | null
  grossPay: number
  id: string
  lineCount: number
  netPay: number
  periodEnd: string
  periodStart: string
  status: PayrollRunStatus
  submittedAt: string | null
  submittedBy: string | null
  totalDeductions: number
  totalEarnings: number
  updatedAt: string
}

type PayrollRunDetail = PayrollRun & {
  lines: PayrollRunLine[]
}

type PayrollDashboard = {
  currentUserRoles: AppRole[]
  organization: {
    id: string
    name: string
  } | null
  runs: PayrollRun[]
}

type PayrollDashboardResponse = {
  data: PayrollDashboard
  meta?: {
    source?: 'fixture' | 'supabase'
  }
}

type PayrollRunDetailResponse = {
  data: PayrollRunDetail
  meta?: {
    source?: 'fixture' | 'supabase'
  }
}

type EmployeeWriteResponse = {
  data?: HrEmployee
}

type LeaveWriteResponse = {
  data?: LeaveRequest
}

type AttendanceWriteResponse<T = unknown> = {
  data?: T
}

type PayrollRunWriteResponse = {
  data?: PayrollRunDetail
}

type PayslipGenerationResponse = {
  data?: Array<{
    employeeCode: string
    employeeId: string
    employeeName: string
    id: string
    payrollRunLineId: string
    publishedAt: string | null
  }>
}

type PayslipDownloadResponse = {
  data?: {
    expiresInSeconds: number
    filename: string
    signedUrl: string
  }
}

type PayrollExportType = 'bank' | 'deductions' | 'department-cost'

type PayslipPortalItem = {
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
  runStatus: PayrollRunStatus
  totalDeductions: number
  totalEarnings: number
}

type PayslipPortal = {
  payslips: PayslipPortalItem[]
}

type PayslipPortalResponse = {
  data: PayslipPortal
  meta?: {
    source?: 'fixture' | 'supabase'
  }
}

type OrganizationMember = {
  createdAt: string
  email: string
  fullName: string
  roles: string[]
  userId: string
}

type OrganizationMembersResponse = {
  data: OrganizationMember[]
}

type EmployeeFormState = {
  annualCompensation: string
  bankAccountHolderName: string
  bankAccountNumber: string
  bankRoutingCode: string
  bankName: string
  code: string
  departmentId: string
  fullName: string
  joiningDate: string
  role: string
  status: HrEmployee['status']
  workEmail: string
  workLocationId: string
}

type LeaveFormState = {
  endDate: string
  leaveType: 'casual' | 'sick' | 'earned' | 'unpaid' | 'other'
  reason: string
  startDate: string
}

type AttendanceFormState = {
  attendanceStatus: AttendanceStatus
  employeeId: string
  notes: string
  overtimeHours: string
  payableHours: string
  workDate: string
}

type PayrollAdjustmentFormState = {
  amount: string
  componentCode: string
  componentName: string
  componentType: PayrollAdjustmentComponentType
  employeeId: string
  notes: string
  taxTreatment: PayrollAdjustmentTaxTreatment
}

type HolidayFormState = {
  holidayDate: string
  name: string
}

type InvitationFormState = {
  email: string
  fullName: string
  role: Exclude<AppRole, 'owner'>
}

type OrganizationFormState = Omit<OrganizationSettings, 'id'>

type FieldErrors = Partial<Record<'departmentName' | 'employeeCode' | 'locationName', string>>

type AuditEntityFilter = 'all' | 'department' | 'employee' | 'salary_revision' | 'work_location'

const employeeStatusOptions: HrEmployee['status'][] = [
  'draft',
  'active',
  'on_leave',
  'exit_pending',
  'inactive',
]
const employeePhotoMaxBytes = 2 * 1024 * 1024
const employeePhotoMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const leaveTypeOptions: LeaveFormState['leaveType'][] = ['casual', 'sick', 'earned', 'unpaid', 'other']
const attendanceStatusOptions: AttendanceStatus[] = [
  'present',
  'half_day',
  'absent',
  'paid_leave',
  'unpaid_leave',
  'holiday',
  'weekly_off',
]
const payrollAdjustmentComponentOptions: PayrollAdjustmentComponentType[] = [
  'earning',
  'deduction',
  'reimbursement',
]
const payrollAdjustmentTaxTreatmentOptions: PayrollAdjustmentTaxTreatment[] = [
  'taxable',
  'pre_tax_deduction',
  'post_tax_deduction',
  'non_taxable_reimbursement',
]
const payrollAdjustmentDefaults: Record<
  PayrollAdjustmentComponentType,
  Pick<PayrollAdjustmentFormState, 'componentCode' | 'componentName' | 'taxTreatment'>
> = {
  deduction: {
    componentCode: 'LOAN_RECOVERY',
    componentName: 'Loan recovery',
    taxTreatment: 'post_tax_deduction',
  },
  earning: {
    componentCode: 'PERFORMANCE_BONUS',
    componentName: 'Performance bonus',
    taxTreatment: 'taxable',
  },
  reimbursement: {
    componentCode: 'TRAVEL_REIMBURSEMENT',
    componentName: 'Travel reimbursement',
    taxTreatment: 'non_taxable_reimbursement',
  },
}

const formControlClass =
  'mt-2 min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)] disabled:cursor-not-allowed disabled:bg-[color:rgba(231,235,240,0.22)] disabled:text-neutral-500'

const fallbackMasterData: HrMasterData = {
  auditEntries: [],
  currentUserRoles: ['owner'],
  departments: [
    {
      id: '10000000-0000-0000-0000-000000000001',
      isActive: true,
      name: 'Engineering',
      organizationId: '00000000-0000-0000-0000-000000000001',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      isActive: true,
      name: 'Finance',
      organizationId: '00000000-0000-0000-0000-000000000001',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      isActive: true,
      name: 'Operations',
      organizationId: '00000000-0000-0000-0000-000000000001',
    },
  ],
  employees: [
    {
      id: 'emp_001',
      annualCompensation: 120000,
      bankAccountHolderName: null,
      bankAccountNumber: null,
      bankRoutingCode: null,
      bankName: null,
      code: 'VF-001',
      department: 'Engineering',
      departmentId: '10000000-0000-0000-0000-000000000001',
      fullName: 'Aarav Mehta',
      joiningDate: '2025-04-01',
      location: 'New York',
      photoUrl: null,
      role: 'Frontend Engineer',
      status: 'active',
      workEmail: 'aarav@example.com',
      workLocationId: '20000000-0000-0000-0000-000000000001',
    },
    {
      id: 'emp_002',
      annualCompensation: 90000,
      bankAccountHolderName: null,
      bankAccountNumber: null,
      bankRoutingCode: null,
      bankName: null,
      code: 'VF-002',
      department: 'Finance',
      departmentId: '10000000-0000-0000-0000-000000000002',
      fullName: 'Naina Kapoor',
      joiningDate: '2024-10-15',
      location: 'Austin',
      photoUrl: null,
      role: 'Payroll Specialist',
      status: 'active',
      workEmail: 'naina@example.com',
      workLocationId: '20000000-0000-0000-0000-000000000002',
    },
    {
      id: 'emp_003',
      annualCompensation: 150000,
      bankAccountHolderName: null,
      bankAccountNumber: null,
      bankRoutingCode: null,
      bankName: null,
      code: 'VF-003',
      department: 'Operations',
      departmentId: '10000000-0000-0000-0000-000000000003',
      fullName: 'Ritwik Sen',
      joiningDate: '2026-01-10',
      location: 'Seattle',
      photoUrl: null,
      role: 'Operations Manager',
      status: 'draft',
      workEmail: 'ritwik@example.com',
      workLocationId: '20000000-0000-0000-0000-000000000003',
    },
  ],
  locations: [
    {
      id: '20000000-0000-0000-0000-000000000001',
      city: 'New York',
      countryCode: 'US',
      isActive: true,
      name: 'New York HQ',
      organizationId: '00000000-0000-0000-0000-000000000001',
      state: 'New York',
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      city: 'Austin',
      countryCode: 'US',
      isActive: true,
      name: 'Austin Finance Office',
      organizationId: '00000000-0000-0000-0000-000000000001',
      state: 'Texas',
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      city: 'Seattle',
      countryCode: 'US',
      isActive: true,
      name: 'Seattle Operations Hub',
      organizationId: '00000000-0000-0000-0000-000000000001',
      state: 'Washington',
    },
  ],
  organization: {
    countryCode: 'US',
    currencyCode: 'USD',
    id: '00000000-0000-0000-0000-000000000001',
    locale: 'en-US',
    name: 'VetanFlow Labs',
    timezone: 'America/New_York',
  },
  salaryRevisions: [
    {
      id: 'salary_emp_001',
      annualCompensation: 120000,
      createdAt: '2026-07-04T00:00:00.000Z',
      effectiveFrom: '2025-04-01',
      employeeId: 'emp_001',
      reason: 'Initial setup',
    },
    {
      id: 'salary_emp_002',
      annualCompensation: 90000,
      createdAt: '2026-07-04T00:00:00.000Z',
      effectiveFrom: '2024-10-15',
      employeeId: 'emp_002',
      reason: 'Initial setup',
    },
    {
      id: 'salary_emp_003',
      annualCompensation: 150000,
      createdAt: '2026-07-04T00:00:00.000Z',
      effectiveFrom: '2026-01-10',
      employeeId: 'emp_003',
      reason: 'Initial setup',
    },
  ],
}

const fallbackLeaveDashboard: LeaveDashboard = {
  currentUserRoles: ['owner'],
  employees: [],
  organization: fallbackMasterData.organization,
  requests: [],
}

const fallbackPayrollDashboard: PayrollDashboard = {
  currentUserRoles: ['owner'],
  organization: fallbackMasterData.organization,
  runs: [],
}

const emptyAuthenticatedMasterData: HrMasterData = {
  auditEntries: [],
  currentUserRoles: [],
  departments: [],
  employees: [],
  locations: [],
  organization: null,
  salaryRevisions: [],
}

const emptyAuthenticatedLeaveDashboard: LeaveDashboard = {
  currentUserRoles: [],
  employees: [],
  organization: null,
  requests: [],
}

const emptyAuthenticatedPayrollDashboard: PayrollDashboard = {
  currentUserRoles: [],
  organization: null,
  runs: [],
}

function createEmptyAuthenticatedAttendanceDashboard(periodMonth?: string): AttendanceDashboard {
  const month = periodMonth ?? getCurrentPeriodMonth()
  const [year, monthIndex] = month.split('-').map(Number)

  return {
    currentUserRoles: [],
    employees: [],
    entries: [],
    holidays: [],
    locks: [],
    organization: null,
    period: {
      endDate: new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10),
      month,
      startDate: month,
    },
    summaries: [],
  }
}

function createFallbackAttendanceDashboard(periodMonth?: string): AttendanceDashboard {
  const month = periodMonth ?? getCurrentPeriodMonth()
  const [year, monthIndex] = month.split('-').map(Number)
  const endDate = new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10)
  const calendarDays = getCalendarDaysInPeriod(month)
  const employees = fallbackMasterData.employees.map((employee) => ({
    annualCompensation: employee.annualCompensation,
    code: employee.code,
    fullName: employee.fullName,
    id: employee.id,
    organizationId: fallbackMasterData.organization?.id ?? '',
  }))
  const holidays = [
    {
      holidayDate: '2026-09-18',
      id: 'holiday_company_day',
      name: 'Company day',
      region: 'GLOBAL',
    },
  ].filter((holiday) => holiday.holidayDate >= month && holiday.holidayDate <= endDate)

  return {
    currentUserRoles: ['owner'],
    employees,
    entries: [],
    holidays,
    locks: [],
    organization: fallbackMasterData.organization,
    period: {
      endDate,
      month,
      startDate: month,
    },
    summaries: employees.map((employee) => ({
      absentDays: 0,
      approvedLeaveDays: 0,
      calendarDays,
      employeeCode: employee.code,
      employeeId: employee.id,
      employeeName: employee.fullName,
      grossMonthly: employee.annualCompensation / 12,
      halfDays: 0,
      holidays: holidays.length,
      lossOfPayDays: 0,
      overtimeHours: 0,
      paidLeaveDays: 0,
      payableDays: holidays.length,
      payrollPreview: {
        employeeId: employee.id,
        retirementContributionAmount: 0,
        socialInsuranceAmount: 0,
        localPayrollTaxAmount: 0,
        deductions: {
          retirementContribution: 0,
          socialInsurance: 0,
          localPayrollTax: 0,
          postTaxAdjustments: 0,
          preTaxAdjustments: 0,
          withholdingTax: 0,
          unpaidLeave: 0,
        },
        earnings: {
          bonus: 0,
          fixedGross: employee.annualCompensation / 12,
          overtime: 0,
          reimbursements: 0,
          taxableAdjustments: 0,
        },
        grossMonthly: employee.annualCompensation / 12,
        netPay: employee.annualCompensation / 12,
        postTaxDeductionAmount: 0,
        preTaxDeductionAmount: 0,
        reimbursementAmount: 0,
        deductionSummary: {
          retirementContribution: 0,
          socialInsurance: 0,
          localPayrollTax: 0,
          withholdingTax: 0,
        },
        taxableEarningsAmount: 0,
        withholdingTaxAmount: 0,
        totalDeductions: 0,
        totalEarnings: employee.annualCompensation / 12,
        unpaidLeaveDeduction: 0,
      },
      presentDays: 0,
      unpaidLeaveDays: 0,
      weeklyOffDays: 0,
    })),
  }
}

function formatCurrencyValue(
  value: number,
  currencyCode = defaultCurrencyCode,
  locale = defaultLocale,
) {
  return new Intl.NumberFormat(locale, {
    currency: currencyCode,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function formatDateValue(value: string, locale = defaultLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatMonthValue(value: string, locale = defaultLocale) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatStatus(status: HrEmployee['status']) {
  return status
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function formatLabel(value: string) {
  return value
    .split(/[_-]/)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function formatLeaveStatus(status: LeaveStatus) {
  return formatLabel(status)
}

function formatLeaveType(leaveType: string) {
  const labels: Record<string, string> = {
    casual: 'Personal',
    earned: 'Vacation',
    other: 'Other',
    sick: 'Medical',
    unpaid: 'Unpaid',
  }

  return labels[leaveType] ?? formatLabel(leaveType)
}

function formatAttendanceStatus(status: AttendanceStatus) {
  return formatLabel(status)
}

function formatPayrollRunStatus(status: PayrollRunStatus) {
  return formatLabel(status)
}

function getEmployeeStatusTone(status: HrEmployee['status']): StatusTone {
  if (status === 'active') return 'success'
  if (status === 'inactive') return 'danger'
  if (status === 'on_leave') return 'info'
  return 'warning'
}

function getLeaveStatusTone(status: LeaveStatus): StatusTone {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'pending') return 'warning'
  return 'neutral'
}

function getPayrollStatusTone(status: PayrollRunStatus): StatusTone {
  if (status === 'finalized' || status === 'approved') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'reviewing') return 'warning'
  return 'info'
}

function getPayrollRunPeriodKey(run: PayrollRun) {
  return run.periodStart.slice(0, 7)
}

function maskBankAccount(accountNumber: string | null) {
  if (!accountNumber) {
    return 'Not set'
  }

  return `Ending ${accountNumber.slice(-4)}`
}

function getDownloadFileName(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename="([^"]+)"/)

  return match?.[1] ?? fallback
}

function getPayrollLineAdjustmentTotals(line: PayrollRunLine) {
  return (line.adjustments ?? []).reduce(
    (totals, adjustment) => {
      if (adjustment.componentType === 'earning') {
        totals.earnings += adjustment.amount
      } else if (adjustment.componentType === 'deduction') {
        totals.deductions += adjustment.amount
      } else {
        totals.reimbursements += adjustment.amount
      }

      return totals
    },
    { deductions: 0, earnings: 0, reimbursements: 0 },
  )
}

function isPayrollRole(role: AppRole) {
  return role === 'owner' || role === 'admin' || role === 'hr' || role === 'finance'
}

function isPayrollApprovalRole(role: AppRole) {
  return role === 'owner' || role === 'admin' || role === 'finance'
}

function isHrRole(role: AppRole) {
  return role === 'owner' || role === 'admin' || role === 'hr'
}

function isLeaveApproverRole(role: AppRole) {
  return role === 'owner' || role === 'admin' || role === 'hr' || role === 'manager'
}

const invitationRoleLabels: Record<InvitationFormState['role'], string> = {
  admin: 'Administrator',
  employee: 'Employee',
  finance: 'Finance',
  hr: 'People operations',
  manager: 'Manager',
}

function getAssignableInvitationRoles(roles: AppRole[]): InvitationFormState['role'][] {
  if (roles.includes('owner')) {
    return ['admin', 'hr', 'finance', 'manager', 'employee']
  }

  if (roles.includes('admin')) {
    return ['hr', 'finance', 'manager', 'employee']
  }

  return ['manager', 'employee']
}

function getTodayInputValue(timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.year}-${values.month}-${values.day}`
}

function getCurrentPeriodMonth(timeZone = 'UTC') {
  return `${getTodayInputValue(timeZone).slice(0, 7)}-01`
}

function toMonthInputValue(periodMonth: string) {
  return periodMonth.slice(0, 7)
}

function fromMonthInputValue(month: string) {
  return `${month}-01`
}

function getCalendarDaysInPeriod(periodMonth: string) {
  const [year, monthIndex] = periodMonth.split('-').map(Number)

  return new Date(Date.UTC(year, monthIndex, 0)).getUTCDate()
}

function getDefaultDepartmentId(masterData: HrMasterData) {
  return masterData.departments.find((department) => department.isActive)?.id ?? masterData.departments[0]?.id ?? ''
}

function getDefaultWorkLocationId(masterData: HrMasterData) {
  return masterData.locations.find((location) => location.isActive)?.id ?? masterData.locations[0]?.id ?? ''
}

function createEmptyEmployeeForm(masterData: HrMasterData): EmployeeFormState {
  return {
    annualCompensation: '',
    bankAccountHolderName: '',
    bankAccountNumber: '',
    bankRoutingCode: '',
    bankName: '',
    code: '',
    departmentId: getDefaultDepartmentId(masterData),
    fullName: '',
    joiningDate: getTodayInputValue(),
    role: '',
    status: 'draft',
    workEmail: '',
    workLocationId: getDefaultWorkLocationId(masterData),
  }
}

function createEmployeeFormFromRecord(employee: HrEmployee): EmployeeFormState {
  return {
    annualCompensation: String(employee.annualCompensation),
    bankAccountHolderName: employee.bankAccountHolderName ?? '',
    bankAccountNumber: employee.bankAccountNumber ?? '',
    bankRoutingCode: employee.bankRoutingCode ?? '',
    bankName: employee.bankName ?? '',
    code: employee.code,
    departmentId: employee.departmentId ?? '',
    fullName: employee.fullName,
    joiningDate: employee.joiningDate,
    role: employee.role,
    status: employee.status,
    workEmail: employee.workEmail ?? '',
    workLocationId: employee.workLocationId ?? '',
  }
}

function createEmptyLeaveForm(): LeaveFormState {
  const today = getTodayInputValue()

  return {
    endDate: today,
    leaveType: 'casual',
    reason: '',
    startDate: today,
  }
}

function getDefaultPayableHours(status: AttendanceStatus) {
  if (status === 'half_day') {
    return '4'
  }

  if (status === 'absent' || status === 'unpaid_leave') {
    return '0'
  }

  return '8'
}

function createEmptyAttendanceForm(employeeId = ''): AttendanceFormState {
  return {
    attendanceStatus: 'present',
    employeeId,
    notes: '',
    overtimeHours: '0',
    payableHours: '8',
    workDate: getTodayInputValue(),
  }
}

function createEmptyHolidayForm(): HolidayFormState {
  return {
    holidayDate: getTodayInputValue(),
    name: '',
  }
}

function createEmptyPayrollAdjustmentForm(employeeId = ''): PayrollAdjustmentFormState {
  return {
    amount: '',
    employeeId,
    notes: '',
    componentType: 'earning',
    ...payrollAdjustmentDefaults.earning,
  }
}

function getEmployeeProfileHash(employeeId: string) {
  return `#employee/${encodeURIComponent(employeeId)}`
}

function getEmployeeIdFromHash() {
  if (typeof window === 'undefined') {
    return null
  }

  const match = window.location.hash.match(/^#employee\/(.+)$/)

  return match ? decodeURIComponent(match[1]) : null
}

function getWorkspaceSectionFromHash(): WorkspaceSection | null {
  if (typeof window === 'undefined') {
    return null
  }

  const value = window.location.hash.slice(1)

  return isWorkspaceSection(value) ? value : null
}

function getNoticeTone(message: string): StatusTone {
  const normalized = message.toLowerCase()

  if (/(unable|invalid|failed|error|forbidden|not found|already exists)/.test(normalized)) {
    return 'danger'
  }

  if (/(required|missing|locked|pending|different approver|different finalizer)/.test(normalized)) {
    return 'warning'
  }

  return 'success'
}

function getFieldErrorFromMessage(message: string): FieldErrors {
  const normalized = message.toLowerCase()

  if (normalized.includes('employee code')) {
    return { employeeCode: message }
  }

  if (normalized.includes('department name')) {
    return { departmentName: message }
  }

  if (normalized.includes('location name')) {
    return { locationName: message }
  }

  return {}
}

function wait(durationMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs))
}

function AuthLoadingScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--vf-surface)] px-4 text-[var(--vf-navy)]">
      <section className="w-full max-w-sm rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--vf-navy)] text-white">
            <BrandLogo inverse showName={false} />
          </div>
          <div>
            <p className="text-sm font-semibold">VetanFlow</p>
            <p className="text-xs text-neutral-500">Loading secure session</p>
          </div>
        </div>
      </section>
    </main>
  )
}

function SignInScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!supabase) {
      return
    }

    setError('')
    setIsSubmitting(true)

    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined)
    clearLocalSupabaseAuthStorage()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    onSignedIn()
  }

  return (
    <main className="min-h-dvh bg-[var(--vf-surface)] text-[var(--vf-navy)]">
      <div className="grid min-h-dvh lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex items-center justify-center border-r border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-6 py-10">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-6 shadow-sm"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--vf-navy)] text-white">
                <BrandLogo inverse showName={false} />
              </div>
              <div>
                <p className="text-sm font-semibold">VetanFlow</p>
                <p className="text-xs text-neutral-500">Payroll operations</p>
              </div>
            </div>

            <a className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700" href="/">
              ← Back to VetanFlow overview
            </a>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-normal">Sign in</h1>
              <p className="text-sm leading-6 text-neutral-500">Use your invited work account.</p>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Email</span>
                <span className="relative mt-2 block">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    autoComplete="email"
                    className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] pl-10 pr-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    type="email"
                    value={email}
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-neutral-800">Password</span>
                <span className="relative mt-2 block">
                  <KeyRound
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    autoComplete="current-password"
                    className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] pl-10 pr-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </span>
              </label>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              <LogIn size={17} aria-hidden="true" />
              {isSubmitting ? 'Signing in' : 'Sign in'}
            </button>
          </form>
        </section>

        <section className="hidden items-center bg-[var(--vf-navy)] px-10 py-12 text-white lg:flex">
          <div className="max-w-xl">
            <p className="text-sm font-medium text-[var(--vf-cream)]">July 2026 payroll</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal">Secure payroll operations</h2>
            <div className="mt-8 grid gap-3">
              {['Role-controlled access', 'Audit-ready employee data', 'Controlled payroll workflow'].map(
                (item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-[color:rgba(255,250,240,0.05)] p-4">
                    <ShieldCheck size={19} className="text-[var(--vf-cream)]" aria-hidden="true" />
                    <p className="text-sm font-medium">{item}</p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function AccountSwitchScreen({
  onContinue,
  onUseAnotherAccount,
  session,
}: {
  onContinue: () => void
  onUseAnotherAccount: () => Promise<void>
  session: Session
}) {
  const [isSwitching, setIsSwitching] = useState(false)

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--vf-surface)] px-4 text-[var(--vf-navy)]">
      <section className="w-full max-w-md rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-6 shadow-lg">
        <BrandLogo />
        <p className="mt-8 text-xs font-semibold uppercase text-[var(--vf-primary)]">Active session</p>
        <h1 className="mt-2 text-2xl font-semibold">Choose how to continue</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--vf-text-muted)]">
          This browser is currently signed in as <strong className="font-semibold text-[var(--vf-navy)]">{session.user.email}</strong>.
        </p>
        <div className="mt-6 grid gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--vf-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-primary-hover)]"
            onClick={onContinue}
            type="button"
          >
            <LogIn size={17} aria-hidden="true" />
            Continue to this workspace
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border-strong)] px-4 text-sm font-semibold transition hover:bg-[var(--vf-primary-soft)] disabled:opacity-60"
            disabled={isSwitching}
            onClick={() => {
              setIsSwitching(true)
              void onUseAnotherAccount().finally(() => setIsSwitching(false))
            }}
            type="button"
          >
            <UserRoundCog size={17} aria-hidden="true" />
            {isSwitching ? 'Ending local session' : 'Use another account'}
          </button>
        </div>
        <a className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--vf-primary)]" href="/">
          Back to VetanFlow overview
        </a>
      </section>
    </main>
  )
}

type EmployeePhotoUploadControlProps = {
  employee: HrEmployee | null
  isUploading: boolean
  onUpload: (employeeId: string, file: File) => Promise<void>
  tone?: 'dark' | 'light'
}

function EmployeePhotoUploadControl({
  employee,
  isUploading,
  onUpload,
  tone = 'light',
}: EmployeePhotoUploadControlProps) {
  const isDark = tone === 'dark'
  const inputId = `employee-photo-${employee?.id ?? tone}`
  const buttonClass = isDark
    ? 'border-[color:rgba(234,241,255,0.28)] bg-[color:rgba(234,241,255,0.12)] text-[var(--vf-cream)] hover:bg-[color:rgba(234,241,255,0.18)]'
    : 'border-[color:var(--vf-border)] bg-[var(--vf-paper)] text-[var(--vf-navy)] hover:bg-[var(--vf-cream)]'
  const helperClass = isDark ? 'text-[color:rgba(234,241,255,0.68)]' : 'text-neutral-500'
  const disabled = !employee || isUploading

  return (
    <div className="space-y-2">
      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        id={inputId}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0] ?? null
          event.currentTarget.value = ''

          if (!employee || !file) {
            return
          }

          void onUpload(employee.id, file)
        }}
        type="file"
      />
      <label
        aria-disabled={disabled}
        className={`inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition ${buttonClass} ${
          disabled ? 'pointer-events-none opacity-60' : ''
        }`}
        htmlFor={inputId}
      >
        <Camera size={17} aria-hidden="true" />
        {isUploading ? 'Uploading photo' : employee?.photoUrl ? 'Replace photo' : 'Upload photo'}
      </label>
      <p className={`text-xs ${helperClass}`}>JPG, PNG, WebP up to 2 MB</p>
    </div>
  )
}

type EmployeeSelfServiceProps = {
  canSignOut: boolean
  dataSourceLabel: string
  employee: HrEmployee | null
  isDownloadingIdCard: boolean
  isUploadingPhoto: boolean
  isSubmitting: boolean
  leaveForm: LeaveFormState
  leaveRequests: LeaveRequest[]
  leaveState: 'loading' | 'ready' | 'error'
  masterData: HrMasterData
  notice: string
  onCancelLeave: (request: LeaveRequest) => Promise<void>
  onIdCardDownload: (employeeId: string) => Promise<void>
  onLeaveFormChange: (form: LeaveFormState | ((current: LeaveFormState) => LeaveFormState)) => void
  onLeaveSubmit: (event: FormEvent<HTMLFormElement>, employeeId: string | null) => Promise<void>
  onPayslipDownload: (payslipId: string) => Promise<void>
  onPhotoUpload: (employeeId: string, file: File) => Promise<void>
  onRefresh: () => void
  onSignOut: () => Promise<void> | void
  payslipState: 'loading' | 'ready' | 'error'
  payslips: PayslipPortalItem[]
  salaryHistory: SalaryRevision[]
}

function EmployeeSelfService({
  canSignOut,
  dataSourceLabel,
  employee,
  isDownloadingIdCard,
  isUploadingPhoto,
  isSubmitting,
  leaveForm,
  leaveRequests,
  leaveState,
  masterData,
  notice,
  onCancelLeave,
  onIdCardDownload,
  onLeaveFormChange,
  onLeaveSubmit,
  onPayslipDownload,
  onPhotoUpload,
  onRefresh,
  onSignOut,
  payslipState,
  payslips,
  salaryHistory,
}: EmployeeSelfServiceProps) {
  const organizationCurrency = masterData.organization?.currencyCode ?? defaultCurrencyCode
  const organizationLocale = masterData.organization?.locale ?? defaultLocale
  const formatCurrency = (value: number) =>
    formatCurrencyValue(value, organizationCurrency, organizationLocale)
  const formatDate = (value: string) => formatDateValue(value, organizationLocale)
  const latestSalary = salaryHistory[0]
  const latestPayslip = payslips[0]
  const monthlyCompensation = employee ? employee.annualCompensation / 12 : 0
  const documentItems = [
    <span key="profile">Profile</span>,
    <span key="salary">Salary</span>,
    <span key="payslip">Payslip</span>,
  ]

  return (
    <main className="min-h-dvh bg-[var(--vf-surface)] text-[var(--vf-navy)]">
      <div className="grid min-h-dvh lg:grid-cols-[320px_1fr]">
        <aside className="hidden bg-[var(--vf-navy)] px-6 py-6 text-[var(--vf-cream)] lg:block lg:min-h-dvh">
          <div className="flex items-center gap-3">
            <BrandLogo inverse />
            <span className="sr-only">Employee self-service</span>
          </div>

          <EmployeeIdCard
            className="mt-10"
            employee={employee}
            isDownloading={isDownloadingIdCard}
            locale={organizationLocale}
            onDownload={onIdCardDownload}
            organizationName={masterData.organization?.name}
            tone="dark"
          />
          <div className="mt-4">
            <EmployeePhotoUploadControl
              employee={employee}
              isUploading={isUploadingPhoto}
              onUpload={onPhotoUpload}
              tone="dark"
            />
          </div>

          <nav aria-label="Employee navigation" className="mt-6 space-y-2">
            {[
              { href: '#employee-overview', icon: FileText, label: 'Overview' },
              { href: '#employee-profile', icon: ShieldCheck, label: 'Profile & documents' },
              { href: '#employee-pay', icon: WalletCards, label: 'Pay history' },
              { href: '#employee-leave', icon: CalendarCheck, label: 'Leave requests' },
            ].map((item) => {
              const Icon = item.icon

              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 text-sm font-medium text-white/75 transition hover:border-white/15 hover:bg-white/10 hover:text-white"
                >
                  <Icon size={17} aria-hidden="true" />
                  {item.label}
                </a>
              )
            })}
          </nav>
        </aside>

        <section id="employee-self-service" className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-[color:var(--vf-border)] bg-white/95 px-4 py-4 backdrop-blur-md md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 lg:hidden">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--vf-navy)] text-white">
                    <Banknote size={16} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold">VetanFlow</p>
                </div>
                <p className="text-sm font-medium text-[var(--vf-brown)]">{dataSourceLabel}</p>
                <h2 className="text-2xl font-semibold tracking-normal md:text-3xl">My payroll workspace</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {canSignOut ? (
                  <a
                    className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-4 text-sm font-semibold transition hover:bg-[var(--vf-cream)]"
                    href="/login"
                  >
                    <UserRoundCog size={17} aria-hidden="true" />
                    Switch account
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-4 text-sm font-semibold transition hover:bg-[var(--vf-cream)]"
                >
                  <RefreshCw size={17} aria-hidden="true" />
                  Refresh
                </button>
                {canSignOut ? (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[var(--vf-navy)] px-4 text-sm font-semibold text-[var(--vf-cream)] transition hover:bg-[#12395d]"
                  >
                    <LogOut size={17} aria-hidden="true" />
                    Sign out
                  </button>
                ) : null}
              </div>
            </div>
            <label className="mt-4 block lg:hidden">
              <span className="sr-only">Employee workspace section</span>
              <select
                aria-label="Employee workspace section"
                className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--vf-navy)] outline-none focus:border-[var(--vf-primary)] focus:ring-3 focus:ring-[var(--vf-focus)]"
                defaultValue="employee-overview"
                onChange={(event) => {
                  window.location.hash = event.target.value
                }}
              >
                <option value="employee-overview">Overview</option>
                <option value="employee-profile">Profile & documents</option>
                <option value="employee-pay">Pay history</option>
                <option value="employee-leave">Leave requests</option>
              </select>
            </label>
          </header>

          <div className="space-y-6 px-4 py-6 md:px-8">
            {notice ? (
              <p
                className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                  getNoticeTone(notice) === 'danger'
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : getNoticeTone(notice) === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
                role="status"
              >
                {notice}
              </p>
            ) : null}

            <section id="employee-overview" className="grid scroll-mt-28 gap-4 md:grid-cols-3">
              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <p className="text-sm text-[color:rgba(10,41,71,0.66)]">Monthly compensation</p>
                <p className="tabular mt-2 text-2xl font-semibold">{formatCurrency(Math.round(monthlyCompensation))}</p>
                <p className="mt-4 text-sm font-medium text-[var(--vf-brown)]">
                  {latestSalary ? `Revised ${formatDate(latestSalary.effectiveFrom)}` : `Annual ${formatCurrency(employee?.annualCompensation ?? 0)}`}
                </p>
              </article>
              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <p className="text-sm text-[color:rgba(10,41,71,0.66)]">Current status</p>
                <p className="mt-2 text-2xl font-semibold">{employee ? formatStatus(employee.status) : 'Not set'}</p>
                <p className="mt-4 text-sm font-medium text-[var(--vf-brown)]">{employee?.department ?? 'Team pending'}</p>
              </article>
              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <p className="text-sm text-[color:rgba(10,41,71,0.66)]">Next document</p>
                <p className="mt-2 text-2xl font-semibold">
                  {latestPayslip ? formatDate(latestPayslip.periodStart) : 'Payslip'}
                </p>
                <p className="mt-4 text-sm font-medium text-[var(--vf-brown)]">
                  {latestPayslip
                    ? `Net ${formatCurrency(Math.round(latestPayslip.netPay))}`
                    : 'Available after payroll finalization'}
                </p>
              </article>
            </section>

            <div className="lg:hidden">
              <EmployeeIdCard
                employee={employee}
                isDownloading={isDownloadingIdCard}
                locale={organizationLocale}
                onDownload={onIdCardDownload}
                organizationName={masterData.organization?.name}
              />
            </div>

            <section id="employee-profile" className="grid scroll-mt-28 gap-6 xl:grid-cols-[1fr_360px]">
              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Profile</h2>
                    <p className="mt-1 text-sm text-[color:rgba(10,41,71,0.62)]">
                      Your HR master data visibility is limited to your own record.
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--vf-cream)] text-[var(--vf-brown)]">
                    <ShieldCheck size={19} aria-hidden="true" />
                  </div>
                </div>

                {employee ? (
                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      ['Employee code', employee.code],
                      ['Email', employee.workEmail ?? 'Not set'],
                      ['Designation', employee.role],
                      ['Department', employee.department],
                      ['Location', employee.location],
                      ['Joining date', formatDate(employee.joiningDate)],
                      ['Bank account', maskBankAccount(employee.bankAccountNumber)],
                      ['Routing code', employee.bankRoutingCode ?? 'Not set'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-[color:rgba(231,235,240,0.42)] p-4">
                        <dt className="text-sm text-[color:rgba(10,41,71,0.6)]">{label}</dt>
                        <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="mt-6 text-sm text-[color:rgba(10,41,71,0.62)]">No employee profile is linked yet.</p>
                )}
              </article>

              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-navy)] p-5 text-[var(--vf-cream)] shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Document folder</h2>
                    <p className="mt-1 text-sm text-[color:rgba(234,241,255,0.72)]">Profile, compensation, and payroll documents</p>
                  </div>
                  <Folder color="#1D5FD1" items={documentItems} size={0.72} />
                </div>
                <div className="mt-6 grid gap-2">
                  {[
                    'Profile snapshot',
                    'Compensation revision letter',
                    `${payslips.length} payslip${payslips.length === 1 ? '' : 's'}`,
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex min-h-11 items-center justify-between rounded-lg border border-white/10 bg-[color:rgba(255,250,240,0.05)] px-3"
                    >
                      <p className="text-sm font-medium">{item}</p>
                      <FileText size={16} className="text-[color:rgba(234,241,255,0.62)]" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section id="employee-pay" className="grid scroll-mt-28 gap-6 xl:grid-cols-2">
              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Salary history</h2>
                  <Clock3 size={19} className="text-[var(--vf-brown)]" aria-hidden="true" />
                </div>
                <div className="mt-5 space-y-3">
                  {salaryHistory.length ? (
                    salaryHistory.map((revision) => (
                      <div key={revision.id} className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="tabular text-sm font-semibold">{formatCurrency(revision.annualCompensation)}</p>
                          <p className="text-xs text-[color:rgba(10,41,71,0.62)]">{formatDate(revision.effectiveFrom)}</p>
                        </div>
                        <p className="mt-2 text-sm text-[color:rgba(10,41,71,0.68)]">{revision.reason}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[color:rgba(10,41,71,0.62)]">No salary revision is visible yet.</p>
                  )}
                </div>
              </article>

              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Payslip archive</h2>
                    <p className="mt-1 text-sm text-[color:rgba(10,41,71,0.62)]">
                      Finalized payroll documents visible to your account.
                    </p>
                  </div>
                  <FileText size={19} className="text-[var(--vf-brown)]" aria-hidden="true" />
                </div>

                <div className="mt-5 space-y-3">
                  {payslipState === 'loading' ? (
                    <p className="text-sm text-[color:rgba(10,41,71,0.62)]">Loading payslips.</p>
                  ) : payslips.length ? (
                    payslips.map((payslip) => (
                      <div key={payslip.id} className="rounded-lg border border-[color:var(--vf-border)] p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold">
                              {formatDate(payslip.periodStart)} to {formatDate(payslip.periodEnd)}
                            </p>
                            <p className="mt-1 text-sm text-[color:rgba(10,41,71,0.66)]">
                              Published {payslip.publishedAt ? formatDate(payslip.publishedAt) : 'pending'}
                            </p>
                          </div>
                          <StatusBadge tone={getPayrollStatusTone(payslip.runStatus)}>
                            {formatPayrollRunStatus(payslip.runStatus)}
                          </StatusBadge>
                        </div>
                        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                          {[
                            ['Gross', formatCurrency(Math.round(payslip.grossPay))],
                            ['Deductions', formatCurrency(Math.round(payslip.totalDeductions))],
                            ['Net pay', formatCurrency(Math.round(payslip.netPay))],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-lg bg-[color:rgba(231,235,240,0.42)] p-3">
                              <dt className="text-xs text-[color:rgba(10,41,71,0.58)]">{label}</dt>
                              <dd className="tabular mt-1 text-sm font-semibold">{value}</dd>
                            </div>
                          ))}
                        </dl>
                        <button
                          type="button"
                          onClick={() => void onPayslipDownload(payslip.id)}
                          disabled={isSubmitting}
                          className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--vf-navy)] px-4 text-sm font-semibold text-[var(--vf-cream)] transition hover:bg-[#12395d] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Download size={16} aria-hidden="true" />
                          Download
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[color:rgba(10,41,71,0.62)]">
                      Finalized payslips will appear here after payroll publishes them.
                    </p>
                  )}
                </div>
              </article>

              <article id="employee-leave" className="scroll-mt-28 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Leave requests</h2>
                  <CalendarCheck size={19} className="text-[var(--vf-brown)]" aria-hidden="true" />
                </div>
                <form
                  onSubmit={(event) => void onLeaveSubmit(event, employee?.id ?? null)}
                  className="mt-5 grid gap-3 sm:grid-cols-2"
                >
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-800">Leave type</span>
                    <select
                      className={formControlClass}
                      onChange={(event) =>
                        onLeaveFormChange((current) => ({
                          ...current,
                          leaveType: event.target.value as LeaveFormState['leaveType'],
                        }))
                      }
                      value={leaveForm.leaveType}
                    >
                      {leaveTypeOptions.map((leaveType) => (
                        <option key={leaveType} value={leaveType}>
                          {formatLeaveType(leaveType)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-800">Start date</span>
                    <input
                      className={formControlClass}
                      onChange={(event) =>
                        onLeaveFormChange((current) => ({ ...current, startDate: event.target.value }))
                      }
                      required
                      type="date"
                      value={leaveForm.startDate}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-neutral-800">End date</span>
                    <input
                      className={formControlClass}
                      onChange={(event) =>
                        onLeaveFormChange((current) => ({ ...current, endDate: event.target.value }))
                      }
                      required
                      type="date"
                      value={leaveForm.endDate}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Reason</span>
                    <input
                      className={formControlClass}
                      onChange={(event) =>
                        onLeaveFormChange((current) => ({ ...current, reason: event.target.value }))
                      }
                      placeholder="Add a short note"
                      required
                      value={leaveForm.reason}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isSubmitting || !employee}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                  >
                    <Send size={17} aria-hidden="true" />
                    Submit request
                  </button>
                </form>

                <div className="mt-5 space-y-3">
                  {leaveState === 'loading' ? (
                    <p className="text-sm text-[color:rgba(10,41,71,0.62)]">Loading leave requests.</p>
                  ) : leaveRequests.length ? (
                    leaveRequests.map((request) => (
                      <div key={request.id} className="rounded-lg border border-[color:var(--vf-border)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold">{formatLeaveType(request.leaveType)}</p>
                          <StatusBadge tone={getLeaveStatusTone(request.status)}>
                            {formatLeaveStatus(request.status)}
                          </StatusBadge>
                        </div>
                        <p className="mt-2 text-sm text-[color:rgba(10,41,71,0.68)]">
                          {formatDate(request.startDate)} to {formatDate(request.endDate)} · {request.totalDays} days
                        </p>
                        <p className="mt-2 text-sm text-[color:rgba(10,41,71,0.68)]">{request.reason}</p>
                        {request.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => void onCancelLeave(request)}
                            disabled={isSubmitting}
                            className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X size={14} aria-hidden="true" />
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[color:rgba(10,41,71,0.62)]">No leave requests yet.</p>
                  )}
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

function WorkspaceApp({ forceAccountChoice = false }: { forceAccountChoice?: boolean }) {
  const [session, setSession] = useState<Session | null>(null)
  const [showAccountChoice, setShowAccountChoice] = useState(forceAccountChoice)
  const [authState, setAuthState] = useState<'checking' | 'ready'>(
    isSupabaseConfigured ? 'checking' : 'ready',
  )
  const [masterData, setMasterData] = useState<HrMasterData>(fallbackMasterData)
  const [leaveData, setLeaveData] = useState<LeaveDashboard>(fallbackLeaveDashboard)
  const [attendancePeriodMonth, setAttendancePeriodMonth] = useState(() => getCurrentPeriodMonth())
  const [attendanceData, setAttendanceData] = useState<AttendanceDashboard>(() =>
    createFallbackAttendanceDashboard(getCurrentPeriodMonth()),
  )
  const [payrollData, setPayrollData] = useState<PayrollDashboard>(fallbackPayrollDashboard)
  const [payslipData, setPayslipData] = useState<PayslipPortal>({ payslips: [] })
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([])
  const [selectedPayrollRun, setSelectedPayrollRun] = useState<PayrollRunDetail | null>(null)
  const [payrollRunPeriodFilter, setPayrollRunPeriodFilter] = useState('all')
  const [dataState, setDataState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [leaveState, setLeaveState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attendanceState, setAttendanceState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [payrollState, setPayrollState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [payslipState, setPayslipState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [accessState, setAccessState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [dataSource, setDataSource] = useState<'demo' | 'fixture' | 'supabase'>('demo')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(fallbackMasterData.employees[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idCardDownloadEmployeeId, setIdCardDownloadEmployeeId] = useState<string | null>(null)
  const [idCardPrintJob, setIdCardPrintJob] = useState<{
    employee: HrEmployee
    stage: 'attaching' | 'printing' | 'ready'
  } | null>(null)
  const [photoUploadEmployeeId, setPhotoUploadEmployeeId] = useState<string | null>(null)
  const [departmentForm, setDepartmentForm] = useState({ isActive: true, name: '' })
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(null)
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null)
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(() =>
    createEmptyEmployeeForm(fallbackMasterData),
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [routeEmployeeId, setRouteEmployeeId] = useState<string | null>(() => getEmployeeIdFromHash())
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(
    () => getWorkspaceSectionFromHash() ?? 'overview',
  )
  const [auditEntityFilter, setAuditEntityFilter] = useState<AuditEntityFilter>('all')
  const [auditEmployeeFilter, setAuditEmployeeFilter] = useState('all')
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [locationForm, setLocationForm] = useState({
    city: '',
    isActive: true,
    name: '',
    state: '',
  })
  const [leaveForm, setLeaveForm] = useState<LeaveFormState>(() => createEmptyLeaveForm())
  const [attendanceForm, setAttendanceForm] = useState<AttendanceFormState>(() =>
    createEmptyAttendanceForm(fallbackMasterData.employees[0]?.id ?? ''),
  )
  const [holidayForm, setHolidayForm] = useState<HolidayFormState>(() => createEmptyHolidayForm())
  const [invitationForm, setInvitationForm] = useState<InvitationFormState>({
    email: '',
    fullName: '',
    role: 'employee',
  })
  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>({
    countryCode: fallbackMasterData.organization?.countryCode ?? 'US',
    currencyCode: fallbackMasterData.organization?.currencyCode ?? 'USD',
    locale: fallbackMasterData.organization?.locale ?? 'en-US',
    name: fallbackMasterData.organization?.name ?? 'VetanFlow Labs',
    timezone: fallbackMasterData.organization?.timezone ?? 'UTC',
  })
  const [payrollAdjustmentForm, setPayrollAdjustmentForm] = useState<PayrollAdjustmentFormState>(() =>
    createEmptyPayrollAdjustmentForm(),
  )
  const [salaryForm, setSalaryForm] = useState({
    annualCompensation: '',
    effectiveFrom: getTodayInputValue(),
    reason: 'Compensation revision',
  })
  const organizationCurrency = masterData.organization?.currencyCode ?? defaultCurrencyCode
  const organizationLocale = masterData.organization?.locale ?? defaultLocale
  const organizationFormCountry = getCountryOption(organizationForm.countryCode)
  const organizationPreferencePreview = {
    currency: formatCurrencyValue(125_000, organizationForm.currencyCode, organizationForm.locale),
    date: new Intl.DateTimeFormat(organizationForm.locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date()),
    time: new Intl.DateTimeFormat(organizationForm.locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: organizationForm.timezone,
      timeZoneName: 'short',
    }).format(new Date()),
  }
  const formatCurrency = (value: number) =>
    formatCurrencyValue(value, organizationCurrency, organizationLocale)
  const formatDate = (value: string) => formatDateValue(value, organizationLocale)
  const formatMonth = useCallback(
    (value: string) => formatMonthValue(value, organizationLocale),
    [organizationLocale],
  )
  const sessionAccessToken = session?.access_token ?? null

  useEffect(() => {
    if (!supabase) {
      return
    }

    let isActive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) {
        return
      }

      setSession(data.session)
      setAuthState('ready')
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession)
      setAuthState('ready')
    })

    return () => {
      isActive = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !sessionAccessToken) {
      return
    }

    setMasterData(emptyAuthenticatedMasterData)
    setLeaveData(emptyAuthenticatedLeaveDashboard)
    setAttendanceData(createEmptyAuthenticatedAttendanceDashboard())
    setPayrollData(emptyAuthenticatedPayrollDashboard)
    setPayslipData({ payslips: [] })
    setOrganizationMembers([])
    setSelectedEmployeeId('')
    setDataSource('supabase')
    setDataState('loading')
    setLeaveState('loading')
    setAttendanceState('loading')
    setPayrollState('loading')
    setPayslipState('loading')
    setAccessState('idle')
  }, [sessionAccessToken])

  useEffect(() => {
    if (!masterData.organization) {
      return
    }

    setOrganizationForm({
      countryCode: masterData.organization.countryCode,
      currencyCode: masterData.organization.currencyCode,
      locale: masterData.organization.locale,
      name: masterData.organization.name,
      timezone: masterData.organization.timezone,
    })
  }, [masterData.organization])

  useEffect(() => {
    if (!masterData.organization?.timezone) {
      return
    }

    setAttendancePeriodMonth(getCurrentPeriodMonth(masterData.organization.timezone))
  }, [masterData.organization?.timezone])

  useEffect(() => {
    function handleHashChange() {
      const employeeId = getEmployeeIdFromHash()
      const workspaceSection = getWorkspaceSectionFromHash()

      setRouteEmployeeId(employeeId)

      if (employeeId) {
        setActiveSection('employees')
      } else if (workspaceSection) {
        setActiveSection(workspaceSection)
      }
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    if (!selectedPayrollRun?.lines.length) {
      return
    }

    const employeeIds = new Set(selectedPayrollRun.lines.map((line) => line.employeeId))
    const firstEmployeeId = selectedPayrollRun.lines[0].employeeId

    setPayrollAdjustmentForm((current) =>
      employeeIds.has(current.employeeId) ? current : { ...current, employeeId: firstEmployeeId },
    )
  }, [selectedPayrollRun])

  const loadMasterData = useCallback(async () => {
    if (isSupabaseConfigured && !session) {
      return
    }

    setDataState('loading')

    try {
      const headers: Record<string, string> = {}

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/hr/master-data`, { headers })

      if (!response.ok) {
        throw new Error(`HR API returned ${response.status}`)
      }

      const payload = (await response.json()) as MasterDataResponse

      setMasterData(withDevelopmentFixtureRole(payload.data))
      setDataSource(payload.meta?.source ?? 'supabase')
      setDataState('ready')
    } catch {
      setMasterData(
        isSupabaseConfigured && session?.access_token
          ? emptyAuthenticatedMasterData
          : withDevelopmentFixtureRole(fallbackMasterData),
      )
      setDataSource(isSupabaseConfigured && session?.access_token ? 'supabase' : 'demo')
      setDataState('error')
    }
  }, [session])

  const loadLeaveData = useCallback(async () => {
    if (isSupabaseConfigured && !session) {
      return
    }

    setLeaveState('loading')

    try {
      const headers: Record<string, string> = {}

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/leave/dashboard`, { headers })

      if (!response.ok) {
        throw new Error(`Leave API returned ${response.status}`)
      }

      const payload = (await response.json()) as LeaveDashboardResponse

      setLeaveData(withDevelopmentFixtureRole(payload.data))
      setLeaveState('ready')
    } catch {
      setLeaveData(
        isSupabaseConfigured && session?.access_token
          ? emptyAuthenticatedLeaveDashboard
          : withDevelopmentFixtureRole(fallbackLeaveDashboard),
      )
      setLeaveState('error')
    }
  }, [session])

  const loadAttendanceData = useCallback(async () => {
    if (isSupabaseConfigured && !session) {
      return
    }

    setAttendanceState('loading')

    try {
      const headers: Record<string, string> = {}

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const params = new URLSearchParams({ periodMonth: attendancePeriodMonth })
      const response = await fetch(`${apiBaseUrl}/api/attendance/dashboard?${params.toString()}`, { headers })

      if (!response.ok) {
        throw new Error(`Attendance API returned ${response.status}`)
      }

      const payload = (await response.json()) as AttendanceDashboardResponse

      setAttendanceData(withDevelopmentFixtureRole(payload.data))
      setAttendanceState('ready')
    } catch {
      setAttendanceData(
        isSupabaseConfigured && session?.access_token
          ? createEmptyAuthenticatedAttendanceDashboard(attendancePeriodMonth)
          : withDevelopmentFixtureRole(createFallbackAttendanceDashboard(attendancePeriodMonth)),
      )
      setAttendanceState('error')
    }
  }, [attendancePeriodMonth, session])

  const loadPayrollData = useCallback(async () => {
    if (isSupabaseConfigured && !session) {
      return
    }

    setPayrollState('loading')

    try {
      const headers: Record<string, string> = {}

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/payroll/runs`, { headers })

      if (!response.ok) {
        throw new Error(`Payroll API returned ${response.status}`)
      }

      const payload = (await response.json()) as PayrollDashboardResponse

      setPayrollData(withDevelopmentFixtureRole(payload.data))
      setPayrollState('ready')
    } catch {
      setPayrollData(
        isSupabaseConfigured && session?.access_token
          ? emptyAuthenticatedPayrollDashboard
          : withDevelopmentFixtureRole(fallbackPayrollDashboard),
      )
      setPayrollState('error')
    }
  }, [session])

  const loadPayslipData = useCallback(async () => {
    if (isSupabaseConfigured && !session) {
      return
    }

    setPayslipState('loading')

    try {
      const headers: Record<string, string> = {}

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/payroll/payslips`, { headers })

      if (!response.ok) {
        throw new Error(`Payslip API returned ${response.status}`)
      }

      const payload = (await response.json()) as PayslipPortalResponse

      setPayslipData(payload.data)
      setPayslipState('ready')
    } catch {
      setPayslipData({ payslips: [] })
      setPayslipState('error')
    }
  }, [session])

  const shouldLoadAccess = masterData.currentUserRoles.some((role) =>
    ['owner', 'admin', 'hr'].includes(role),
  )
  const loadOrganizationMembers = useCallback(async () => {
    if (!isSupabaseConfigured || !session?.access_token) {
      setAccessState('idle')
      return
    }

    setAccessState('loading')

    try {
      const response = await fetch(`${apiBaseUrl}/api/invitations`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) {
        throw new Error(`Access API returned ${response.status}`)
      }

      const payload = (await response.json()) as OrganizationMembersResponse

      setOrganizationMembers(payload.data)
      setAccessState('ready')
    } catch {
      setOrganizationMembers([])
      setAccessState('error')
    }
  }, [session])

  useEffect(() => {
    void loadMasterData()
  }, [loadMasterData])

  useEffect(() => {
    void loadLeaveData()
  }, [loadLeaveData])

  useEffect(() => {
    void loadAttendanceData()
  }, [loadAttendanceData])

  useEffect(() => {
    void loadPayrollData()
  }, [loadPayrollData])

  useEffect(() => {
    void loadPayslipData()
  }, [loadPayslipData])

  useEffect(() => {
    if (shouldLoadAccess) {
      void loadOrganizationMembers()
    }
  }, [loadOrganizationMembers, shouldLoadAccess])

  useEffect(() => {
    if (routeEmployeeId && masterData.employees.some((employee) => employee.id === routeEmployeeId)) {
      setSelectedEmployeeId(routeEmployeeId)
      setActiveSection('employees')
    }
  }, [masterData.employees, routeEmployeeId])

  useEffect(() => {
    if (!masterData.employees.length) {
      setSelectedEmployeeId('')
      return
    }

    if (!masterData.employees.some((employee) => employee.id === selectedEmployeeId)) {
      setSelectedEmployeeId(masterData.employees[0].id)
    }
  }, [masterData.employees, selectedEmployeeId])

  useEffect(() => {
    setAttendanceForm((current) => {
      const candidates = attendanceData.employees.length ? attendanceData.employees : masterData.employees

      if (!candidates.length || candidates.some((employee) => employee.id === current.employeeId)) {
        return current
      }

      return { ...current, employeeId: candidates[0].id }
    })
  }, [attendanceData.employees, masterData.employees])

  useEffect(() => {
    setEmployeeForm((current) => {
      const departmentId = masterData.departments.some(
        (department) => department.id === current.departmentId && department.isActive,
      )
        ? current.departmentId
        : (masterData.departments.find((department) => department.isActive)?.id ?? masterData.departments[0]?.id ?? '')
      const workLocationId = masterData.locations.some((location) => location.id === current.workLocationId)
        ? current.workLocationId
        : (masterData.locations.find((location) => location.isActive)?.id ?? masterData.locations[0]?.id ?? '')

      if (departmentId === current.departmentId && workLocationId === current.workLocationId) {
        return current
      }

      return { ...current, departmentId, workLocationId }
    })
  }, [masterData.departments, masterData.locations])

  useEffect(() => {
    if (!editingEmployeeId) {
      return
    }

    if (!masterData.employees.some((employee) => employee.id === editingEmployeeId)) {
      setEditingEmployeeId(null)
      setEmployeeForm(createEmptyEmployeeForm(masterData))
    }
  }, [editingEmployeeId, masterData])

  useEffect(() => {
    if (editingDepartmentId && !masterData.departments.some((department) => department.id === editingDepartmentId)) {
      setEditingDepartmentId(null)
      setDepartmentForm({ isActive: true, name: '' })
    }
  }, [editingDepartmentId, masterData.departments])

  useEffect(() => {
    if (editingLocationId && !masterData.locations.some((location) => location.id === editingLocationId)) {
      setEditingLocationId(null)
      setLocationForm({ city: '', isActive: true, name: '', state: '' })
    }
  }, [editingLocationId, masterData.locations])

  async function handleSignOut() {
    await supabase?.auth.signOut({ scope: 'local' })
    clearLocalSupabaseAuthStorage()
    window.location.replace('/login')
  }

  async function handleUseAnotherAccount() {
    await supabase?.auth.signOut({ scope: 'local' })
    clearLocalSupabaseAuthStorage()
    setSession(null)
    setShowAccountChoice(false)
  }

  async function sendJson<T>(path: string, method: 'DELETE' | 'PATCH' | 'POST', body?: unknown) {
    const headers: Record<string, string> = {}

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers,
      method,
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? `Request failed with ${response.status}`)
    }

    return (await response.json().catch(() => null)) as T | null
  }

  async function postJson<T>(path: string, body: unknown) {
    return sendJson<T>(path, 'POST', body)
  }

  async function patchJson<T>(path: string, body: unknown) {
    return sendJson<T>(path, 'PATCH', body)
  }

  async function deleteJson<T>(path: string) {
    return sendJson<T>(path, 'DELETE')
  }

  async function getJson<T>(path: string) {
    const headers: Record<string, string> = {}

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${apiBaseUrl}${path}`, { headers })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? `Request failed with ${response.status}`)
    }

    return (await response.json().catch(() => null)) as T | null
  }

  async function postFormData<T>(path: string, body: FormData) {
    const headers: Record<string, string> = {}

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      body,
      headers,
      method: 'POST',
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? `Request failed with ${response.status}`)
    }

    return (await response.json().catch(() => null)) as T | null
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function showRequestError(error: unknown, fallbackMessage: string) {
    const message = error instanceof Error ? error.message : fallbackMessage
    setFieldErrors(getFieldErrorFromMessage(message))
    setNotice(message)
  }

  function handleOpenEmployeeProfile(employeeId: string) {
    setSelectedEmployeeId(employeeId)
    setActiveSection('employees')
    window.location.hash = getEmployeeProfileHash(employeeId)
  }

  function handleWorkspaceNavigate(section: WorkspaceSection) {
    setActiveSection(section)
    window.location.hash = section
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ behavior: reduceMotion ? 'auto' : 'smooth', top: 0 })
  }

  async function handleInviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!masterData.organization) {
      setNotice('Organization setup is required before inviting users')
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await postJson('/api/invitations', {
        email: invitationForm.email.trim().toLowerCase(),
        fullName: invitationForm.fullName.trim(),
        organizationId: masterData.organization.id,
        role: invitationForm.role,
      })
      setInvitationForm({ email: '', fullName: '', role: 'employee' })
      setNotice(`Invitation sent to ${invitationForm.email.trim().toLowerCase()}`)
      await loadOrganizationMembers()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to invite user')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!masterData.organization) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await patchJson('/api/hr/organization', {
        ...organizationForm,
        countryCode: organizationForm.countryCode.trim().toUpperCase(),
        currencyCode: organizationForm.currencyCode.trim().toUpperCase(),
        locale: organizationForm.locale.trim(),
        name: organizationForm.name.trim(),
        organizationId: masterData.organization.id,
        timezone: organizationForm.timezone.trim(),
      })
      setNotice('Organization settings updated')
      await loadMasterData()
    } catch (error) {
      showRequestError(error, 'Unable to update organization settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartEditDepartment(department: HrDepartment) {
    setEditingDepartmentId(department.id)
    setDepartmentForm({ isActive: department.isActive, name: department.name })
    setFieldErrors({})
    setNotice('')
  }

  function handleCancelDepartmentEdit() {
    setEditingDepartmentId(null)
    setDepartmentForm({ isActive: true, name: '' })
    clearFieldError('departmentName')
  }

  async function handleSaveDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!masterData.organization || !departmentForm.name.trim()) {
      return
    }

    setIsSubmitting(true)
    setNotice('')
    clearFieldError('departmentName')

    try {
      if (editingDepartmentId) {
        await patchJson(`/api/hr/departments/${editingDepartmentId}`, {
          isActive: departmentForm.isActive,
          name: departmentForm.name.trim(),
          organizationId: masterData.organization.id,
        })
      } else {
        await postJson('/api/hr/departments', {
          name: departmentForm.name.trim(),
          organizationId: masterData.organization.id,
        })
      }

      setDepartmentForm({ isActive: true, name: '' })
      setEditingDepartmentId(null)
      setNotice(editingDepartmentId ? 'Department updated' : 'Department added')
      await loadMasterData()
    } catch (error) {
      showRequestError(error, editingDepartmentId ? 'Unable to update department' : 'Unable to add department')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleArchiveDepartment(department: HrDepartment) {
    if (!masterData.organization || !department.isActive) {
      return
    }

    setIsSubmitting(true)
    setNotice('')
    clearFieldError('departmentName')

    try {
      await postJson(`/api/hr/departments/${department.id}/archive`, {
        organizationId: masterData.organization.id,
      })

      if (editingDepartmentId === department.id) {
        setEditingDepartmentId(null)
        setDepartmentForm({ isActive: true, name: '' })
      }

      setNotice('Department archived')
      await loadMasterData()
    } catch (error) {
      showRequestError(error, 'Unable to archive department')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartEditLocation(location: HrLocation) {
    setEditingLocationId(location.id)
    setLocationForm({
      city: location.city,
      isActive: location.isActive,
      name: location.name,
      state: location.state,
    })
    setFieldErrors({})
    setNotice('')
  }

  function handleCancelLocationEdit() {
    setEditingLocationId(null)
    setLocationForm({ city: '', isActive: true, name: '', state: '' })
    clearFieldError('locationName')
  }

  async function handleSaveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!masterData.organization || !locationForm.name.trim()) {
      return
    }

    setIsSubmitting(true)
    setNotice('')
    clearFieldError('locationName')

    try {
      const payload = {
        city: locationForm.city.trim(),
        countryCode: masterData.organization.countryCode,
        isActive: locationForm.isActive,
        name: locationForm.name.trim(),
        organizationId: masterData.organization.id,
        state: locationForm.state.trim(),
      }

      if (editingLocationId) {
        await patchJson(`/api/hr/locations/${editingLocationId}`, payload)
      } else {
        await postJson('/api/hr/locations', payload)
      }

      setLocationForm({ city: '', isActive: true, name: '', state: '' })
      setEditingLocationId(null)
      setNotice(editingLocationId ? 'Location updated' : 'Location added')
      await loadMasterData()
    } catch (error) {
      showRequestError(error, editingLocationId ? 'Unable to update location' : 'Unable to add location')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleArchiveLocation(location: HrLocation) {
    if (!masterData.organization || !location.isActive) {
      return
    }

    setIsSubmitting(true)
    setNotice('')
    clearFieldError('locationName')

    try {
      await postJson(`/api/hr/locations/${location.id}/archive`, {
        organizationId: masterData.organization.id,
      })

      if (editingLocationId === location.id) {
        setEditingLocationId(null)
        setLocationForm({ city: '', isActive: true, name: '', state: '' })
      }

      setNotice('Location archived')
      await loadMasterData()
    } catch (error) {
      showRequestError(error, 'Unable to archive location')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartEditEmployee(employee: HrEmployee) {
    setSelectedEmployeeId(employee.id)
    setEditingEmployeeId(employee.id)
    setEmployeeForm(createEmployeeFormFromRecord(employee))
    setFieldErrors({})
    setNotice('')
  }

  function handleCancelEmployeeEdit() {
    setEditingEmployeeId(null)
    setEmployeeForm(createEmptyEmployeeForm(masterData))
    clearFieldError('employeeCode')
  }

  async function handleSaveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!masterData.organization) {
      return
    }

    if (!employeeForm.departmentId || !employeeForm.workLocationId) {
      setNotice('Add a department and active work location before saving employees')
      return
    }

    setIsSubmitting(true)
    setNotice('')
    clearFieldError('employeeCode')

    const employeePayload = {
      bankAccountHolderName: employeeForm.bankAccountHolderName.trim(),
      bankAccountNumber: employeeForm.bankAccountNumber.trim(),
      bankRoutingCode: employeeForm.bankRoutingCode.trim().toUpperCase(),
      bankName: employeeForm.bankName.trim(),
      code: employeeForm.code.trim(),
      departmentId: employeeForm.departmentId,
      fullName: employeeForm.fullName.trim(),
      joiningDate: employeeForm.joiningDate,
      organizationId: masterData.organization.id,
      role: employeeForm.role.trim(),
      status: employeeForm.status,
      workEmail: employeeForm.workEmail.trim(),
      workLocationId: employeeForm.workLocationId,
    }

    try {
      const savedEmployee = editingEmployeeId
        ? await patchJson<EmployeeWriteResponse>(`/api/hr/employees/${editingEmployeeId}`, employeePayload)
        : await postJson<EmployeeWriteResponse>('/api/hr/employees', {
            ...employeePayload,
            annualCompensation: Number(employeeForm.annualCompensation),
          })

      setEditingEmployeeId(null)
      setEmployeeForm(createEmptyEmployeeForm(masterData))
      setNotice(editingEmployeeId ? 'Employee updated' : 'Employee created')
      await loadMasterData()

      if (savedEmployee?.data?.id) {
        setSelectedEmployeeId(savedEmployee.data.id)
      }
    } catch (error) {
      showRequestError(error, 'Unable to save employee')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUploadEmployeePhoto(employeeId: string, file: File) {
    if (!employeePhotoMimeTypes.has(file.type)) {
      setNotice('Upload a JPG, PNG, or WebP image')
      return
    }

    if (file.size > employeePhotoMaxBytes) {
      setNotice('Photo must be 2 MB or smaller')
      return
    }

    const formData = new FormData()
    formData.append('photo', file)

    setPhotoUploadEmployeeId(employeeId)
    setNotice('')

    try {
      await postFormData<EmployeeWriteResponse>(`/api/hr/employees/${employeeId}/photo`, formData)
      setNotice('Employee photo updated')
      await loadMasterData()
      setSelectedEmployeeId(employeeId)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to upload employee photo')
    } finally {
      setPhotoUploadEmployeeId(null)
    }
  }

  async function handleSubmitLeaveRequest(event: FormEvent<HTMLFormElement>, employeeId: string | null) {
    event.preventDefault()

    if (!leaveData.organization || !employeeId || !leaveForm.reason.trim()) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await postJson<LeaveWriteResponse>('/api/leave/requests', {
        employeeId,
        endDate: leaveForm.endDate,
        leaveType: leaveForm.leaveType,
        organizationId: leaveData.organization.id,
        reason: leaveForm.reason.trim(),
        startDate: leaveForm.startDate,
      })
      setLeaveForm(createEmptyLeaveForm())
      setNotice('Leave request submitted')
      await loadLeaveData()
    } catch (error) {
      showRequestError(error, 'Unable to submit leave request')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReviewLeaveRequest(request: LeaveRequest, decision: LeaveDecision) {
    if (!leaveData.organization) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await patchJson<LeaveWriteResponse>(`/api/leave/requests/${request.id}/review`, {
        decision,
        organizationId: leaveData.organization.id,
      })
      setNotice(decision === 'escalated' ? 'Leave request escalated to HR' : `Leave request ${decision}`)
      await loadLeaveData()
      await loadMasterData()
    } catch (error) {
      showRequestError(error, 'Unable to review leave request')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancelLeaveRequest(request: LeaveRequest) {
    if (!leaveData.organization) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await patchJson<LeaveWriteResponse>(`/api/leave/requests/${request.id}/cancel`, {
        organizationId: leaveData.organization.id,
      })
      setNotice('Leave request cancelled')
      await loadLeaveData()
    } catch (error) {
      showRequestError(error, 'Unable to cancel leave request')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveAttendanceEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!attendanceData.organization || !attendanceForm.employeeId) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await postJson<AttendanceWriteResponse<AttendanceEntry>>('/api/attendance/entries', {
        attendanceStatus: attendanceForm.attendanceStatus,
        employeeId: attendanceForm.employeeId,
        notes: attendanceForm.notes.trim(),
        organizationId: attendanceData.organization.id,
        overtimeHours: Number(attendanceForm.overtimeHours || 0),
        payableHours: Number(attendanceForm.payableHours || 0),
        workDate: attendanceForm.workDate,
      })
      setAttendanceForm((current) => ({
        ...createEmptyAttendanceForm(current.employeeId),
        workDate: current.workDate,
      }))
      setNotice('Attendance entry saved')
      await loadAttendanceData()
    } catch (error) {
      showRequestError(error, 'Unable to save attendance entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveHoliday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!attendanceData.organization || !holidayForm.name.trim()) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await postJson<AttendanceWriteResponse<AttendanceHoliday>>('/api/attendance/holidays', {
        holidayDate: holidayForm.holidayDate,
        name: holidayForm.name.trim(),
        organizationId: attendanceData.organization.id,
        region: 'GLOBAL',
      })
      setHolidayForm(createEmptyHolidayForm())
      setNotice('Holiday saved')
      await loadAttendanceData()
    } catch (error) {
      showRequestError(error, 'Unable to save holiday')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLockAttendanceMonth() {
    if (!attendanceData.organization) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await postJson<AttendanceWriteResponse<AttendanceMonthLock>>('/api/attendance/month-locks', {
        notes: 'Reviewed and locked for payroll',
        organizationId: attendanceData.organization.id,
        periodMonth: attendanceData.period.month,
      })
      setNotice('Attendance month locked')
      await loadAttendanceData()
    } catch (error) {
      showRequestError(error, 'Unable to lock attendance month')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUnlockAttendanceMonth() {
    if (!attendanceData.organization) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await postJson<AttendanceWriteResponse<AttendanceMonthLock>>('/api/attendance/month-locks/unlock', {
        notes: 'Unlocked for correction',
        organizationId: attendanceData.organization.id,
        periodMonth: attendanceData.period.month,
      })
      setNotice('Attendance month unlocked')
      await loadAttendanceData()
    } catch (error) {
      showRequestError(error, 'Unable to unlock attendance month')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleOpenPayrollRun(runId: string) {
    setIsSubmitting(true)
    setNotice('')

    try {
      const payload = await getJson<PayrollRunDetailResponse>(`/api/payroll/runs/${runId}`)

      if (payload?.data) {
        setSelectedPayrollRun(payload.data)
      }
    } catch (error) {
      showRequestError(error, 'Unable to load payroll run')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreatePayrollRun() {
    if (!attendanceData.organization) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      const payload = await postJson<PayrollRunWriteResponse>('/api/payroll/runs', {
        organizationId: attendanceData.organization.id,
        periodMonth: attendanceData.period.month,
      })

      if (payload?.data) {
        setSelectedPayrollRun(payload.data)
      }

      setNotice('Draft payroll run generated')
      await loadPayrollData()
    } catch (error) {
      showRequestError(error, 'Unable to create payroll run')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRecalculatePayrollRun(runId: string) {
    setIsSubmitting(true)
    setNotice('')

    try {
      const payload = await postJson<PayrollRunWriteResponse>(`/api/payroll/runs/${runId}/recalculate`, {})

      if (payload?.data) {
        setSelectedPayrollRun(payload.data)
      }

      setNotice('Payroll run recalculated')
      await loadPayrollData()
    } catch (error) {
      showRequestError(error, 'Unable to recalculate payroll run')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePayrollRunAction(
    runId: string,
    action: 'approve' | 'finalize' | 'submit',
    successMessage: string,
  ) {
    setIsSubmitting(true)
    setNotice('')

    try {
      const payload = await postJson<PayrollRunWriteResponse>(`/api/payroll/runs/${runId}/${action}`, {})

      if (payload?.data) {
        setSelectedPayrollRun(payload.data)
      }

      setNotice(successMessage)
      await loadPayrollData()
    } catch (error) {
      showRequestError(error, `Unable to ${action} payroll run`)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGeneratePayslips(runId: string) {
    setIsSubmitting(true)
    setNotice('')

    try {
      const payload = await postJson<PayslipGenerationResponse>(`/api/payroll/runs/${runId}/payslips`, {})
      const detail = await getJson<PayrollRunDetailResponse>(`/api/payroll/runs/${runId}`)

      if (detail?.data) {
        setSelectedPayrollRun(detail.data)
      }

      setNotice(`${payload?.data?.length ?? 0} payslip${payload?.data?.length === 1 ? '' : 's'} generated`)
      await loadPayrollData()
      await loadPayslipData()
    } catch (error) {
      showRequestError(error, 'Unable to generate payslips')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDownloadPayslip(payslipId: string) {
    setIsSubmitting(true)
    setNotice('')

    try {
      const payload = await getJson<PayslipDownloadResponse>(`/api/payroll/payslips/${payslipId}/download`)

      if (!payload?.data?.signedUrl) {
        throw new Error('Payslip download is not ready')
      }

      window.location.assign(payload.data.signedUrl)
      setNotice(`Payslip link ready for ${Math.round(payload.data.expiresInSeconds / 60)} minutes`)
    } catch (error) {
      showRequestError(error, 'Unable to download payslip')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDownloadPayrollExport(runId: string, exportType: PayrollExportType) {
    setIsSubmitting(true)
    setNotice('')

    try {
      const headers: Record<string, string> = {}

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/payroll/runs/${runId}/exports/${exportType}`, { headers })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? `Export failed with ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = getDownloadFileName(response.headers.get('content-disposition'), `${exportType}.csv`)
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setNotice(`${formatLabel(exportType)} export downloaded`)
    } catch (error) {
      showRequestError(error, 'Unable to download payroll export')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDownloadEmployeeIdCard(employeeId: string) {
    const employee = masterData.employees.find((item) => item.id === employeeId)

    setIdCardDownloadEmployeeId(employeeId)
    setNotice('')

    if (employee) {
      setIdCardPrintJob({ employee, stage: 'printing' })
    }

    try {
      const headers: Record<string, string> = {}

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      const response = await fetch(`${apiBaseUrl}/api/hr/employees/${employeeId}/id-card`, { headers })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? `ID card download failed with ${response.status}`)
      }

      const blob = await response.blob()
      setIdCardPrintJob(employee ? { employee, stage: 'attaching' } : null)
      await wait(650)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = getDownloadFileName(
        response.headers.get('content-disposition'),
        'employee-id-card.pdf',
      )
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setIdCardPrintJob(employee ? { employee, stage: 'ready' } : null)
      setNotice('Employee ID card PDF downloaded')
      await wait(700)
    } catch (error) {
      showRequestError(error, 'Unable to download employee ID card')
    } finally {
      setIdCardDownloadEmployeeId(null)
      setIdCardPrintJob(null)
    }
  }

  async function handleAddPayrollAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedPayrollRun) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      const payload = await postJson<PayrollRunWriteResponse>(
        `/api/payroll/runs/${selectedPayrollRun.id}/adjustments`,
        {
          amount: Number(payrollAdjustmentForm.amount),
          componentCode: payrollAdjustmentForm.componentCode.trim(),
          componentName: payrollAdjustmentForm.componentName.trim(),
          componentType: payrollAdjustmentForm.componentType,
          employeeId: payrollAdjustmentForm.employeeId,
          notes: payrollAdjustmentForm.notes.trim(),
          taxTreatment: payrollAdjustmentForm.taxTreatment,
        },
      )

      if (payload?.data) {
        setSelectedPayrollRun(payload.data)
      }

      setPayrollAdjustmentForm((current) => createEmptyPayrollAdjustmentForm(current.employeeId))
      setNotice('Payroll adjustment added')
      await loadPayrollData()
    } catch (error) {
      showRequestError(error, 'Unable to add payroll adjustment')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeletePayrollAdjustment(adjustment: PayrollAdjustment) {
    if (!selectedPayrollRun) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      const payload = await deleteJson<PayrollRunWriteResponse>(
        `/api/payroll/runs/${selectedPayrollRun.id}/adjustments/${adjustment.id}`,
      )

      if (payload?.data) {
        setSelectedPayrollRun(payload.data)
      }

      setNotice('Payroll adjustment removed')
      await loadPayrollData()
    } catch (error) {
      showRequestError(error, 'Unable to remove payroll adjustment')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRecordSalary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!masterData.organization || !selectedEmployeeId) {
      return
    }

    setIsSubmitting(true)
    setNotice('')

    try {
      await postJson('/api/hr/salary-revisions', {
        annualCompensation: Number(salaryForm.annualCompensation),
        effectiveFrom: salaryForm.effectiveFrom,
        employeeId: selectedEmployeeId,
        organizationId: masterData.organization.id,
        reason: salaryForm.reason.trim(),
      })
      setSalaryForm({
        annualCompensation: '',
        effectiveFrom: getTodayInputValue(),
        reason: 'Compensation revision',
      })
      setNotice('Salary revision recorded')
      await loadMasterData()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to record salary revision')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedEmployee = useMemo(
    () => masterData.employees.find((employee) => employee.id === selectedEmployeeId) ?? null,
    [masterData.employees, selectedEmployeeId],
  )
  const employeeSalaryHistory = useMemo(
    () =>
      masterData.salaryRevisions
        .filter((revision) => revision.employeeId === selectedEmployeeId)
        .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)),
    [masterData.salaryRevisions, selectedEmployeeId],
  )
  const selectedEmployeeLeaveRequests = useMemo(
    () => leaveData.requests.filter((request) => request.employeeId === selectedEmployeeId),
    [leaveData.requests, selectedEmployeeId],
  )
  const selectedEmployeePayslips = useMemo(
    () => payslipData.payslips.filter((payslip) => payslip.employeeId === selectedEmployeeId),
    [payslipData.payslips, selectedEmployeeId],
  )
  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    if (!normalized) {
      return masterData.employees
    }

    return masterData.employees.filter((employee) =>
      [employee.fullName, employee.code, employee.department, employee.location, employee.status]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [masterData.employees, query])

  const activeEmployees = masterData.employees.filter((employee) => employee.status === 'active')
  const payrollEligibleEmployees = masterData.employees.filter((employee) =>
    ['active', 'on_leave', 'exit_pending'].includes(employee.status),
  )
  const monthlyPayroll = payrollEligibleEmployees.reduce(
    (total, employee) => total + employee.annualCompensation / 12,
    0,
  )
  const canManageMasterData = masterData.currentUserRoles.some(isHrRole)
  const canManageAccess = masterData.currentUserRoles.some((role) =>
    ['owner', 'admin', 'hr'].includes(role),
  )
  const canManageOrganizationPreferences = masterData.currentUserRoles.some(
    (role) => role === 'owner' || role === 'admin',
  )
  const assignableInvitationRoles = getAssignableInvitationRoles(masterData.currentUserRoles)
  const canRecordSalary = masterData.currentUserRoles.some(isPayrollRole)
  const canReviewLeave = leaveData.currentUserRoles.some(isLeaveApproverRole)
  const pendingLeaveRequests = leaveData.requests.filter((request) => request.status === 'pending')
  const canManageAttendance = attendanceData.currentUserRoles.some(isHrRole)
  const canViewAttendancePay = attendanceData.currentUserRoles.some(isPayrollRole)
  const canUnlockAttendance = attendanceData.currentUserRoles.some((role) => role === 'owner' || role === 'admin')
  const attendanceMonthLock =
    attendanceData.locks.find((lock) => lock.periodMonth === attendanceData.period.month) ?? null
  const isAttendanceLocked = Boolean(attendanceMonthLock)
  const attendanceEmployeeOptions = attendanceData.employees
  const attendanceTotals = attendanceData.summaries.reduce(
    (totals, summary) => ({
      lossOfPayDays: totals.lossOfPayDays + summary.lossOfPayDays,
      netPay: totals.netPay + summary.payrollPreview.netPay,
      payableDays: totals.payableDays + summary.payableDays,
    }),
    { lossOfPayDays: 0, netPay: 0, payableDays: 0 },
  )
  const canManagePayroll = payrollData.currentUserRoles.some(isPayrollRole)
  const canApprovePayrollRuns = payrollData.currentUserRoles.some(isPayrollApprovalRole)
  const currentPeriodPayrollRun =
    payrollData.runs.find((run) => run.periodStart === attendanceData.period.startDate) ?? null
  const payrollRunPeriodOptions = useMemo(() => {
    const byPeriod = new Map<string, string>()

    for (const run of payrollData.runs) {
      byPeriod.set(getPayrollRunPeriodKey(run), formatMonth(run.periodStart))
    }

    return [...byPeriod.entries()]
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => b.value.localeCompare(a.value))
  }, [formatMonth, payrollData.runs])
  const filteredPayrollRuns = useMemo(() => {
    if (payrollRunPeriodFilter === 'all') {
      return payrollData.runs
    }

    return payrollData.runs.filter((run) => getPayrollRunPeriodKey(run) === payrollRunPeriodFilter)
  }, [payrollData.runs, payrollRunPeriodFilter])
  const fallbackDisplayedRun = currentPeriodPayrollRun ?? filteredPayrollRuns[0] ?? null
  const displayedPayrollRun =
    selectedPayrollRun ??
    (fallbackDisplayedRun ? ({ ...fallbackDisplayedRun, lines: [] } satisfies PayrollRunDetail) : null)
  const payrollHeaderRun = displayedPayrollRun ?? currentPeriodPayrollRun
  const isPayrollHeaderAttendanceLocked = payrollHeaderRun ? Boolean(payrollHeaderRun.attendanceMonthLockId) : isAttendanceLocked
  const currentUserId = session?.user.id ?? null
  const isDisplayedRunMaker = Boolean(
    currentUserId &&
      displayedPayrollRun &&
      (displayedPayrollRun.createdBy === currentUserId || displayedPayrollRun.submittedBy === currentUserId),
  )
  const canRecalculateDisplayedRun =
    canManagePayroll && Boolean(displayedPayrollRun && ['draft', 'reviewing'].includes(displayedPayrollRun.status))
  const canSubmitDisplayedRun = canManagePayroll && displayedPayrollRun?.status === 'draft'
  const canApproveDisplayedRun =
    canApprovePayrollRuns && displayedPayrollRun?.status === 'reviewing' && !isDisplayedRunMaker
  const canFinalizeDisplayedRun =
    canApprovePayrollRuns && displayedPayrollRun?.status === 'approved' && !isDisplayedRunMaker
  const canGenerateDisplayedPayslips = canManagePayroll && displayedPayrollRun?.status === 'finalized'
  const canExportDisplayedRun = canManagePayroll && displayedPayrollRun?.status === 'finalized'
  const makerCheckerNotice =
    isDisplayedRunMaker && displayedPayrollRun?.status === 'reviewing'
      ? 'Different approver required'
      : isDisplayedRunMaker && displayedPayrollRun?.status === 'approved'
        ? 'Different finalizer required'
        : ''
  const payrollAdjustmentEmployeeOptions = selectedPayrollRun?.lines ?? []
  const canEditPayrollAdjustments =
    canManagePayroll && Boolean(selectedPayrollRun && ['draft', 'reviewing'].includes(selectedPayrollRun.status))
  const canAddPayrollAdjustment =
    canEditPayrollAdjustments &&
    Boolean(
      payrollAdjustmentForm.employeeId &&
        payrollAdjustmentForm.componentCode.trim() &&
        payrollAdjustmentForm.componentName.trim() &&
        Number(payrollAdjustmentForm.amount) > 0,
    )
  const payrollVarianceWarningCount =
    selectedPayrollRun?.lines.reduce((total, line) => total + line.varianceWarnings.length, 0) ?? 0
  const selectedRunPayslipCount = selectedPayrollRun?.lines.filter((line) => line.payslip).length ?? 0
  const payrollRunsTotalNet = filteredPayrollRuns.reduce((total, run) => total + run.netPay, 0)
  const activeDepartments = masterData.departments.filter((department) => department.isActive)
  const activeWorkLocations = masterData.locations.filter((location) => location.isActive)
  const employeeDepartmentOptions = useMemo(() => {
    const selectedDepartment = masterData.departments.find((department) => department.id === employeeForm.departmentId)

    if (
      selectedDepartment &&
      !selectedDepartment.isActive &&
      !activeDepartments.some((department) => department.id === selectedDepartment.id)
    ) {
      return [...activeDepartments, selectedDepartment]
    }

    return activeDepartments
  }, [activeDepartments, employeeForm.departmentId, masterData.departments])
  const employeeWorkLocationOptions = useMemo(() => {
    const selectedLocation = masterData.locations.find((location) => location.id === employeeForm.workLocationId)

    if (
      selectedLocation &&
      !selectedLocation.isActive &&
      !activeWorkLocations.some((location) => location.id === selectedLocation.id)
    ) {
      return [...activeWorkLocations, selectedLocation]
    }

    return activeWorkLocations
  }, [activeWorkLocations, employeeForm.workLocationId, masterData.locations])
  const filteredAuditEntries = useMemo(() => {
    return masterData.auditEntries.filter((entry) => {
      if (auditEntityFilter !== 'all' && entry.entityType !== auditEntityFilter) {
        return false
      }

      if (auditEmployeeFilter !== 'all') {
        return entry.entityType === 'employee' && entry.entityId === auditEmployeeFilter
      }

      return true
    })
  }, [auditEmployeeFilter, auditEntityFilter, masterData.auditEntries])
  const canSaveEmployee =
    canManageMasterData && Boolean(masterData.organization && activeDepartments.length && activeWorkLocations.length)
  const isEditingEmployee = editingEmployeeId !== null
  const isUploadingSelectedPhoto = selectedEmployee ? photoUploadEmployeeId === selectedEmployee.id : false
  const dataSourceLabel =
    dataState === 'loading'
      ? 'Loading HR master data'
      : dataState === 'error'
        ? isSupabaseConfigured && session
          ? 'Unable to load secure workspace'
          : 'API unavailable. Showing demo data'
        : dataSource === 'supabase'
          ? 'Live from Supabase'
          : 'Backend fixture data'
  const primaryRole = getPrimaryWorkspaceRole(masterData.currentUserRoles)
  const workspaceSections = getAllowedWorkspaceSections(masterData.currentUserRoles)
  const resolvedActiveSection = workspaceSections.includes(activeSection)
    ? activeSection
    : workspaceSections[0] ?? 'overview'
  const sectionCopy: Record<WorkspaceSection, { title: string; description: string }> = {
    overview: {
      title: roleLabels[primaryRole],
      description: 'Priorities, exceptions, and cycle readiness at a glance.',
    },
    employees: {
      title: primaryRole === 'finance' ? 'Payment profiles' : 'People directory',
      description:
        primaryRole === 'finance'
          ? 'Review compensation and payment readiness for payroll processing.'
          : 'Manage employee records, compensation history, and lifecycle status.',
    },
    leave: {
      title: primaryRole === 'manager' ? 'Team leave decisions' : 'Leave management',
      description: 'Review requests, decisions, and approval ownership.',
    },
    attendance: {
      title: primaryRole === 'manager' ? 'Team attendance' : 'Time & attendance',
      description: 'Review payroll-impacting time inputs and period controls.',
    },
    payroll: {
      title: primaryRole === 'finance' ? 'Payroll control center' : 'Payroll operations',
      description: 'Generate, review, approve, finalize, and export payroll runs.',
    },
    organization: {
      title: 'Organization settings',
      description: 'Maintain teams, work locations, and compensation records.',
    },
    access: {
      title: 'Access & roles',
      description: 'Invite trusted users and review role assignments across the organization.',
    },
    audit: {
      title: 'Audit & controls',
      description: 'Review sensitive changes and operational activity.',
    },
  }
  const activeSectionCopy = sectionCopy[resolvedActiveSection]
  const missingBankDetails = payrollEligibleEmployees.filter(
    (employee) => !employee.bankAccountNumber || !employee.bankRoutingCode,
  ).length
  const currentPayrollStatus = payrollHeaderRun
    ? formatPayrollRunStatus(payrollHeaderRun.status)
    : 'Not started'
  const noticeTone = getNoticeTone(notice)
  const noticeToneClass: Record<StatusTone, string> = {
    danger: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    neutral: 'border-slate-200 bg-slate-50 text-slate-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-950',
  }

  if (isSupabaseConfigured && authState === 'checking') {
    return <AuthLoadingScreen />
  }

  if (isSupabaseConfigured && session && showAccountChoice) {
    return (
      <AccountSwitchScreen
        onContinue={() => window.location.replace('/app')}
        onUseAnotherAccount={handleUseAnotherAccount}
        session={session}
      />
    )
  }

  if (isSupabaseConfigured && !session) {
    return <SignInScreen onSignedIn={() => window.location.replace('/app')} />
  }

  if (isSupabaseConfigured && session && dataState === 'error' && masterData.currentUserRoles.length === 0) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--vf-surface)] px-4 text-[var(--vf-navy)]">
        <section className="w-full max-w-md rounded-lg border border-red-200 bg-[var(--vf-paper)] p-6 shadow-lg">
          <BrandLogo />
          <p className="mt-8 text-xs font-semibold uppercase text-red-700">Workspace unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold">We could not confirm your role</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--vf-text-muted)]">
            This browser is signed in as <strong className="font-semibold text-[var(--vf-navy)]">{session.user.email}</strong>, but the secure role lookup did not complete.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--vf-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-primary-hover)]"
              onClick={() => void Promise.all([loadMasterData(), loadLeaveData(), loadAttendanceData(), loadPayrollData(), loadPayslipData()])}
              type="button"
            >
              <RefreshCw size={17} aria-hidden="true" />
              Refresh
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border-strong)] px-4 text-sm font-semibold transition hover:bg-[var(--vf-primary-soft)]"
              onClick={() => void handleUseAnotherAccount()}
              type="button"
            >
              <UserRoundCog size={17} aria-hidden="true" />
              Use another account
            </button>
          </div>
        </section>
      </main>
    )
  }

  if (dataState === 'loading' && (dataSource === 'demo' || !masterData.organization)) {
    return (
      <Suspense fallback={<AuthLoadingScreen />}>
        <PayrollWorkspaceSkeleton />
      </Suspense>
    )
  }

  if (
    masterData.currentUserRoles.length > 0 &&
    masterData.currentUserRoles.every((role) => role === 'employee')
  ) {
    return (
      <>
        <EmployeeSelfService
        canSignOut={isSupabaseConfigured}
        dataSourceLabel={dataSourceLabel}
        employee={selectedEmployee}
        isDownloadingIdCard={idCardDownloadEmployeeId === selectedEmployee?.id}
        isUploadingPhoto={isUploadingSelectedPhoto}
        isSubmitting={isSubmitting}
        leaveForm={leaveForm}
        leaveRequests={selectedEmployeeLeaveRequests}
        leaveState={leaveState}
        masterData={masterData}
        notice={notice}
        onCancelLeave={handleCancelLeaveRequest}
        onIdCardDownload={handleDownloadEmployeeIdCard}
        onLeaveFormChange={setLeaveForm}
        onLeaveSubmit={handleSubmitLeaveRequest}
        onPayslipDownload={handleDownloadPayslip}
        onPhotoUpload={handleUploadEmployeePhoto}
        onRefresh={() =>
          void Promise.all([loadMasterData(), loadLeaveData(), loadAttendanceData(), loadPayrollData(), loadPayslipData()])
        }
        onSignOut={handleSignOut}
        payslipState={payslipState}
        payslips={selectedEmployeePayslips}
          salaryHistory={employeeSalaryHistory}
        />
        <IdCardPrintAnimation
          employee={idCardPrintJob?.employee ?? null}
          organizationName={masterData.organization?.name}
          stage={idCardPrintJob?.stage ?? null}
        />
      </>
    )
  }

  return (
    <>
      <main className="min-h-dvh bg-[var(--vf-surface)] text-[var(--vf-navy)]">
      <a
        href="#workspace-main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-[var(--vf-navy)] px-4 py-3 text-sm font-semibold text-white transition focus:translate-y-0"
      >
        Skip to main content
      </a>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-4 py-5 lg:flex lg:flex-col">
          <BrandLogo className="px-2" />

          <div className="mx-2 my-6 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-surface-raised)] p-3">
            <p className="truncate text-sm font-semibold text-[var(--vf-navy)]">
              {masterData.organization?.name ?? 'Organization'}
            </p>
            <p className="mt-1 text-xs text-[var(--vf-text-muted)]">{roleLabels[primaryRole]}</p>
          </div>

          <WorkspaceNavigation
            activeSection={resolvedActiveSection}
            onNavigate={handleWorkspaceNavigate}
            roles={masterData.currentUserRoles}
            variant="desktop"
          />

          <div className="mt-auto border-t border-[color:var(--vf-border)] px-2 pt-4">
            <StatusBadge tone={dataState === 'error' ? 'warning' : dataSource === 'supabase' ? 'success' : 'info'}>
              {dataSourceLabel}
            </StatusBadge>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[color:var(--vf-border)] bg-[color:rgba(255,255,255,0.94)] px-4 py-4 backdrop-blur-md md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 lg:hidden">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--vf-navy)] text-white">
                    <Banknote size={16} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold">VetanFlow</p>
                </div>
                <p className="text-xs font-semibold uppercase text-[var(--vf-primary)]">{roleLabels[primaryRole]}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[var(--vf-navy)] md:text-3xl">
                  {activeSectionCopy.title}
                </h1>
                <p className="mt-1 hidden text-sm text-[var(--vf-text-muted)] sm:block">
                  {activeSectionCopy.description}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {resolvedActiveSection === 'employees' ? (
                  <label className="relative min-w-0 sm:w-80">
                    <span className="sr-only">Search employees</span>
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vf-icon-muted)]"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border-strong)] bg-[var(--vf-paper)] pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--vf-primary)] focus:ring-3 focus:ring-[var(--vf-focus)]"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search people, team, location"
                      type="search"
                      value={query}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    void Promise.all([
                      loadMasterData(),
                      loadLeaveData(),
                      loadAttendanceData(),
                      loadPayrollData(),
                      loadPayslipData(),
                    ])
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[color:var(--vf-border-strong)] bg-[var(--vf-paper)] px-4 text-sm font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-primary-soft)] active:scale-[0.98]"
                >
                  <RefreshCw size={17} aria-hidden="true" />
                  Refresh
                </button>
                {isSupabaseConfigured ? (
                  <>
                    <a
                      className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[color:var(--vf-border-strong)] bg-[var(--vf-paper)] px-4 text-sm font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-primary-soft)]"
                      href="/login"
                    >
                      <UserRoundCog size={17} aria-hidden="true" />
                      Switch
                    </a>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[var(--vf-navy)] px-4 text-sm font-semibold text-white transition hover:bg-[#12395d] active:scale-[0.98]"
                    >
                      <LogOut size={17} aria-hidden="true" />
                      Sign out
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <div className="mt-4 lg:hidden">
              <WorkspaceNavigation
                activeSection={resolvedActiveSection}
                onNavigate={handleWorkspaceNavigate}
                roles={masterData.currentUserRoles}
                variant="mobile"
              />
            </div>
          </header>

          <div id="workspace-main" tabIndex={-1} className="space-y-6 px-4 py-6 outline-none md:px-8">
            {notice ? (
              <p
                className={`rounded-lg border px-4 py-3 text-sm font-medium ${noticeToneClass[noticeTone]}`}
                role="status"
              >
                {notice}
              </p>
            ) : null}

            {resolvedActiveSection === 'overview' ? (
              <OperationsOverview
                activeEmployees={activeEmployees.length}
                attendanceLocked={isAttendanceLocked}
                departmentCount={activeDepartments.length}
                formattedMonthlyPayroll={formatCurrency(Math.round(monthlyPayroll))}
                headcount={masterData.employees.length}
                locationCount={activeWorkLocations.length}
                lossOfPayDays={attendanceTotals.lossOfPayDays}
                missingBankDetails={missingBankDetails}
                onNavigate={handleWorkspaceNavigate}
                payrollStatus={currentPayrollStatus}
                payrollWarnings={payrollVarianceWarningCount}
                pendingLeaveRequests={pendingLeaveRequests.length}
                primaryRole={primaryRole}
              />
            ) : null}

            <section
              aria-label="People directory"
              className={`${resolvedActiveSection === 'employees' ? 'grid' : 'hidden'} min-w-0 gap-6 xl:grid-cols-[1.35fr_0.85fr]`}
            >
              <article className="min-w-0 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] shadow-sm">
                <div className="flex flex-col gap-3 border-b border-[color:var(--vf-border)] p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Employee directory</h2>
                    <p className="mt-1 text-sm text-neutral-500">{filteredEmployees.length} records in view</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[color:rgba(231,235,240,0.5)] px-3 py-1 text-xs font-semibold text-[var(--vf-navy)]">
                    <ListChecks size={14} aria-hidden="true" />
                    {masterData.currentUserRoles.join(', ') || 'member'}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[840px] border-collapse text-left text-sm">
                    <thead className="bg-[color:rgba(231,235,240,0.34)] text-xs uppercase text-[color:rgba(10,41,71,0.62)]">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Employee</th>
                        <th className="px-5 py-3 font-semibold">Department</th>
                        <th className="px-5 py-3 font-semibold">Location</th>
                        <th className="px-5 py-3 font-semibold">Annual compensation</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--vf-border)]">
                      {filteredEmployees.map((employee) => {
                        const isSelected = employee.id === selectedEmployeeId

                        return (
                          <tr key={employee.id} className={isSelected ? 'bg-[color:rgba(234,241,255,0.6)]' : 'transition hover:bg-[color:rgba(231,235,240,0.22)]'}>
                            <td className="px-5 py-4">
                              <p className="font-medium text-[var(--vf-navy)]">{employee.fullName}</p>
                              <p className="mt-1 text-xs text-neutral-500">{employee.code}</p>
                            </td>
                            <td className="px-5 py-4 text-neutral-700">{employee.department}</td>
                            <td className="px-5 py-4 text-neutral-700">{employee.location}</td>
                            <td className="tabular px-5 py-4 font-medium text-[var(--vf-navy)]">
                              {formatCurrency(employee.annualCompensation)}
                            </td>
                            <td className="px-5 py-4">
                              <StatusBadge tone={getEmployeeStatusTone(employee.status)}>
                                {formatStatus(employee.status)}
                              </StatusBadge>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEmployeeProfile(employee.id)}
                                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[color:var(--vf-border)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)]"
                                >
                                  Open
                                </button>
                                <button
                                  aria-label={`Download ${employee.fullName}'s ID card`}
                                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
                                  disabled={idCardDownloadEmployeeId === employee.id}
                                  onClick={() => void handleDownloadEmployeeIdCard(employee.id)}
                                  type="button"
                                >
                                  <Download size={14} aria-hidden="true" />
                                  {idCardDownloadEmployeeId === employee.id ? 'Preparing' : 'ID PDF'}
                                </button>
                                {canManageMasterData ? (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditEmployee(employee)}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--vf-navy)] px-3 text-xs font-semibold text-[var(--vf-cream)] transition hover:bg-[#12395d]"
                                  >
                                    <Pencil size={14} aria-hidden="true" />
                                    Edit
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </article>

              <aside className="space-y-6">
                <EmployeeIdCard
                  employee={selectedEmployee}
                  isDownloading={idCardDownloadEmployeeId === selectedEmployee?.id}
                  locale={masterData.organization?.locale ?? defaultLocale}
                  onDownload={handleDownloadEmployeeIdCard}
                  organizationName={masterData.organization?.name}
                />

                {canManageMasterData ? (
                  <EmployeePhotoUploadControl
                    employee={selectedEmployee}
                    isUploading={isUploadingSelectedPhoto}
                    onUpload={handleUploadEmployeePhoto}
                  />
                ) : null}

                {canManageMasterData && selectedEmployee ? (
                  <button
                    type="button"
                    onClick={() => handleStartEditEmployee(selectedEmployee)}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-4 text-sm font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)]"
                  >
                    <Pencil size={17} aria-hidden="true" />
                    Edit selected employee
                  </button>
                ) : null}

                <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Bank details</h2>
                    <WalletCards size={19} className="text-[var(--vf-primary)]" aria-hidden="true" />
                  </div>
                  {selectedEmployee ? (
                    <dl className="mt-5 grid gap-3">
                      {[
                        ['Status', selectedEmployee.bankAccountNumber && selectedEmployee.bankRoutingCode ? 'Ready for export' : 'Missing details'],
                        ['Account', maskBankAccount(selectedEmployee.bankAccountNumber)],
                        ['Routing code', selectedEmployee.bankRoutingCode ?? 'Not set'],
                        ['Bank', selectedEmployee.bankName ?? 'Not set'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-[color:rgba(231,235,240,0.3)] px-3 py-2">
                          <dt className="text-sm text-neutral-500">{label}</dt>
                          <dd className="text-right text-sm font-semibold text-[var(--vf-navy)]">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-4 text-sm text-neutral-500">Select an employee to review bank readiness.</p>
                  )}
                </article>

                <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Salary history</h2>
                    <Clock3 size={19} className="text-neutral-400" aria-hidden="true" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {employeeSalaryHistory.length ? (
                      employeeSalaryHistory.map((revision) => (
                        <div key={revision.id} className="rounded-lg border border-[color:var(--vf-border)] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="tabular text-sm font-semibold text-[var(--vf-navy)]">
                              {formatCurrency(revision.annualCompensation)}
                            </p>
                            <p className="text-xs text-neutral-500">{formatDate(revision.effectiveFrom)}</p>
                          </div>
                          <p className="mt-2 text-sm text-neutral-600">{revision.reason}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">No salary revision yet.</p>
                    )}
                  </div>
                </article>
              </aside>
            </section>

            {canManageMasterData && resolvedActiveSection === 'employees' ? (
              <section className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--vf-navy)]">
                      {isEditingEmployee ? 'Edit employee record' : 'Create employee record'}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Employee profile changes are audited. Existing salary changes stay in compensation revisions.
                    </p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--vf-cream)] text-[var(--vf-brown)]">
                    {isEditingEmployee ? (
                      <Pencil size={19} aria-hidden="true" />
                    ) : (
                      <UserPlus size={19} aria-hidden="true" />
                    )}
                  </div>
                </div>

                {!canSaveEmployee ? (
                  <p className="mt-5 rounded-lg border border-[color:rgba(29,95,209,0.24)] bg-[var(--vf-cream)] px-4 py-3 text-sm text-[var(--vf-brown)]">
                    Add one department and one active work location before saving employee records.
                  </p>
                ) : null}

                <form onSubmit={handleSaveEmployee} className="mt-5 grid gap-4 lg:grid-cols-4">
                  <label className="block lg:col-span-1">
                    <span className="text-sm font-medium text-neutral-800">Employee code</span>
                    <input
                      className={formControlClass}
                      aria-invalid={Boolean(fieldErrors.employeeCode)}
                      onChange={(event) => {
                        clearFieldError('employeeCode')
                        setEmployeeForm((current) => ({ ...current, code: event.target.value }))
                      }}
                      placeholder="VF-004"
                      required
                      value={employeeForm.code}
                    />
                    {fieldErrors.employeeCode ? (
                      <span className="mt-2 block text-xs font-medium text-red-700" role="alert">
                        {fieldErrors.employeeCode}
                      </span>
                    ) : null}
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Full name</span>
                    <input
                      className={formControlClass}
                      onChange={(event) => setEmployeeForm((current) => ({ ...current, fullName: event.target.value }))}
                      placeholder="Employee name"
                      required
                      value={employeeForm.fullName}
                    />
                  </label>

                  <label className="block lg:col-span-1">
                    <span className="text-sm font-medium text-neutral-800">Status</span>
                    <select
                      className={formControlClass}
                      onChange={(event) =>
                        setEmployeeForm((current) => ({
                          ...current,
                          status: event.target.value as HrEmployee['status'],
                        }))
                      }
                      value={employeeForm.status}
                    >
                      {employeeStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Work email</span>
                    <input
                      className={formControlClass}
                      onChange={(event) => setEmployeeForm((current) => ({ ...current, workEmail: event.target.value }))}
                      placeholder="name@company.com"
                      required
                      type="email"
                      value={employeeForm.workEmail}
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Designation</span>
                    <input
                      className={formControlClass}
                      onChange={(event) => setEmployeeForm((current) => ({ ...current, role: event.target.value }))}
                      placeholder="Payroll Specialist"
                      required
                      value={employeeForm.role}
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Department</span>
                    <select
                      className={formControlClass}
                      disabled={!employeeDepartmentOptions.length}
                      onChange={(event) =>
                        setEmployeeForm((current) => ({ ...current, departmentId: event.target.value }))
                      }
                      required
                      value={employeeForm.departmentId}
                    >
                      {employeeDepartmentOptions.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                          {department.isActive ? '' : ' (archived)'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Work location</span>
                    <select
                      className={formControlClass}
                      disabled={!employeeWorkLocationOptions.length}
                      onChange={(event) =>
                        setEmployeeForm((current) => ({ ...current, workLocationId: event.target.value }))
                      }
                      required
                      value={employeeForm.workLocationId}
                    >
                      {employeeWorkLocationOptions.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name} · {location.city}
                          {location.isActive ? '' : ' (archived)'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block lg:col-span-1">
                    <span className="text-sm font-medium text-neutral-800">Joining date</span>
                    <input
                      className={formControlClass}
                      onChange={(event) => setEmployeeForm((current) => ({ ...current, joiningDate: event.target.value }))}
                      required
                      type="date"
                      value={employeeForm.joiningDate}
                    />
                  </label>

                  <label className="block lg:col-span-1">
                    <span className="text-sm font-medium text-neutral-800">Annual compensation</span>
                    <input
                      className={formControlClass}
                      disabled={isEditingEmployee}
                      min={0}
                      onChange={(event) => setEmployeeForm((current) => ({ ...current, annualCompensation: event.target.value }))}
                      required={!isEditingEmployee}
                      type="number"
                      value={employeeForm.annualCompensation}
                    />
                    <span className="mt-2 block text-xs text-neutral-500">
                      {isEditingEmployee ? 'Use compensation for salary changes.' : 'Initial compensation creates salary history.'}
                    </span>
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Account holder name</span>
                    <input
                      className={formControlClass}
                      onChange={(event) =>
                        setEmployeeForm((current) => ({
                          ...current,
                          bankAccountHolderName: event.target.value,
                        }))
                      }
                      placeholder="Name as per bank"
                      value={employeeForm.bankAccountHolderName}
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Bank name</span>
                    <input
                      className={formControlClass}
                      onChange={(event) =>
                        setEmployeeForm((current) => ({
                          ...current,
                          bankName: event.target.value,
                        }))
                      }
                      placeholder="Example Bank"
                      value={employeeForm.bankName}
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Account number</span>
                    <input
                      className={formControlClass}
                      inputMode="text"
                      onChange={(event) =>
                        setEmployeeForm((current) => ({
                          ...current,
                          bankAccountNumber: event.target.value,
                        }))
                      }
                      maxLength={34}
                      pattern="[A-Za-z0-9][A-Za-z0-9 -]{3,33}"
                      placeholder="Account identifier"
                      value={employeeForm.bankAccountNumber}
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="text-sm font-medium text-neutral-800">Routing code</span>
                    <input
                      className={formControlClass}
                      maxLength={34}
                      onChange={(event) =>
                        setEmployeeForm((current) => ({
                          ...current,
                          bankRoutingCode: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Routing or clearing code"
                      value={employeeForm.bankRoutingCode}
                    />
                  </label>

                  <div className="flex flex-col gap-2 lg:col-span-2 lg:flex-row lg:items-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || !canSaveEmployee}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isEditingEmployee ? (
                        <Pencil size={17} aria-hidden="true" />
                      ) : (
                        <UserPlus size={17} aria-hidden="true" />
                      )}
                      {isEditingEmployee ? 'Update employee' : 'Create employee'}
                    </button>
                    {isEditingEmployee ? (
                      <button
                        type="button"
                        onClick={handleCancelEmployeeEdit}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] px-4 text-sm font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)]"
                      >
                        <X size={17} aria-hidden="true" />
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>
            ) : null}

            {canReviewLeave && resolvedActiveSection === 'leave' ? (
              <section className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Leave approvals</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {pendingLeaveRequests.length} pending request{pendingLeaveRequests.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--vf-cream)] text-[var(--vf-brown)]">
                    <CalendarCheck size={19} aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {pendingLeaveRequests.length ? (
                    pendingLeaveRequests.map((request) => (
                      <article key={request.id} className="rounded-lg border border-[color:var(--vf-border)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--vf-navy)]">{request.employeeName}</p>
                            <p className="mt-1 text-xs text-neutral-500">{request.employeeCode}</p>
                          </div>
                          <span className="rounded-full bg-[var(--vf-cream)] px-3 py-1 text-xs font-semibold text-[var(--vf-brown)]">
                            {formatLabel(request.approvalStage)} stage
                          </span>
                        </div>
                        <p className="mt-3 text-sm font-medium text-[var(--vf-navy)]">
                          {formatLeaveType(request.leaveType)} · {request.totalDays} days
                        </p>
                        <p className="mt-1 text-sm text-neutral-600">
                          {formatDate(request.startDate)} to {formatDate(request.endDate)}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-neutral-600">{request.reason}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleReviewLeaveRequest(request, 'approved')}
                            disabled={isSubmitting}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--vf-navy)] px-3 text-xs font-semibold text-white transition hover:bg-[#12395d] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCircle2 size={14} aria-hidden="true" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReviewLeaveRequest(request, 'rejected')}
                            disabled={isSubmitting}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X size={14} aria-hidden="true" />
                            Reject
                          </button>
                          {request.approvalStage === 'manager' ? (
                            <button
                              type="button"
                              onClick={() => void handleReviewLeaveRequest(request, 'escalated')}
                              disabled={isSubmitting}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] px-3 text-xs font-semibold text-[var(--vf-brown)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Send size={14} aria-hidden="true" />
                              Escalate
                            </button>
                          ) : null}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500">No pending leave requests.</p>
                  )}
                </div>

                {leaveData.requests.length ? (
                  <div className="mt-5 border-t border-[color:var(--vf-border)] pt-5">
                    <h3 className="text-sm font-semibold text-[var(--vf-navy)]">Recent decisions</h3>
                    <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {leaveData.requests.slice(0, 6).map((request) => (
                        <div key={request.id} className="rounded-lg bg-[color:rgba(231,235,240,0.34)] px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate text-sm font-medium text-neutral-800">{request.employeeName}</p>
                            <StatusBadge className="shrink-0" tone={getLeaveStatusTone(request.status)}>
                              {formatLeaveStatus(request.status)}
                            </StatusBadge>
                          </div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatDate(request.startDate)} · {formatLeaveType(request.leaveType)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className={`${resolvedActiveSection === 'attendance' ? 'block' : 'hidden'} rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm`}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Attendance control</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {attendanceState === 'loading'
                      ? 'Loading monthly attendance.'
                      : `${attendanceData.summaries.length} payroll summaries for ${formatDate(attendanceData.period.startDate)}`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="block sm:w-44">
                    <span className="text-xs font-semibold uppercase text-neutral-500">Period</span>
                    <input
                      className="mt-2 min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                      onChange={(event) => setAttendancePeriodMonth(fromMonthInputValue(event.target.value))}
                      type="month"
                      value={toMonthInputValue(attendancePeriodMonth)}
                    />
                  </label>
                  <StatusBadge
                    className="min-h-11 justify-center rounded-lg px-3 text-sm"
                    tone={isAttendanceLocked ? 'success' : 'warning'}
                  >
                    {isAttendanceLocked ? 'Locked for payroll' : 'Open for edits'}
                  </StatusBadge>
                  {canManageAttendance ? (
                    isAttendanceLocked ? (
                      <button
                        type="button"
                        onClick={() => void handleUnlockAttendanceMonth()}
                        disabled={isSubmitting || !canUnlockAttendance}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] px-4 text-sm font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShieldCheck size={17} aria-hidden="true" />
                        Unlock
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleLockAttendanceMonth()}
                        disabled={isSubmitting}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--vf-navy)] px-4 text-sm font-semibold text-white transition hover:bg-[#12395d] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <ShieldCheck size={17} aria-hidden="true" />
                        Lock month
                      </button>
                    )
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    label: 'Payable days',
                    value: attendanceTotals.payableDays.toFixed(1),
                    detail: 'All visible employees',
                  },
                  {
                    label: 'Loss of pay',
                    value: attendanceTotals.lossOfPayDays.toFixed(1),
                    detail: 'Leave and absence impact',
                  },
                  ...(canViewAttendancePay
                    ? [
                        {
                          label: 'Net pay forecast',
                          value: formatCurrency(Math.round(attendanceTotals.netPay)),
                          detail: 'From current summaries',
                        },
                      ]
                    : []),
                  {
                    label: 'Holidays',
                    value: String(attendanceData.holidays.length),
                    detail: 'Organization calendar in period',
                  },
                ].map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-lg border border-[color:var(--vf-border)] bg-[color:rgba(231,235,240,0.24)] p-4"
                  >
                    <p className="text-sm text-neutral-500">{metric.label}</p>
                    <p className="tabular mt-2 text-2xl font-semibold text-[var(--vf-navy)]">{metric.value}</p>
                    <p className="mt-3 text-xs font-medium text-[var(--vf-brown)]">{metric.detail}</p>
                  </article>
                ))}
              </div>

              <div className="mt-5 overflow-x-auto rounded-lg border border-[color:var(--vf-border)]">
                <table className={`w-full ${canViewAttendancePay ? 'min-w-[980px]' : 'min-w-[680px]'} border-collapse text-left text-sm`}>
                  <thead className="bg-[color:rgba(231,235,240,0.34)] text-xs uppercase text-[color:rgba(10,41,71,0.62)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Employee</th>
                      <th className="px-4 py-3 font-semibold">Present</th>
                      <th className="px-4 py-3 font-semibold">Paid leave</th>
                      <th className="px-4 py-3 font-semibold">LOP</th>
                      <th className="px-4 py-3 font-semibold">Payable</th>
                      {canViewAttendancePay ? (
                        <>
                          <th className="px-4 py-3 font-semibold">Deduction</th>
                          <th className="px-4 py-3 font-semibold">Net preview</th>
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--vf-border)]">
                    {attendanceData.summaries.length ? (
                      attendanceData.summaries.map((summary) => (
                        <tr key={summary.employeeId} className="transition hover:bg-[color:rgba(231,235,240,0.18)]">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--vf-navy)]">{summary.employeeName}</p>
                            <p className="mt-1 text-xs text-neutral-500">{summary.employeeCode}</p>
                          </td>
                          <td className="tabular px-4 py-3">{summary.presentDays}</td>
                          <td className="tabular px-4 py-3">{summary.paidLeaveDays}</td>
                          <td className="tabular px-4 py-3">{summary.lossOfPayDays}</td>
                          <td className="tabular px-4 py-3">{summary.payableDays}</td>
                          {canViewAttendancePay ? (
                            <>
                              <td className="tabular px-4 py-3">
                                {formatCurrency(Math.round(summary.payrollPreview.unpaidLeaveDeduction))}
                              </td>
                              <td className="tabular px-4 py-3 font-semibold text-[var(--vf-navy)]">
                                {formatCurrency(Math.round(summary.payrollPreview.netPay))}
                              </td>
                            </>
                          ) : null}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-5 text-sm text-neutral-500" colSpan={canViewAttendancePay ? 7 : 5}>
                          No attendance summaries are visible for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rounded-lg border border-[color:var(--vf-border)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--vf-navy)]">Manual attendance entry</h3>
                      <p className="mt-1 text-xs text-neutral-500">HR can record one employee and date at a time.</p>
                    </div>
                    <Clock3 size={18} className="text-[var(--vf-brown)]" aria-hidden="true" />
                  </div>
                  {canManageAttendance ? (
                    <form onSubmit={handleSaveAttendanceEntry} className="mt-4 grid gap-3 md:grid-cols-6">
                      <label className="block md:col-span-2">
                        <span className="text-sm font-medium text-neutral-800">Employee</span>
                        <select
                          className={formControlClass}
                          disabled={isAttendanceLocked || !attendanceEmployeeOptions.length}
                          onChange={(event) =>
                            setAttendanceForm((current) => ({ ...current, employeeId: event.target.value }))
                          }
                          required
                          value={attendanceForm.employeeId}
                        >
                          {attendanceEmployeeOptions.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.code} · {employee.fullName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block md:col-span-2">
                        <span className="text-sm font-medium text-neutral-800">Work date</span>
                        <input
                          className={formControlClass}
                          disabled={isAttendanceLocked}
                          onChange={(event) =>
                            setAttendanceForm((current) => ({ ...current, workDate: event.target.value }))
                          }
                          required
                          type="date"
                          value={attendanceForm.workDate}
                        />
                      </label>
                      <label className="block md:col-span-2">
                        <span className="text-sm font-medium text-neutral-800">Status</span>
                        <select
                          className={formControlClass}
                          disabled={isAttendanceLocked}
                          onChange={(event) => {
                            const attendanceStatus = event.target.value as AttendanceStatus
                            setAttendanceForm((current) => ({
                              ...current,
                              attendanceStatus,
                              payableHours: getDefaultPayableHours(attendanceStatus),
                            }))
                          }}
                          value={attendanceForm.attendanceStatus}
                        >
                          {attendanceStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {formatAttendanceStatus(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block md:col-span-1">
                        <span className="text-sm font-medium text-neutral-800">Pay hours</span>
                        <input
                          className={formControlClass}
                          disabled={isAttendanceLocked}
                          min={0}
                          max={24}
                          onChange={(event) =>
                            setAttendanceForm((current) => ({ ...current, payableHours: event.target.value }))
                          }
                          required
                          step="0.5"
                          type="number"
                          value={attendanceForm.payableHours}
                        />
                      </label>
                      <label className="block md:col-span-1">
                        <span className="text-sm font-medium text-neutral-800">OT hours</span>
                        <input
                          className={formControlClass}
                          disabled={isAttendanceLocked}
                          min={0}
                          max={24}
                          onChange={(event) =>
                            setAttendanceForm((current) => ({ ...current, overtimeHours: event.target.value }))
                          }
                          step="0.5"
                          type="number"
                          value={attendanceForm.overtimeHours}
                        />
                      </label>
                      <label className="block md:col-span-3">
                        <span className="text-sm font-medium text-neutral-800">Notes</span>
                        <input
                          className={formControlClass}
                          disabled={isAttendanceLocked}
                          onChange={(event) =>
                            setAttendanceForm((current) => ({ ...current, notes: event.target.value }))
                          }
                          placeholder="Optional"
                          value={attendanceForm.notes}
                        />
                      </label>
                      <div className="flex items-end md:col-span-1">
                        <button
                          type="submit"
                          disabled={isSubmitting || isAttendanceLocked || !attendanceEmployeeOptions.length}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Plus size={17} aria-hidden="true" />
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-4 text-sm text-neutral-500">Attendance entry is available to HR roles.</p>
                  )}
                </article>

                <article className="rounded-lg border border-[color:var(--vf-border)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--vf-navy)]">Holiday calendar</h3>
                      <p className="mt-1 text-xs text-neutral-500">Organization holidays configured for this period.</p>
                    </div>
                    <CalendarCheck size={18} className="text-[var(--vf-brown)]" aria-hidden="true" />
                  </div>
                  {canManageAttendance ? (
                    <form onSubmit={handleSaveHoliday} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.2fr_auto]">
                      <label className="block">
                        <span className="text-sm font-medium text-neutral-800">Date</span>
                        <input
                          className={formControlClass}
                          disabled={isAttendanceLocked}
                          onChange={(event) =>
                            setHolidayForm((current) => ({ ...current, holidayDate: event.target.value }))
                          }
                          required
                          type="date"
                          value={holidayForm.holidayDate}
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-neutral-800">Name</span>
                        <input
                          className={formControlClass}
                          disabled={isAttendanceLocked}
                          onChange={(event) => setHolidayForm((current) => ({ ...current, name: event.target.value }))}
                          placeholder="Company holiday"
                          required
                          value={holidayForm.name}
                        />
                      </label>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={isSubmitting || isAttendanceLocked}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] px-3 text-sm font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Plus size={17} aria-hidden="true" />
                          Add
                        </button>
                      </div>
                    </form>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    {attendanceData.holidays.length ? (
                      attendanceData.holidays.map((holiday) => (
                        <div
                          key={holiday.id}
                          className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-[color:rgba(231,235,240,0.34)] px-3"
                        >
                          <p className="truncate text-sm font-medium text-[var(--vf-navy)]">{holiday.name}</p>
                          <p className="shrink-0 text-xs text-neutral-500">{formatDate(holiday.holidayDate)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">No holidays recorded for this month.</p>
                    )}
                  </div>
                </article>
              </div>
            </section>

            <section className={`${resolvedActiveSection === 'payroll' ? 'block' : 'hidden'} rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm`}>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Payroll runs</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {payrollState === 'loading'
                      ? 'Loading payroll runs.'
                      : `${filteredPayrollRuns.length} of ${payrollData.runs.length} run${
                          payrollData.runs.length === 1 ? '' : 's'
                        } visible`}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <StatusBadge
                    className="min-h-11 justify-center rounded-lg px-3 text-sm"
                    tone={isPayrollHeaderAttendanceLocked ? 'success' : 'warning'}
                  >
                    {isPayrollHeaderAttendanceLocked
                      ? payrollHeaderRun
                        ? 'Run attendance locked'
                        : 'Attendance locked'
                      : 'Lock attendance first'}
                  </StatusBadge>
                  {payrollHeaderRun ? (
                    <button
                      type="button"
                      onClick={() => void handleRecalculatePayrollRun(payrollHeaderRun.id)}
                      disabled={
                        isSubmitting ||
                        !canManagePayroll ||
                        !isPayrollHeaderAttendanceLocked ||
                        !['draft', 'reviewing'].includes(payrollHeaderRun.status)
                      }
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--vf-navy)] px-4 text-sm font-semibold text-white transition hover:bg-[#12395d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw size={17} aria-hidden="true" />
                      Recalculate draft
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleCreatePayrollRun()}
                      disabled={isSubmitting || !canManagePayroll || !isAttendanceLocked}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus size={17} aria-hidden="true" />
                      Generate draft run
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  {
                    label: displayedPayrollRun ? 'Run period' : 'Current period',
                    value: displayedPayrollRun ? formatDate(displayedPayrollRun.periodStart) : formatDate(attendanceData.period.startDate),
                    detail: displayedPayrollRun
                      ? formatDate(displayedPayrollRun.periodEnd)
                      : currentPeriodPayrollRun
                        ? formatPayrollRunStatus(currentPeriodPayrollRun.status)
                        : 'No run yet',
                  },
                  {
                    label: 'Run net pay',
                    value: displayedPayrollRun ? formatCurrency(Math.round(displayedPayrollRun.netPay)) : 'Not generated',
                    detail: displayedPayrollRun ? `${displayedPayrollRun.lineCount} line items` : 'Create from locked attendance',
                  },
                  {
                    label: 'All run net pay',
                    value: formatCurrency(Math.round(payrollRunsTotalNet)),
                    detail: 'Visible payroll runs',
                  },
                  {
                    label: 'Last update',
                    value: displayedPayrollRun ? formatDate(displayedPayrollRun.updatedAt) : 'Pending',
                    detail: displayedPayrollRun
                      ? `${payrollVarianceWarningCount} variance flag${payrollVarianceWarningCount === 1 ? '' : 's'}`
                      : 'Calculation snapshot stored',
                  },
                  {
                    label: 'Approval',
                    value: displayedPayrollRun ? formatPayrollRunStatus(displayedPayrollRun.status) : 'Pending',
                    detail: displayedPayrollRun?.finalizedAt
                      ? `Finalized ${formatDate(displayedPayrollRun.finalizedAt)}`
                      : displayedPayrollRun?.approvedAt
                        ? `Approved ${formatDate(displayedPayrollRun.approvedAt)}`
                        : displayedPayrollRun?.submittedAt
                          ? `Submitted ${formatDate(displayedPayrollRun.submittedAt)}`
                          : 'Not submitted',
                  },
                ].map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-lg border border-[color:var(--vf-border)] bg-[color:rgba(231,235,240,0.24)] p-4"
                  >
                    <p className="text-sm text-neutral-500">{metric.label}</p>
                    <p className="tabular mt-2 text-xl font-semibold text-[var(--vf-navy)]">{metric.value}</p>
                    <p className="mt-3 text-xs font-medium text-[var(--vf-brown)]">{metric.detail}</p>
                  </article>
                ))}
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <article className="min-w-0 rounded-lg border border-[color:var(--vf-border)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--vf-navy)]">Run history</h3>
                      <p className="mt-1 text-xs text-neutral-500">Draft payroll runs generated from locked attendance.</p>
                    </div>
                    <label className="min-w-40">
                      <span className="sr-only">Filter payroll runs by period</span>
                      <select
                        className="min-h-10 w-full rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-sm font-semibold text-[var(--vf-navy)] outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                        onChange={(event) => {
                          setPayrollRunPeriodFilter(event.target.value)
                          setSelectedPayrollRun(null)
                        }}
                        value={payrollRunPeriodFilter}
                      >
                        <option value="all">All periods</option>
                        {payrollRunPeriodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 space-y-2">
                    {filteredPayrollRuns.length ? (
                      filteredPayrollRuns.map((run) => (
                        <button
                          key={run.id}
                          type="button"
                          onClick={() => void handleOpenPayrollRun(run.id)}
                          className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left transition hover:bg-[var(--vf-cream)] ${
                            selectedPayrollRun?.id === run.id
                              ? 'border-[color:rgba(29,95,209,0.36)] bg-[var(--vf-cream)]'
                              : 'border-[color:var(--vf-border)] bg-[var(--vf-paper)]'
                          }`}
                        >
                          <span>
                            <span className="block text-sm font-semibold text-[var(--vf-navy)]">
                              {formatDate(run.periodStart)}
                            </span>
                            <span className="mt-1 block text-xs text-neutral-500">
                              {run.lineCount} payroll lines
                            </span>
                            <StatusBadge className="mt-2" tone={getPayrollStatusTone(run.status)}>
                              {formatPayrollRunStatus(run.status)}
                            </StatusBadge>
                          </span>
                          <span className="tabular text-sm font-semibold text-[var(--vf-navy)]">
                            {formatCurrency(Math.round(run.netPay))}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-neutral-500">No payroll runs match this period.</p>
                    )}
                  </div>
                </article>

                <article className="min-w-0 overflow-hidden rounded-lg border border-[color:var(--vf-border)] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--vf-navy)]">Run lines</h3>
                      <p className="mt-1 text-xs text-neutral-500">
                        {displayedPayrollRun
                          ? `${formatDate(displayedPayrollRun.periodStart)} · ${formatPayrollRunStatus(displayedPayrollRun.status)}`
                          : 'Open or generate a payroll run to inspect line snapshots.'}
                      </p>
                    </div>
                    {currentPeriodPayrollRun && !selectedPayrollRun ? (
                      <button
                        type="button"
                        onClick={() => void handleOpenPayrollRun(currentPeriodPayrollRun.id)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)]"
                      >
                        <FileText size={14} aria-hidden="true" />
                        Open details
                      </button>
                    ) : null}
                  </div>

                  {displayedPayrollRun ? (
                    <div className="mt-4 flex flex-wrap gap-2 rounded-lg bg-[color:rgba(231,235,240,0.24)] p-3">
                      <button
                        type="button"
                        onClick={() => void handleRecalculatePayrollRun(displayedPayrollRun.id)}
                        disabled={isSubmitting || !canRecalculateDisplayedRun}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <RefreshCw size={14} aria-hidden="true" />
                        Recalculate
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handlePayrollRunAction(displayedPayrollRun.id, 'submit', 'Payroll run submitted for review')
                        }
                        disabled={isSubmitting || !canSubmitDisplayedRun}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <Send size={14} aria-hidden="true" />
                        Submit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handlePayrollRunAction(displayedPayrollRun.id, 'approve', 'Payroll run approved')
                        }
                        disabled={isSubmitting || !canApproveDisplayedRun}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <CheckCircle2 size={14} aria-hidden="true" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handlePayrollRunAction(displayedPayrollRun.id, 'finalize', 'Payroll run finalized')
                        }
                        disabled={isSubmitting || !canFinalizeDisplayedRun}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--vf-navy)] px-3 text-xs font-semibold text-white transition hover:bg-[#12395d] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <ShieldCheck size={14} aria-hidden="true" />
                        Finalize
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleGeneratePayslips(displayedPayrollRun.id)}
                        disabled={isSubmitting || !canGenerateDisplayedPayslips}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <FileText size={14} aria-hidden="true" />
                        {selectedRunPayslipCount ? `Regenerate ${selectedRunPayslipCount}` : 'Generate payslips'}
                      </button>
                      {[
                        ['bank', 'Bank CSV'],
                        ['deductions', 'Deductions CSV'],
                        ['department-cost', 'Cost CSV'],
                      ].map(([exportType, label]) => (
                        <button
                          key={exportType}
                          type="button"
                          onClick={() =>
                            void handleDownloadPayrollExport(displayedPayrollRun.id, exportType as PayrollExportType)
                          }
                          disabled={isSubmitting || !canExportDisplayedRun}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-55"
                        >
                          <Download size={14} aria-hidden="true" />
                          {label}
                        </button>
                      ))}
                      {makerCheckerNotice ? (
                        <span className="inline-flex min-h-10 items-center rounded-lg bg-[var(--vf-cream)] px-3 text-xs font-semibold text-[var(--vf-brown)]">
                          {makerCheckerNotice}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {selectedPayrollRun ? (
                    <form
                      onSubmit={handleAddPayrollAdjustment}
                      className="mt-4 rounded-lg border border-[color:var(--vf-border)] bg-[color:rgba(231,235,240,0.18)] p-4"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-[var(--vf-navy)]">Run adjustments</h4>
                          <p className="mt-1 text-xs text-neutral-500">
                            Add one-time earnings, deductions, or reimbursements before payroll approval.
                          </p>
                        </div>
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            canEditPayrollAdjustments
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {canEditPayrollAdjustments ? 'Editable' : 'Locked'}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 lg:grid-cols-4">
                        <label className="block">
                          <span className="text-sm font-medium text-neutral-800">Employee</span>
                          <select
                            className={formControlClass}
                            disabled={!canEditPayrollAdjustments || !payrollAdjustmentEmployeeOptions.length}
                            onChange={(event) =>
                              setPayrollAdjustmentForm((current) => ({
                                ...current,
                                employeeId: event.target.value,
                              }))
                            }
                            required
                            value={payrollAdjustmentForm.employeeId}
                          >
                            {payrollAdjustmentEmployeeOptions.map((line) => (
                              <option key={line.employeeId} value={line.employeeId}>
                                {line.employeeName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-neutral-800">Type</span>
                          <select
                            className={formControlClass}
                            disabled={!canEditPayrollAdjustments}
                            onChange={(event) => {
                              const componentType = event.target.value as PayrollAdjustmentComponentType

                              setPayrollAdjustmentForm((current) => ({
                                ...current,
                                componentType,
                                ...payrollAdjustmentDefaults[componentType],
                              }))
                            }}
                            value={payrollAdjustmentForm.componentType}
                          >
                            {payrollAdjustmentComponentOptions.map((type) => (
                              <option key={type} value={type}>
                                {formatLabel(type)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-neutral-800">Component code</span>
                          <input
                            className={formControlClass}
                            disabled={!canEditPayrollAdjustments}
                            onChange={(event) =>
                              setPayrollAdjustmentForm((current) => ({
                                ...current,
                                componentCode: event.target.value,
                              }))
                            }
                            required
                            value={payrollAdjustmentForm.componentCode}
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-neutral-800">Amount</span>
                          <input
                            className={formControlClass}
                            disabled={!canEditPayrollAdjustments}
                            min="1"
                            onChange={(event) =>
                              setPayrollAdjustmentForm((current) => ({
                                ...current,
                                amount: event.target.value,
                              }))
                            }
                            required
                            type="number"
                            value={payrollAdjustmentForm.amount}
                          />
                        </label>
                        <label className="block lg:col-span-2">
                          <span className="text-sm font-medium text-neutral-800">Component name</span>
                          <input
                            className={formControlClass}
                            disabled={!canEditPayrollAdjustments}
                            onChange={(event) =>
                              setPayrollAdjustmentForm((current) => ({
                                ...current,
                                componentName: event.target.value,
                              }))
                            }
                            required
                            value={payrollAdjustmentForm.componentName}
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-neutral-800">Tax treatment</span>
                          <select
                            className={formControlClass}
                            disabled={!canEditPayrollAdjustments}
                            onChange={(event) =>
                              setPayrollAdjustmentForm((current) => ({
                                ...current,
                                taxTreatment: event.target.value as PayrollAdjustmentTaxTreatment,
                              }))
                            }
                            value={payrollAdjustmentForm.taxTreatment}
                          >
                            {payrollAdjustmentTaxTreatmentOptions.map((taxTreatment) => (
                              <option key={taxTreatment} value={taxTreatment}>
                                {formatLabel(taxTreatment)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-neutral-800">Notes</span>
                          <input
                            className={formControlClass}
                            disabled={!canEditPayrollAdjustments}
                            onChange={(event) =>
                              setPayrollAdjustmentForm((current) => ({
                                ...current,
                                notes: event.target.value,
                              }))
                            }
                            value={payrollAdjustmentForm.notes}
                          />
                        </label>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting || !canAddPayrollAdjustment}
                        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <Plus size={14} aria-hidden="true" />
                        Add adjustment
                      </button>
                    </form>
                  ) : null}

                  <div className="mt-4 overflow-x-auto rounded-lg border border-[color:var(--vf-border)]">
                    <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
                      <thead className="bg-[color:rgba(231,235,240,0.34)] text-xs uppercase text-[color:rgba(10,41,71,0.62)]">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Employee</th>
                          <th className="px-4 py-3 font-semibold">Gross</th>
                          <th className="px-4 py-3 font-semibold">Overtime</th>
                          <th className="px-4 py-3 font-semibold">Adjustments</th>
                          <th className="px-4 py-3 font-semibold">LOP</th>
                          <th className="px-4 py-3 font-semibold">Deductions</th>
                          <th className="px-4 py-3 font-semibold">Variance</th>
                          <th className="px-4 py-3 font-semibold">Net pay</th>
                          <th className="px-4 py-3 font-semibold">Payslip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:var(--vf-border)]">
                        {selectedPayrollRun?.lines.length ? (
                          selectedPayrollRun.lines.map((line) => {
                            const adjustmentTotals = getPayrollLineAdjustmentTotals(line)
                            const adjustmentNet =
                              adjustmentTotals.earnings +
                              adjustmentTotals.reimbursements -
                              adjustmentTotals.deductions

                            return (
                              <tr key={line.id} className="transition hover:bg-[color:rgba(231,235,240,0.18)]">
                                <td className="px-4 py-3 align-top">
                                  <p className="font-medium text-[var(--vf-navy)]">{line.employeeName}</p>
                                  <p className="mt-1 text-xs text-neutral-500">{line.employeeCode}</p>
                                  {line.adjustments.length ? (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                      {line.adjustments.map((adjustment) => (
                                        <span
                                          key={adjustment.id}
                                          className="inline-flex max-w-[220px] items-center gap-1 rounded-full bg-[var(--vf-cream)] px-2 py-1 text-[11px] font-semibold text-[var(--vf-navy)]"
                                        >
                                          <span className="truncate">
                                            {adjustment.componentName} · {formatCurrency(Math.round(adjustment.amount))}
                                          </span>
                                          {canEditPayrollAdjustments ? (
                                            <button
                                              type="button"
                                              onClick={() => void handleDeletePayrollAdjustment(adjustment)}
                                              disabled={isSubmitting}
                                              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[var(--vf-brown)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                                              aria-label={`Remove ${adjustment.componentName}`}
                                            >
                                              <Trash2 size={12} aria-hidden="true" />
                                            </button>
                                          ) : null}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="tabular px-4 py-3 align-top">
                                  {formatCurrency(Math.round(line.grossPay))}
                                </td>
                                <td className="tabular px-4 py-3 align-top">
                                  {line.overtimeAmount > 0 ? formatCurrency(Math.round(line.overtimeAmount)) : 'None'}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <p className="tabular font-semibold text-[var(--vf-navy)]">
                                    {adjustmentNet >= 0 ? '+' : '-'}
                                    {formatCurrency(Math.round(Math.abs(adjustmentNet)))}
                                  </p>
                                  <p className="mt-1 text-xs text-neutral-500">
                                    E {formatCurrency(Math.round(adjustmentTotals.earnings))} · R{' '}
                                    {formatCurrency(Math.round(adjustmentTotals.reimbursements))} · D{' '}
                                    {formatCurrency(Math.round(adjustmentTotals.deductions))}
                                  </p>
                                </td>
                                <td className="tabular px-4 py-3 align-top">{line.lossOfPayDays}</td>
                                <td className="tabular px-4 py-3 align-top">
                                  {formatCurrency(Math.round(line.totalDeductions))}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  {line.varianceWarnings.length ? (
                                    <div className="flex flex-col gap-1.5">
                                      {line.varianceWarnings.map((warning) => (
                                        <span
                                          key={`${line.id}-${warning.code}`}
                                          className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                            warning.severity === 'high'
                                              ? 'bg-red-50 text-red-700'
                                              : 'bg-amber-50 text-amber-800'
                                          }`}
                                          title={warning.message}
                                        >
                                          <CircleAlert size={12} aria-hidden="true" />
                                          {warning.deltaPercent === null
                                            ? formatCurrency(Math.round(Math.abs(warning.delta)))
                                            : `${Math.abs(Math.round(warning.deltaPercent))}%`}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs font-medium text-neutral-400">Clear</span>
                                  )}
                                </td>
                                <td className="tabular px-4 py-3 align-top font-semibold text-[var(--vf-navy)]">
                                  {formatCurrency(Math.round(line.netPay))}
                                </td>
                                <td className="px-4 py-3 align-top">
                                  {line.payslip ? (
                                    <button
                                      type="button"
                                      onClick={() => void handleDownloadPayslip(line.payslip!.id)}
                                      disabled={isSubmitting}
                                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                      <Download size={13} aria-hidden="true" />
                                      Download
                                    </button>
                                  ) : selectedPayrollRun?.status === 'finalized' ? (
                                    <span className="inline-flex min-h-9 items-center rounded-lg bg-[var(--vf-cream)] px-3 text-xs font-semibold text-[var(--vf-brown)]">
                                      Ready
                                    </span>
                                  ) : (
                                    <span className="text-xs font-medium text-neutral-400">After finalization</span>
                                  )}
                                  {line.payslip?.publishedAt ? (
                                    <p className="mt-1 text-[11px] text-neutral-500">
                                      {formatDate(line.payslip.publishedAt)}
                                    </p>
                                  ) : null}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td className="px-4 py-5 text-sm text-neutral-500" colSpan={9}>
                              {displayedPayrollRun
                                ? 'Open details to load saved payroll lines.'
                                : 'No payroll run selected.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
              </div>
            </section>

            <section className={`${resolvedActiveSection === 'organization' ? 'grid' : 'hidden'} gap-6 xl:grid-cols-3`}>
              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm xl:col-span-3">
                <div className="flex flex-col gap-4 border-b border-[color:var(--vf-border)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Organization preferences</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--vf-text-muted)]">
                      These defaults control payroll currency, document formatting, and reporting cutoffs.
                    </p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--vf-primary-soft)] text-[var(--vf-primary)]">
                    <Globe2 size={19} aria-hidden="true" />
                  </div>
                </div>

                {canManageOrganizationPreferences ? (
                  <form onSubmit={handleSaveOrganization} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <label className="block xl:col-span-2">
                      <span className="text-sm font-medium text-slate-800">Organization name</span>
                      <input
                        className={`${formControlClass} mt-2`}
                        maxLength={120}
                        onChange={(event) =>
                          setOrganizationForm((current) => ({ ...current, name: event.target.value }))
                        }
                        required
                        value={organizationForm.name}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-800">Country</span>
                      <select
                        className={formControlClass}
                        onChange={(event) => {
                          const country = getCountryOption(event.target.value)

                          if (!country) {
                            return
                          }

                          setOrganizationForm((current) => ({
                            ...current,
                            countryCode: country.code,
                            currencyCode: country.currencyCode,
                            locale: country.locale,
                            timezone: country.timezones[0],
                          }))
                        }}
                        required
                        value={organizationForm.countryCode}
                      >
                        {countryOptions.map((country) => (
                          <option key={country.code} value={country.code}>{country.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-800">Currency</span>
                      <select
                        className={formControlClass}
                        onChange={(event) =>
                          setOrganizationForm((current) => ({ ...current, currencyCode: event.target.value }))
                        }
                        required
                        value={organizationForm.currencyCode}
                      >
                        {currencyOptions.map((currency) => (
                          <option key={currency.code} value={currency.code}>{currency.code} - {currency.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-800">Locale</span>
                      <select
                        className={formControlClass}
                        onChange={(event) =>
                          setOrganizationForm((current) => ({ ...current, locale: event.target.value }))
                        }
                        required
                        value={organizationForm.locale}
                      >
                        {localeOptions.map((locale) => (
                          <option key={locale.code} value={locale.code}>{locale.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block md:col-span-2 xl:col-span-3">
                      <span className="text-sm font-medium text-slate-800">Timezone</span>
                      <select
                        className={formControlClass}
                        onChange={(event) =>
                          setOrganizationForm((current) => ({ ...current, timezone: event.target.value }))
                        }
                        required
                        value={organizationForm.timezone}
                      >
                        {timezoneOptions.map((timezone) => (
                          <option key={timezone} value={timezone}>{timezone.replaceAll('_', ' ')}</option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-end md:col-span-2 xl:col-span-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--vf-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 size={17} aria-hidden="true" />
                        {isSubmitting ? 'Saving settings' : 'Save preferences'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                      ['Organization', organizationForm.name],
                      ['Country', organizationFormCountry?.label ?? organizationForm.countryCode],
                      ['Currency', organizationForm.currencyCode],
                      ['Locale', organizationForm.locale],
                      ['Timezone', organizationForm.timezone],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-[var(--vf-surface-raised)] p-3">
                        <dt className="text-xs font-semibold uppercase text-[var(--vf-text-muted)]">{label}</dt>
                        <dd className="mt-1 break-words text-sm font-semibold text-[var(--vf-navy)]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="mt-5 grid gap-3 border-t border-[color:var(--vf-border)] pt-5 md:grid-cols-3">
                  <div className="rounded-lg bg-[var(--vf-surface-raised)] p-4">
                    <p className="text-xs font-semibold uppercase text-[var(--vf-primary)]">Payroll automation</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--vf-navy)]">{organizationPreferencePreview.currency}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--vf-text-muted)]">New runs, reports, and payslips use {organizationForm.currencyCode}.</p>
                  </div>
                  <div className="rounded-lg bg-[var(--vf-surface-raised)] p-4">
                    <p className="text-xs font-semibold uppercase text-[var(--vf-primary)]">Document automation</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--vf-navy)]">{organizationPreferencePreview.date}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--vf-text-muted)]">ID cards and payroll documents follow {organizationForm.locale}.</p>
                  </div>
                  <div className="rounded-lg bg-[var(--vf-surface-raised)] p-4">
                    <p className="text-xs font-semibold uppercase text-[var(--vf-primary)]">Reporting cutoff</p>
                    <p className="mt-2 text-sm font-semibold text-[var(--vf-navy)]">{organizationPreferencePreview.time}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--vf-text-muted)]">Attendance periods and operating dates follow {organizationForm.timezone.replaceAll('_', ' ')}.</p>
                  </div>
                </div>
              </article>

              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Departments</h2>
                  <Building2 size={19} className="text-neutral-400" aria-hidden="true" />
                </div>
                <div className="mt-5 space-y-2">
                  {masterData.departments.map((department) => (
                    <div
                      key={department.id}
                      className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-[color:rgba(231,235,240,0.34)] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-800">{department.name}</p>
                        <StatusBadge className="mt-1" tone={department.isActive ? 'success' : 'neutral'}>
                          {department.isActive ? 'Active' : 'Archived'}
                        </StatusBadge>
                      </div>
                      {canManageMasterData ? (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditDepartment(department)}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)]"
                            aria-label={`Edit ${department.name}`}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleArchiveDepartment(department)}
                            disabled={isSubmitting || !department.isActive}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] text-[var(--vf-brown)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-45"
                            aria-label={`Archive ${department.name}`}
                          >
                            <Archive size={15} aria-hidden="true" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                {canManageMasterData ? (
                  <form onSubmit={handleSaveDepartment} className="mt-5 space-y-3">
                    <label className="block">
                      <span className="sr-only">Department name</span>
                      <input
                        className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                        aria-invalid={Boolean(fieldErrors.departmentName)}
                        onChange={(event) => {
                          clearFieldError('departmentName')
                          setDepartmentForm((current) => ({ ...current, name: event.target.value }))
                        }}
                        placeholder={editingDepartmentId ? 'Department name' : 'Add department'}
                        required
                        value={departmentForm.name}
                      />
                      {fieldErrors.departmentName ? (
                        <span className="mt-2 block text-xs font-medium text-red-700" role="alert">
                          {fieldErrors.departmentName}
                        </span>
                      ) : null}
                    </label>
                    {editingDepartmentId ? (
                      <label className="flex min-h-10 items-center gap-3 rounded-lg border border-[color:var(--vf-border)] px-3 text-sm font-medium text-[var(--vf-navy)]">
                        <input
                          checked={departmentForm.isActive}
                          onChange={(event) =>
                            setDepartmentForm((current) => ({ ...current, isActive: event.target.checked }))
                          }
                          type="checkbox"
                        />
                        Active department
                      </label>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {editingDepartmentId ? <Pencil size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
                        {editingDepartmentId ? 'Update department' : 'Add department'}
                      </button>
                      {editingDepartmentId ? (
                        <button
                          type="button"
                          onClick={handleCancelDepartmentEdit}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[color:var(--vf-border)] px-3 text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)]"
                          aria-label="Cancel department edit"
                        >
                          <X size={17} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </form>
                ) : null}
              </article>

              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Locations</h2>
                  <MapPin size={19} className="text-neutral-400" aria-hidden="true" />
                </div>
                <div className="mt-5 space-y-2">
                  {masterData.locations.map((location) => (
                    <div key={location.id} className="rounded-lg bg-[color:rgba(231,235,240,0.34)] px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-800">{location.name}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {location.city}, {location.state}
                          </p>
                          <StatusBadge className="mt-2" tone={location.isActive ? 'success' : 'neutral'}>
                            {location.isActive ? 'Active' : 'Archived'}
                          </StatusBadge>
                        </div>
                        {canManageMasterData ? (
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditLocation(location)}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)]"
                              aria-label={`Edit ${location.name}`}
                            >
                              <Pencil size={15} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleArchiveLocation(location)}
                              disabled={isSubmitting || !location.isActive}
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] text-[var(--vf-brown)] transition hover:bg-[var(--vf-cream)] disabled:cursor-not-allowed disabled:opacity-45"
                              aria-label={`Archive ${location.name}`}
                            >
                              <Archive size={15} aria-hidden="true" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                {canManageMasterData ? (
                  <form onSubmit={handleSaveLocation} className="mt-5 space-y-2">
                    <label className="block">
                      <span className="sr-only">Location name</span>
                      <input
                        className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                        aria-invalid={Boolean(fieldErrors.locationName)}
                        onChange={(event) => {
                          clearFieldError('locationName')
                          setLocationForm((current) => ({ ...current, name: event.target.value }))
                        }}
                        placeholder="Location name"
                        required
                        value={locationForm.name}
                      />
                      {fieldErrors.locationName ? (
                        <span className="mt-2 block text-xs font-medium text-red-700" role="alert">
                          {fieldErrors.locationName}
                        </span>
                      ) : null}
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label>
                        <span className="sr-only">City</span>
                        <input
                          className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                          onChange={(event) => setLocationForm((current) => ({ ...current, city: event.target.value }))}
                          placeholder="City"
                          required
                          value={locationForm.city}
                        />
                      </label>
                      <label>
                        <span className="sr-only">State</span>
                        <input
                          className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                          onChange={(event) => setLocationForm((current) => ({ ...current, state: event.target.value }))}
                          placeholder="State"
                          required
                          value={locationForm.state}
                        />
                      </label>
                    </div>
                    {editingLocationId ? (
                      <label className="flex min-h-10 items-center gap-3 rounded-lg border border-[color:var(--vf-border)] px-3 text-sm font-medium text-[var(--vf-navy)]">
                        <input
                          checked={locationForm.isActive}
                          onChange={(event) =>
                            setLocationForm((current) => ({ ...current, isActive: event.target.checked }))
                          }
                          type="checkbox"
                        />
                        Active location
                      </label>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {editingLocationId ? <Pencil size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
                        {editingLocationId ? 'Update location' : 'Add location'}
                      </button>
                      {editingLocationId ? (
                        <button
                          type="button"
                          onClick={handleCancelLocationEdit}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[color:var(--vf-border)] px-3 text-[var(--vf-navy)] transition hover:bg-[var(--vf-cream)]"
                          aria-label="Cancel location edit"
                        >
                          <X size={17} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </form>
                ) : null}
              </article>

              <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Compensation</h2>
                  <WalletCards size={19} className="text-neutral-400" aria-hidden="true" />
                </div>
                {canRecordSalary && selectedEmployee ? (
                  <form onSubmit={handleRecordSalary} className="mt-5 space-y-3">
                    <label className="block">
                      <span className="text-sm font-medium text-neutral-800">Annual compensation</span>
                      <input
                        className="mt-2 min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                        min={0}
                        onChange={(event) => setSalaryForm((current) => ({ ...current, annualCompensation: event.target.value }))}
                        required
                        type="number"
                        value={salaryForm.annualCompensation}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-neutral-800">Effective date</span>
                      <input
                        className="mt-2 min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                        onChange={(event) => setSalaryForm((current) => ({ ...current, effectiveFrom: event.target.value }))}
                        required
                        type="date"
                        value={salaryForm.effectiveFrom}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-neutral-800">Reason</span>
                      <input
                        className="mt-2 min-h-11 w-full rounded-lg border border-[color:var(--vf-border)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                        onChange={(event) => setSalaryForm((current) => ({ ...current, reason: event.target.value }))}
                        required
                        value={salaryForm.reason}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--vf-brown)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-brown-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CalendarCheck size={17} aria-hidden="true" />
                      Record revision
                    </button>
                  </form>
                ) : (
                  <p className="mt-5 text-sm leading-6 text-neutral-500">
                    Salary changes are available to payroll roles.
                  </p>
                )}
              </article>
            </section>

            {canManageAccess && resolvedActiveSection === 'access' ? (
              <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
                <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-[var(--vf-shadow-sm)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Invite a member</h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--vf-text-muted)]">
                        Send a secure invitation and assign the member's starting role.
                      </p>
                    </div>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--vf-primary-soft)] text-[var(--vf-primary)]">
                      <UserPlus size={19} aria-hidden="true" />
                    </div>
                  </div>

                  <form onSubmit={handleInviteUser} className="mt-5 space-y-4">
                    <label className="block">
                      <span className="text-sm font-medium text-slate-800">Full name</span>
                      <input
                        autoComplete="name"
                        className={formControlClass}
                        maxLength={120}
                        onChange={(event) =>
                          setInvitationForm((current) => ({ ...current, fullName: event.target.value }))
                        }
                        required
                        value={invitationForm.fullName}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-800">Work email</span>
                      <input
                        autoComplete="email"
                        className={formControlClass}
                        onChange={(event) =>
                          setInvitationForm((current) => ({ ...current, email: event.target.value }))
                        }
                        required
                        type="email"
                        value={invitationForm.email}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-slate-800">Role</span>
                      <select
                        className={formControlClass}
                        onChange={(event) =>
                          setInvitationForm((current) => ({
                            ...current,
                            role: event.target.value as InvitationFormState['role'],
                          }))
                        }
                        value={invitationForm.role}
                      >
                        {assignableInvitationRoles.map((role) => (
                          <option key={role} value={role}>{invitationRoleLabels[role]}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={isSubmitting || !isSupabaseConfigured}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--vf-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-primary-hover)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Mail size={17} aria-hidden="true" />
                      {isSubmitting ? 'Sending invitation' : 'Send invitation'}
                    </button>
                    {!isSupabaseConfigured ? (
                      <p className="text-xs leading-5 text-[var(--vf-text-muted)]">
                        Connect Supabase Auth to send real invitations.
                      </p>
                    ) : null}
                  </form>
                </article>

                <article className="min-w-0 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] shadow-[var(--vf-shadow-sm)]">
                  <div className="flex flex-col gap-3 border-b border-[color:var(--vf-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Organization members</h2>
                      <p className="mt-1 text-sm text-[var(--vf-text-muted)]">
                        {accessState === 'loading'
                          ? 'Loading access assignments'
                          : `${organizationMembers.length} member${organizationMembers.length === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadOrganizationMembers()}
                      disabled={accessState === 'loading' || !isSupabaseConfigured}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--vf-border-strong)] px-3 text-xs font-semibold text-[var(--vf-navy)] transition hover:bg-[var(--vf-primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw size={14} aria-hidden="true" />
                      Refresh
                    </button>
                  </div>

                  {accessState === 'error' ? (
                    <div className="m-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                      Member access could not be loaded. Confirm the backend service key and try again.
                    </div>
                  ) : organizationMembers.length ? (
                    <div className="divide-y divide-[color:var(--vf-border)]">
                      {organizationMembers.map((member) => (
                        <div key={member.userId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--vf-navy)]">{member.fullName}</p>
                            <p className="mt-1 truncate text-sm text-[var(--vf-text-muted)]">{member.email}</p>
                            <p className="mt-1 text-xs text-slate-400">Added {formatDate(member.createdAt)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {member.roles.length ? (
                              member.roles.map((role) => (
                                <StatusBadge key={role} tone={role === 'employee' ? 'neutral' : 'info'}>
                                  {formatLabel(role)}
                                </StatusBadge>
                              ))
                            ) : (
                              <StatusBadge tone="warning">Role pending</StatusBadge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-[var(--vf-text-muted)]">
                      {accessState === 'loading' ? 'Loading members...' : 'No organization members are available yet.'}
                    </div>
                  )}
                </article>
              </section>
            ) : null}

            <section className={`${resolvedActiveSection === 'audit' ? 'block' : 'hidden'} rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--vf-navy)]">Audit trail</h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {filteredAuditEntries.length} of {masterData.auditEntries.length} changes in view
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:w-[520px]">
                  <label className="block">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
                      <SlidersHorizontal size={14} aria-hidden="true" />
                      Entity
                    </span>
                    <select
                      className="mt-2 min-h-10 w-full rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                      onChange={(event) => setAuditEntityFilter(event.target.value as AuditEntityFilter)}
                      value={auditEntityFilter}
                    >
                      <option value="all">All entities</option>
                      <option value="employee">Employees</option>
                      <option value="department">Departments</option>
                      <option value="work_location">Locations</option>
                      <option value="salary_revision">Salary revisions</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase text-neutral-500">
                      <History size={14} aria-hidden="true" />
                      Employee
                    </span>
                    <select
                      className="mt-2 min-h-10 w-full rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-3 text-sm outline-none transition focus:border-[var(--vf-brown)] focus:ring-3 focus:ring-[color:rgba(29,95,209,0.18)]"
                      onChange={(event) => setAuditEmployeeFilter(event.target.value)}
                      value={auditEmployeeFilter}
                    >
                      <option value="all">All employees</option>
                      {masterData.employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredAuditEntries.length ? (
                  filteredAuditEntries.map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-[color:var(--vf-border)] p-4">
                      <p className="text-sm font-semibold text-[var(--vf-navy)]">{entry.action.replaceAll('_', ' ')}</p>
                      <p className="mt-2 text-xs text-neutral-500">
                        {entry.entityType} · {formatDate(entry.createdAt)}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-neutral-500">No audit entries match these filters.</p>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
      </main>
      <IdCardPrintAnimation
        employee={idCardPrintJob?.employee ?? null}
        organizationName={masterData.organization?.name}
        stage={idCardPrintJob?.stage ?? null}
      />
    </>
  )
}

function App() {
  if (window.location.pathname.startsWith('/login')) {
    return <WorkspaceApp forceAccountChoice />
  }

  return window.location.pathname.startsWith('/app') ? <WorkspaceApp /> : <PublicSite />
}

export default App
