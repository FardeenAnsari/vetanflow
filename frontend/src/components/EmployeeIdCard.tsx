import { Building2, CalendarCheck, Mail, MapPin, ShieldCheck, UserRound } from 'lucide-react'

type EmployeeIdCardEmployee = {
  code: string
  department: string
  fullName: string
  joiningDate: string
  location: string
  photoUrl?: string | null
  role: string
  status: string
  workEmail: string | null
}

type EmployeeIdCardProps = {
  className?: string
  employee: EmployeeIdCardEmployee | null
  organizationName?: string | null
  tone?: 'dark' | 'light'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatStatus(value: string) {
  return value
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function EmployeeIdCard({
  className = '',
  employee,
  organizationName = 'VetanFlow Demo India',
  tone = 'light',
}: EmployeeIdCardProps) {
  const isDark = tone === 'dark'
  const textClass = isDark ? 'text-[var(--vf-cream)]' : 'text-[var(--vf-navy)]'
  const mutedClass = isDark ? 'text-[color:rgba(243,228,201,0.72)]' : 'text-[color:rgba(10,41,71,0.62)]'
  const borderClass = isDark ? 'border-white/10' : 'border-[color:var(--vf-border)]'
  const shellClass = isDark
    ? 'bg-[color:rgba(255,250,240,0.06)]'
    : 'bg-[linear-gradient(135deg,var(--vf-paper),var(--vf-cream))]'
  const fieldClass = isDark ? 'border-white/10 bg-[color:rgba(255,250,240,0.05)]' : 'border-[color:var(--vf-border)] bg-[color:rgba(255,250,240,0.56)]'
  const employeeName = employee?.fullName ?? 'Employee profile'
  const companyName = organizationName ?? 'VetanFlow Demo India'
  const initials = getInitials(employeeName) || 'VF'

  return (
    <article className={`${shellClass} ${borderClass} ${textClass} overflow-hidden rounded-lg border shadow-sm ${className}`}>
      <div className="border-b border-inherit px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase ${mutedClass}`}>Digital ID card</p>
            <p className="mt-1 text-sm font-semibold">{companyName}</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--vf-brown)] text-white">
            <ShieldCheck size={17} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex flex-col gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-[color:rgba(10,41,71,0.14)] bg-[var(--vf-sage)]">
            {employee?.photoUrl ? (
              <img
                alt={`${employeeName} profile photo`}
                className="size-full object-cover"
                loading="lazy"
                src={employee.photoUrl}
              />
            ) : (
              <div
                aria-label={`${employeeName} profile photo placeholder`}
                className="flex size-full items-center justify-center text-xl font-semibold text-[var(--vf-navy)]"
                role="img"
              >
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold leading-tight">{employeeName}</h2>
            <p className={`mt-1 text-sm ${mutedClass}`}>{employee?.role ?? 'Role pending'}</p>
            <p className="tabular mt-3 inline-flex min-h-8 items-center rounded-lg bg-[var(--vf-brown)] px-3 text-xs font-semibold text-white">
              {employee?.code ?? 'EMP-PENDING'}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-2">
          {[
            { icon: Building2, label: 'Department', value: employee?.department ?? 'Not assigned' },
            { icon: MapPin, label: 'Location', value: employee?.location ?? 'Not assigned' },
            { icon: Mail, label: 'Email', value: employee?.workEmail ?? 'Not set' },
            { icon: CalendarCheck, label: 'Joined', value: employee ? formatDate(employee.joiningDate) : 'Not set' },
          ].map((item) => {
            const Icon = item.icon

            return (
              <div key={item.label} className={`grid grid-cols-[20px_1fr] gap-x-2 gap-y-1 rounded-lg border px-3 py-2 ${fieldClass}`}>
                <Icon size={15} className={`${mutedClass} row-span-2 mt-0.5`} aria-hidden="true" />
                <dt className={`text-xs font-medium ${mutedClass}`}>{item.label}</dt>
                <dd className="min-w-0 break-words text-xs font-semibold">{item.value}</dd>
              </div>
            )
          })}
        </dl>

        <div className={`mt-4 flex items-center justify-between gap-3 border-t border-inherit pt-4 ${mutedClass}`}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold">
            <UserRound size={14} aria-hidden="true" />
            {employee ? formatStatus(employee.status) : 'Profile pending'}
          </span>
          <span className="tabular text-xs font-semibold">VF-ID</span>
        </div>
      </div>
    </article>
  )
}
