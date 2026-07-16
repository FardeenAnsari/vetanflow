import {
  Building2,
  CalendarCheck,
  Clock3,
  History,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import {
  getAllowedWorkspaceSections,
  type WorkspaceRole,
  type WorkspaceSection,
} from './workspace-navigation-model'

type NavigationItem = {
  icon: typeof LayoutDashboard
  label: string
  section: WorkspaceSection
}

const navigationItems: NavigationItem[] = [
  { icon: LayoutDashboard, label: 'Overview', section: 'overview' },
  { icon: UsersRound, label: 'People', section: 'employees' },
  { icon: CalendarCheck, label: 'Leave', section: 'leave' },
  { icon: Clock3, label: 'Time & attendance', section: 'attendance' },
  { icon: WalletCards, label: 'Payroll', section: 'payroll' },
  { icon: Building2, label: 'Organization', section: 'organization' },
  { icon: ShieldCheck, label: 'Access & roles', section: 'access' },
  { icon: History, label: 'Audit', section: 'audit' },
]

type WorkspaceNavigationProps = {
  activeSection: WorkspaceSection
  onNavigate: (section: WorkspaceSection) => void
  roles: WorkspaceRole[]
  variant: 'desktop' | 'mobile'
}

export function WorkspaceNavigation({
  activeSection,
  onNavigate,
  roles,
  variant,
}: WorkspaceNavigationProps) {
  const allowedSections = getAllowedWorkspaceSections(roles)
  const items = navigationItems.filter((item) => allowedSections.includes(item.section))

  if (variant === 'mobile') {
    return (
      <label className="block lg:hidden">
        <span className="sr-only">Current workspace</span>
        <select
          aria-label="Current workspace"
          className="min-h-11 w-full rounded-lg border border-[color:var(--vf-border-strong)] bg-[var(--vf-paper)] px-3 text-sm font-semibold text-[var(--vf-navy)] outline-none transition focus:border-[var(--vf-primary)] focus:ring-3 focus:ring-[var(--vf-focus)]"
          onChange={(event) => onNavigate(event.target.value as WorkspaceSection)}
          value={activeSection}
        >
          {items.map((item) => (
            <option key={item.section} value={item.section}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = item.section === activeSection

        return (
          <a
            key={item.section}
            aria-current={isActive ? 'page' : undefined}
            href={`#${item.section}`}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(item.section)
            }}
            className={`group flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-semibold transition duration-200 ${
              isActive
                ? 'border-[color:var(--vf-primary-border)] bg-[var(--vf-primary-soft)] text-[var(--vf-primary)]'
                : 'border-transparent text-[var(--vf-text-muted)] hover:bg-[var(--vf-surface-raised)] hover:text-[var(--vf-navy)]'
            }`}
          >
            <Icon
              size={18}
              strokeWidth={1.8}
              className={isActive ? 'text-[var(--vf-primary)]' : 'text-[var(--vf-icon-muted)] group-hover:text-[var(--vf-navy)]'}
              aria-hidden="true"
            />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
