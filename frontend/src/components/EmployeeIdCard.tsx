import {
  Building2,
  Download,
  LoaderCircle,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react'

type EmployeeIdCardEmployee = {
  code: string
  department: string
  fullName: string
  id: string
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
  isDownloading?: boolean
  locale?: string
  onDownload?: (employeeId: string) => Promise<void> | void
  organizationName?: string | null
  tone?: 'dark' | 'light'
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
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

function getStatusClass(status: string | undefined) {
  if (status === 'active') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }

  if (status === 'inactive') {
    return 'border-slate-200 bg-slate-100 text-slate-600'
  }

  return 'border-amber-200 bg-amber-50 text-amber-800'
}

export function EmployeeIdCard({
  className = '',
  employee,
  isDownloading = false,
  locale = 'en-US',
  onDownload,
  organizationName = 'VetanFlow Labs',
  tone = 'light',
}: EmployeeIdCardProps) {
  const employeeName = employee?.fullName ?? 'Employee profile'
  const companyName = organizationName ?? 'VetanFlow Labs'
  const initials = getInitials(employeeName) || 'VF'
  const isDark = tone === 'dark'

  return (
    <div className={className}>
      <article
        aria-label={`${employeeName} digital employee ID card`}
        className="relative aspect-[1.586/1] min-h-[170px] w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-[#0A2947] shadow-[0_14px_32px_rgba(8,31,51,0.18)]"
      >
        <div className="absolute inset-x-0 top-0 grid h-1.5 grid-cols-[3fr_1fr_1fr]" aria-hidden="true">
          <span className="bg-[#0A2947]" />
          <span className="bg-[#1677B8]" />
          <span className="bg-[#16A085]" />
        </div>

        <header className="flex h-[23%] items-center justify-between gap-3 border-b border-slate-200 px-3 pt-1.5">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold leading-none">{companyName}</p>
            <p className="mt-1 text-[8px] font-semibold uppercase leading-none text-slate-500">
              Digital employee ID
            </p>
          </div>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#0A2947] text-white">
            <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />
          </div>
        </header>

        <div className="grid h-[61%] grid-cols-[72px_minmax(0,1fr)] gap-3 px-3 py-2.5">
          <div className="relative overflow-hidden rounded-md border-2 border-white bg-slate-100 shadow-[0_0_0_1px_#cbd5e1]">
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
                className="flex size-full items-center justify-center bg-[#E8EEF3] text-xl font-bold text-[#0A2947]"
                role="img"
              >
                {initials}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-[#0A2947]/90 py-0.5 text-center text-[7px] font-semibold uppercase text-white">
              Verified
            </div>
          </div>

          <div className="min-w-0 self-center">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-bold leading-tight">{employeeName}</h2>
                <p className="mt-0.5 truncate text-[10px] font-medium text-slate-600">
                  {employee?.role ?? 'Role pending'}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[7px] font-bold uppercase ${getStatusClass(employee?.status)}`}
              >
                {employee ? formatStatus(employee.status) : 'Pending'}
              </span>
            </div>

            <p className="mt-1.5 flex min-w-0 items-center gap-1 truncate text-[8px] text-slate-500">
              <Mail size={9} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{employee?.workEmail ?? 'Email not set'}</span>
            </p>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <div className="min-w-0 border-l-2 border-[#1677B8] pl-1.5">
                <p className="text-[7px] font-semibold uppercase text-slate-400">Employee ID</p>
                <p className="truncate text-[9px] font-bold">{employee?.code ?? 'EMP-PENDING'}</p>
              </div>
              <div className="min-w-0 border-l-2 border-[#16A085] pl-1.5">
                <p className="text-[7px] font-semibold uppercase text-slate-400">Joined</p>
                <p className="truncate text-[9px] font-bold">
                  {employee ? formatDate(employee.joiningDate, locale) : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="absolute inset-x-0 bottom-0 grid h-[16%] grid-cols-2 items-center gap-3 bg-[#0A2947] px-3 text-white">
          <p className="flex min-w-0 items-center gap-1.5 truncate text-[8px] font-medium">
            <Building2 size={10} className="shrink-0 text-[#57C5E8]" aria-hidden="true" />
            <span className="truncate">{employee?.department ?? 'Department pending'}</span>
          </p>
          <p className="flex min-w-0 items-center justify-end gap-1.5 truncate text-[8px] font-medium">
            <MapPin size={10} className="shrink-0 text-[#63D6B8]" aria-hidden="true" />
            <span className="truncate">{employee?.location ?? 'Location pending'}</span>
          </p>
        </footer>
      </article>

      {onDownload ? (
        <button
          type="button"
          className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#57C5E8]/45 disabled:cursor-wait disabled:opacity-60 ${
            isDark
              ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
              : 'border-[#0A2947] bg-[#0A2947] text-white hover:bg-[#123E66]'
          }`}
          disabled={!employee || isDownloading}
          onClick={() => {
            if (employee) {
              void onDownload(employee.id)
            }
          }}
        >
          {isDownloading ? (
            <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
          ) : (
            <Download size={17} aria-hidden="true" />
          )}
          {isDownloading ? 'Preparing PDF' : 'Download ID card PDF'}
        </button>
      ) : null}
    </div>
  )
}
