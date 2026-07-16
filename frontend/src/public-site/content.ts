import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  Banknote,
  CalendarCheck,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  ScanLine,
  UsersRound,
  WalletCards,
} from 'lucide-react'

export type JourneyStep = {
  detail: string
  eyebrow: string
  icon: LucideIcon
  id: string
  metric: string
  title: string
}

export const journeySteps: JourneyStep[] = [
  {
    detail: 'An owner creates the organization, chooses regional defaults, and assigns trusted operators.',
    eyebrow: 'Foundation',
    icon: Fingerprint,
    id: 'organization',
    metric: '1 controlled workspace',
    title: 'Create the organization',
  },
  {
    detail: 'HR adds employment, compensation, department, location, reporting line, and payout details once.',
    eyebrow: 'People',
    icon: UsersRound,
    id: 'employee',
    metric: 'One employee record',
    title: 'Build the employee record',
  },
  {
    detail: 'Employees request leave while managers and HR review, escalate, approve, or reject with a recorded reason.',
    eyebrow: 'Workflow',
    icon: CalendarCheck,
    id: 'leave',
    metric: 'Every decision recorded',
    title: 'Route leave decisions',
  },
  {
    detail: 'Attendance, overtime, holidays, paid leave, and loss of pay are reviewed before the month is locked.',
    eyebrow: 'Time inputs',
    icon: ScanLine,
    id: 'attendance',
    metric: 'Locked source month',
    title: 'Validate payroll inputs',
  },
  {
    detail: 'The payroll engine calculates earnings and explicit deductions, then stores a reproducible snapshot per person.',
    eyebrow: 'Calculation',
    icon: Banknote,
    id: 'payroll',
    metric: 'Deterministic run lines',
    title: 'Generate the payroll run',
  },
  {
    detail: 'A different authorized operator reviews variance, approves the run, and finalizes immutable payroll records.',
    eyebrow: 'Control',
    icon: LockKeyhole,
    id: 'approval',
    metric: 'Maker-checker enforced',
    title: 'Approve and finalize',
  },
  {
    detail: 'Private PDF payslips are published to employees while finance receives payout and cost-analysis exports.',
    eyebrow: 'Delivery',
    icon: FileCheck2,
    id: 'payslip',
    metric: 'Signed access only',
    title: 'Deliver payslips and exports',
  },
]

export const roleStories = [
  { label: 'Owner', summary: 'Organization, access, controls, audit, and complete operating visibility.' },
  { label: 'Admin', summary: 'People operations, platform configuration, workflow execution, and reporting.' },
  { label: 'HR', summary: 'Employee records, compensation history, leave queues, and attendance readiness.' },
  { label: 'Finance', summary: 'Payroll review, approval controls, payout readiness, and cost exports.' },
  { label: 'Manager', summary: 'Direct-report attendance and leave decisions without payroll-wide exposure.' },
  { label: 'Employee', summary: 'Digital ID, personal records, leave requests, compensation, and payslips.' },
]

export type BlogArticle = {
  description: string
  eyebrow: string
  paragraphs: string[]
  publishedAt: string
  readTime: string
  slug: string
  title: string
}

export const blogArticles: BlogArticle[] = [
  {
    description: 'Why payroll should be modeled as a controlled monthly workflow instead of a single calculation button.',
    eyebrow: 'Payroll operations',
    paragraphs: [
      'Payroll becomes trustworthy when every result can be traced back to approved people data, reviewed time inputs, and an identified operator. A calculator can produce a number; an operations system must explain where that number came from.',
      'VetanFlow starts with an employee record, captures payroll-impacting events, locks the source month, and only then creates run lines. The calculation snapshot stays attached to each employee so a later review does not depend on whatever the current settings happen to be.',
      'Approval is deliberately separated from preparation. That maker-checker boundary reduces accidental self-approval and gives the final payroll run a clear history before payslips and finance exports are released.',
    ],
    publishedAt: 'July 16, 2026',
    readTime: '5 min read',
    slug: 'payroll-as-a-controlled-workflow',
    title: 'Payroll is a workflow, not a button',
  },
  {
    description: 'A practical explanation of role boundaries across owners, HR teams, finance operators, managers, and employees.',
    eyebrow: 'Access control',
    paragraphs: [
      'Role design is useful only when it changes both what a person can see and what they can do. Hiding a button is not authorization. VetanFlow combines distinct role workspaces with backend tenant checks and database policies.',
      'Managers receive the narrowest operational view needed for their direct reports. Finance can run payroll without becoming a people administrator. Employees receive a separate self-service experience instead of a disabled version of an administrator dashboard.',
      'Sensitive compensation and payout fields are not available through ordinary authenticated table reads. Authorized backend services retrieve them only after resolving the organization and role boundary for the current request.',
    ],
    publishedAt: 'July 12, 2026',
    readTime: '6 min read',
    slug: 'designing-role-boundaries',
    title: 'Designing role boundaries people can understand',
  },
  {
    description: 'How immutable snapshots, private documents, and signed downloads make a payslip explainable and controlled.',
    eyebrow: 'Documents',
    paragraphs: [
      'A payslip is the published output of a payroll decision. It should not silently change because an employee record or deduction setting was edited after payroll closed.',
      'VetanFlow generates documents from finalized payroll snapshots and stores them in a private bucket. The employee portal asks the backend for a short-lived signed URL only after access has been checked.',
      'The same finalized run supports payout, deduction, and department-cost exports. Every output therefore shares the same source record instead of being assembled from loosely related spreadsheets.',
    ],
    publishedAt: 'July 8, 2026',
    readTime: '4 min read',
    slug: 'from-finalized-run-to-payslip',
    title: 'From finalized payroll to a private payslip',
  },
]

export const trustSignals = [
  { icon: BadgeCheck, label: 'Explicit role boundaries' },
  { icon: LockKeyhole, label: 'Immutable finalized payroll' },
  { icon: WalletCards, label: 'Private payout information' },
]
