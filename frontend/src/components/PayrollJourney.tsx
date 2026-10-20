import { ArrowRight, CheckCircle2 } from 'lucide-react'
import {
  getAllowedWorkspaceSections,
  type WorkspaceRole,
  type WorkspaceSection,
} from './workspace-navigation-model'

type Props = {
  period: string
  role: WorkspaceRole
  attendanceLocked: boolean
  payrollStatus: string
  payslipCount: number
  onNavigate: (section: WorkspaceSection) => void
}
export function PayrollJourney(props: Props) {
  if (props.role === 'manager' || props.role === 'employee') return null
  const allowedSections = getAllowedWorkspaceSections([props.role])
  const steps = [
    { title: 'People', role: 'HR', section: 'employees', complete: true },
    { title: 'Time & leave', role: 'HR + managers', section: 'attendance', complete: props.attendanceLocked },
    {
      title: 'Calculate',
      role: 'Finance',
      section: 'payroll',
      complete: props.payrollStatus !== 'Not started',
    },
    {
      title: 'Approve',
      role: 'Owner + finance',
      section: 'payroll',
      complete: ['Approved', 'Finalized'].includes(props.payrollStatus),
    },
    { title: 'Publish payslips', role: 'Finance', section: 'payroll', complete: props.payslipCount > 0 },
  ] as const
  return (
    <section aria-label="Monthly payroll journey" className="border-y border-[color:var(--vf-border)] py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Monthly workflow</h2>
        <p className="text-xs text-[var(--vf-text-muted)]">{props.period}</p>
      </div>
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {steps.map((step, index) => (
          <li key={step.title}>
            <button
              className="flex min-h-16 w-full items-center gap-3 text-left disabled:cursor-default"
              disabled={!allowedSections.includes(step.section)}
              title={!allowedSections.includes(step.section) ? `Managed by ${step.role}` : undefined}
              onClick={() => props.onNavigate(step.section)}
              type="button"
            >
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${step.complete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}
              >
                {step.complete ? <CheckCircle2 size={17} aria-label="Complete" /> : index + 1}
              </span>
              <span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {step.title}
                  {allowedSections.includes(step.section) ? (
                    <ArrowRight size={13} aria-hidden="true" />
                  ) : null}
                </span>
                <span className="mt-1 block text-xs text-[var(--vf-text-muted)]">{step.role}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
