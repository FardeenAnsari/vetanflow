import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import type { WorkspaceRole, WorkspaceSection } from './workspace-navigation-model'
import { StatusBadge, type StatusTone } from './StatusBadge'

type OverviewMetric = {
  detail: string
  icon: typeof UsersRound
  label: string
  tone: StatusTone
  value: string
}

type OperationsOverviewProps = {
  activeEmployees: number
  attendanceLocked: boolean
  departmentCount: number
  formattedMonthlyPayroll: string
  headcount: number
  locationCount: number
  lossOfPayDays: number
  missingBankDetails: number
  onNavigate: (section: WorkspaceSection) => void
  payrollStatus: string
  payrollWarnings: number
  pendingLeaveRequests: number
  primaryRole: WorkspaceRole
}

const roleCopy: Record<WorkspaceRole, { eyebrow: string; title: string; description: string }> = {
  owner: {
    eyebrow: 'Organization health',
    title: 'Operations command center',
    description: 'Monitor workforce readiness, payroll controls, and exceptions across the organization.',
  },
  admin: {
    eyebrow: 'System readiness',
    title: 'Administration control center',
    description: 'Keep teams, locations, access, and payroll operations ready for every cycle.',
  },
  hr: {
    eyebrow: 'People operations',
    title: 'Workforce command center',
    description: 'Manage employee lifecycle, leave decisions, attendance quality, and payroll inputs.',
  },
  finance: {
    eyebrow: 'Finance operations',
    title: 'Payroll control center',
    description: 'Review payroll readiness, resolve variances, approve runs, and release accurate payments.',
  },
  manager: {
    eyebrow: 'Team operations',
    title: 'Manager action center',
    description: 'Review pending team decisions and keep attendance inputs ready for the payroll cutoff.',
  },
  employee: {
    eyebrow: 'Personal workspace',
    title: 'Your payroll overview',
    description: 'Track your profile, leave requests, and payroll documents in one place.',
  },
}

function getMetrics(props: OperationsOverviewProps): OverviewMetric[] {
  const payrollHasStarted = props.payrollStatus !== 'Not started'
  const shared = {
    workforce: {
      detail: `${props.activeEmployees} active employees`,
      icon: UsersRound,
      label: 'Workforce',
      tone: 'info' as const,
      value: String(props.headcount),
    },
    leave: {
      detail: props.pendingLeaveRequests ? 'Decisions waiting for review' : 'All requests reviewed',
      icon: CalendarCheck,
      label: 'Pending leave',
      tone: (props.pendingLeaveRequests ? 'warning' : 'success') as StatusTone,
      value: String(props.pendingLeaveRequests),
    },
    payroll: {
      detail: payrollHasStarted ? `Current run: ${props.payrollStatus}` : 'Payroll run awaiting generation',
      icon: WalletCards,
      label: 'Monthly payroll',
      tone: (props.payrollWarnings || !payrollHasStarted ? 'warning' : 'success') as StatusTone,
      value: props.formattedMonthlyPayroll,
    },
    attendance: {
      detail: `${props.lossOfPayDays} loss-of-pay days flagged`,
      icon: Clock3,
      label: 'Attendance period',
      tone: (props.attendanceLocked ? 'success' : 'warning') as StatusTone,
      value: props.attendanceLocked ? 'Locked' : 'Open',
    },
  }

  if (props.primaryRole === 'finance') {
    return [
      shared.payroll,
      {
        detail: props.payrollWarnings ? 'Review before approval' : 'No material variance flags',
        icon: CircleAlert,
        label: 'Variance flags',
        tone: props.payrollWarnings ? 'danger' : 'success',
        value: String(props.payrollWarnings),
      },
      shared.attendance,
      {
        detail: props.missingBankDetails ? 'Employee records need attention' : 'All payment details complete',
        icon: ShieldCheck,
        label: 'Payment readiness',
        tone: props.missingBankDetails ? 'warning' : 'success',
        value: props.missingBankDetails ? `${props.missingBankDetails} missing` : 'Ready',
      },
    ]
  }

  if (props.primaryRole === 'manager') {
    return [shared.leave, shared.attendance, shared.workforce]
  }

  if (props.primaryRole === 'hr') {
    return [shared.workforce, shared.leave, shared.attendance, {
      detail: props.missingBankDetails ? 'Profiles need payment details' : 'Employee records complete',
      icon: ShieldCheck,
      label: 'Profile readiness',
      tone: props.missingBankDetails ? 'warning' : 'success',
      value: props.missingBankDetails ? `${props.missingBankDetails} missing` : 'Ready',
    }]
  }

  if (props.primaryRole === 'admin') {
    return [shared.workforce, {
      detail: `${props.locationCount} active workplaces`,
      icon: ShieldCheck,
      label: 'Organization setup',
      tone: 'success',
      value: `${props.departmentCount} teams`,
    }, shared.attendance, shared.payroll]
  }

  return [shared.workforce, shared.payroll, shared.leave, shared.attendance]
}

export function OperationsOverview(props: OperationsOverviewProps) {
  const copy = roleCopy[props.primaryRole]
  const metrics = getMetrics(props)
  const canOpenPayroll = ['owner', 'admin', 'hr', 'finance'].includes(props.primaryRole)
  const payrollHasStarted = props.payrollStatus !== 'Not started'
  const teamHasExceptions = props.pendingLeaveRequests > 0 || props.lossOfPayDays > 0
  const payrollSteps = [
    { complete: props.attendanceLocked, label: 'Attendance locked' },
    { complete: props.payrollStatus !== 'Not started', label: 'Run generated' },
    { complete: ['Approved', 'Finalized'].includes(props.payrollStatus), label: 'Run approved' },
    { complete: props.payrollStatus === 'Finalized', label: 'Payroll finalized' },
  ]
  const actionItems =
    props.primaryRole === 'manager'
      ? [
          {
            count: props.pendingLeaveRequests,
            label: 'Leave requests awaiting decision',
            section: 'leave' as const,
            tone: props.pendingLeaveRequests ? 'warning' as const : 'success' as const,
          },
          {
            count: props.lossOfPayDays,
            label: 'Attendance exceptions to review',
            section: 'attendance' as const,
            tone: props.lossOfPayDays ? 'danger' as const : 'success' as const,
          },
        ]
      : props.primaryRole === 'finance'
        ? [
            {
              count: props.missingBankDetails,
              label: 'Employee payment profiles incomplete',
              section: 'employees' as const,
              tone: props.missingBankDetails ? 'danger' as const : 'success' as const,
            },
            {
              count: props.payrollWarnings,
              label: 'Payroll variance checks open',
              section: 'payroll' as const,
              tone: props.payrollWarnings ? 'warning' as const : 'success' as const,
            },
          ]
        : [
          {
            count: props.pendingLeaveRequests,
            label: 'Leave requests awaiting decision',
            section: 'leave' as const,
            tone: props.pendingLeaveRequests ? 'warning' as const : 'success' as const,
          },
          {
            count: props.missingBankDetails,
            label: 'Employee payment profiles incomplete',
            section: 'employees' as const,
            tone: props.missingBankDetails ? 'danger' as const : 'success' as const,
          },
          {
            count: props.payrollWarnings,
            label: 'Payroll variance checks open',
            section: 'payroll' as const,
            tone: props.payrollWarnings ? 'warning' as const : 'success' as const,
          },
        ]

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-navy)] text-white shadow-[var(--vf-shadow-md)]">
        <div className="grid gap-8 px-5 py-6 md:px-7 md:py-8 xl:grid-cols-[1.3fr_0.7fr] xl:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-[color:rgba(255,255,255,0.68)]">{copy.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{copy.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:rgba(255,255,255,0.72)] md:text-base">
              {copy.description}
            </p>
          </div>
          <div className="rounded-lg border border-[color:rgba(255,255,255,0.16)] bg-[color:rgba(255,255,255,0.07)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[color:rgba(255,255,255,0.58)]">Cycle status</p>
                <p className="mt-1 text-lg font-semibold">{props.payrollStatus}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-[color:rgba(255,255,255,0.1)]">
                <LockKeyhole size={19} aria-hidden="true" />
              </div>
            </div>
            <p className="mt-4 text-sm text-[color:rgba(255,255,255,0.7)]">
              {props.attendanceLocked ? 'Attendance inputs are protected.' : 'Attendance is still open for changes.'}
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Workspace metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <article key={metric.label} className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-[var(--vf-shadow-sm)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--vf-text-muted)]">{metric.label}</p>
                  <p className="tabular mt-2 break-words text-2xl font-semibold text-[var(--vf-navy)]">{metric.value}</p>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--vf-primary-soft)] text-[var(--vf-primary)]">
                  <Icon size={19} aria-hidden="true" />
                </div>
              </div>
              <StatusBadge className="mt-4" tone={metric.tone}>{metric.detail}</StatusBadge>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-[var(--vf-shadow-sm)] md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--vf-navy)]">
                {canOpenPayroll ? 'Payroll readiness' : 'Team readiness'}
              </h3>
              <p className="mt-1 text-sm text-[var(--vf-text-muted)]">
                {canOpenPayroll
                  ? 'A controlled path from time inputs to payment release.'
                  : 'Keep team decisions and time inputs ready before the payroll cutoff.'}
              </p>
            </div>
            <StatusBadge
              tone={canOpenPayroll
                ? props.payrollWarnings || !payrollHasStarted ? 'warning' : 'success'
                : teamHasExceptions || !props.attendanceLocked ? 'warning' : 'success'}
            >
              {canOpenPayroll
                ? props.payrollWarnings
                  ? `${props.payrollWarnings} checks`
                  : payrollHasStarted
                    ? 'On track'
                    : 'Ready to start'
                : teamHasExceptions
                  ? 'Review needed'
                  : props.attendanceLocked
                    ? 'Team ready'
                    : 'Ready to lock'}
            </StatusBadge>
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {(canOpenPayroll
              ? payrollSteps
              : [
                  { complete: props.pendingLeaveRequests === 0, label: 'Leave decisions complete' },
                  { complete: props.lossOfPayDays === 0, label: 'Attendance exceptions clear' },
                  { complete: props.attendanceLocked, label: 'Attendance period locked' },
                ]
            ).map((step, index) => (
              <li key={step.label} className="flex min-h-14 items-center gap-3 rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-surface-raised)] px-3 py-2.5">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.complete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {step.complete ? <CheckCircle2 size={16} aria-hidden="true" /> : index + 1}
                </span>
                <span className="text-sm font-semibold text-[var(--vf-navy)]">{step.label}</span>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => props.onNavigate(canOpenPayroll ? 'payroll' : 'attendance')}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--vf-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--vf-primary-hover)] active:scale-[0.98]"
          >
            {canOpenPayroll ? 'Open payroll workspace' : 'Open attendance review'}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </article>

        <article className="rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-[var(--vf-shadow-sm)] md:p-6">
          <h3 className="text-lg font-semibold text-[var(--vf-navy)]">Action queue</h3>
          <p className="mt-1 text-sm text-[var(--vf-text-muted)]">Items that may block the current cycle.</p>
          <div className="mt-5 space-y-3">
            {actionItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => props.onNavigate(item.section)}
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-[color:var(--vf-border)] px-3 py-2 text-left transition hover:border-[color:var(--vf-primary-border)] hover:bg-[var(--vf-primary-soft)]"
              >
                <span className="text-sm font-medium text-[var(--vf-navy)]">{item.label}</span>
                <StatusBadge tone={item.tone}>{item.count || 'Clear'}</StatusBadge>
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
