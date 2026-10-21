import { ArrowDownUp, Download, Pencil, Plus, Search, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { StatusBadge } from './StatusBadge'

type DirectoryEmployee = {
  id: string
  fullName: string
  code: string
  department: string
  location: string
  annualCompensation: number
  status: string
  role: string
}
type Props<T> = {
  employees: T[]
  selectedId: string
  canEdit: boolean
  downloadingId: string | null
  formatCurrency: (value: number) => string
  onOpen: (employee: T) => void
  onEdit: (employee: T) => void
  onDownload: (id: string) => void
  onCreate: () => void
}
const control =
  'min-h-11 min-w-0 rounded-md border border-[color:var(--vf-border-strong)] bg-white px-3 text-sm'

export function PeopleDirectory<T extends DirectoryEmployee>(props: Props<T>) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('code')
  const [page, setPage] = useState(0)
  const departments = [...new Set(props.employees.map((person) => person.department))].sort()
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return props.employees
      .filter(
        (person) =>
          (department === 'all' || person.department === department) &&
          (status === 'all' || person.status === status) &&
          [person.fullName, person.code, person.department, person.role, person.location]
            .join(' ')
            .toLowerCase()
            .includes(term),
      )
      .sort((a, b) => (sort === 'name' ? a.fullName.localeCompare(b.fullName) : a.code.localeCompare(b.code)))
  }, [props.employees, query, department, status, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / 8))
  const currentPage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(currentPage * 8, (currentPage + 1) * 8)

  return (
    <article className="min-w-0 self-start rounded-lg border border-[color:var(--vf-border)] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--vf-border)] p-5">
        <div>
          <h2 className="text-lg font-semibold">Employee directory</h2>
          <p className="mt-1 text-sm text-[var(--vf-text-muted)]">
            {filtered.length} of {props.employees.length} people
          </p>
        </div>
        {props.canEdit ? (
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--vf-primary)] px-4 text-sm font-semibold text-white"
            onClick={props.onCreate}
            type="button"
          >
            <Plus size={17} aria-hidden="true" />
            Add employee
          </button>
        ) : null}
      </header>
      <div className="grid gap-3 border-b border-[color:var(--vf-border)] p-4 sm:grid-cols-2">
        <label className="relative sm:col-span-2">
          <span className="sr-only">Search directory</span>
          <Search
            className="pointer-events-none absolute left-3 top-3 text-[var(--vf-icon-muted)]"
            size={18}
            aria-hidden="true"
          />
          <input
            className={`${control} w-full pl-10`}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
            placeholder="Search name, team, role, or employee code"
            type="search"
            value={query}
          />
        </label>
        <label>
          <span className="sr-only">Filter by department</span>
          <select
            className={`${control} w-full`}
            onChange={(event) => {
              setDepartment(event.target.value)
              setPage(0)
            }}
            value={department}
          >
            <option value="all">All departments</option>
            {departments.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by employee status</span>
          <select
            className={`${control} w-full`}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(0)
            }}
            value={status}
          >
            <option value="all">All statuses</option>
            {['active', 'on_leave', 'draft', 'exit_pending', 'inactive'].map((value) => (
              <option key={value} value={value}>
                {value.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-xs text-[var(--vf-text-muted)]">Select a person to view their ID and records.</p>
        <label className="flex items-center gap-2 text-xs">
          <ArrowDownUp size={14} aria-hidden="true" />
          <span className="sr-only">Sort employees</span>
          <select
            className="min-h-10 bg-white text-xs"
            onChange={(event) => {
              setSort(event.target.value)
              setPage(0)
            }}
            value={sort}
          >
            <option value="code">Employee code</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>
      </div>
      <ul className="divide-y divide-[color:var(--vf-border)]" aria-label="Employees">
        {visible.map((employee) => (
          <li
            className={`p-4 transition ${props.selectedId === employee.id ? 'bg-[var(--vf-primary-soft)]' : 'hover:bg-[var(--vf-surface-raised)]'}`}
            key={employee.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button
                className="min-h-11 min-w-0 text-left"
                onClick={() => props.onOpen(employee)}
                type="button"
                aria-pressed={props.selectedId === employee.id}
              >
                <span className="block text-sm font-semibold text-[var(--vf-navy)]">{employee.fullName}</span>
                <span className="mt-1 block text-xs text-[var(--vf-text-muted)]">
                  {employee.code} · {employee.role}
                </span>
              </button>
              <StatusBadge
                tone={
                  employee.status === 'active'
                    ? 'success'
                    : employee.status === 'inactive'
                      ? 'neutral'
                      : 'warning'
                }
              >
                {employee.status.replaceAll('_', ' ')}
              </StatusBadge>
            </div>
            <p className="mt-2 text-xs text-[var(--vf-text-muted)]">
              {employee.department} · {employee.location}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="tabular text-sm font-semibold">
                {props.formatCurrency(employee.annualCompensation)}
                <span className="ml-1 text-xs font-normal text-[var(--vf-text-muted)]">/ year</span>
              </p>
              <div className="flex gap-2">
                <button
                  aria-label={`Download ${employee.fullName}'s ID card`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[color:var(--vf-border-strong)] bg-white px-3 text-xs font-semibold disabled:opacity-50"
                  disabled={props.downloadingId === employee.id}
                  onClick={() => props.onDownload(employee.id)}
                  type="button"
                >
                  <Download size={15} aria-hidden="true" />
                  {props.downloadingId === employee.id ? 'Preparing' : 'ID PDF'}
                </button>
                {props.canEdit ? (
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[color:var(--vf-border-strong)] bg-white px-3 text-xs font-semibold"
                    onClick={() => props.onEdit(employee)}
                    type="button"
                  >
                    <Pencil size={15} aria-hidden="true" />
                    Edit
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!visible.length ? (
        <div className="px-5 py-10 text-center">
          <UsersRound className="mx-auto text-[var(--vf-icon-muted)]" size={26} aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold">No matching employees</p>
          <button
            className="mt-2 min-h-11 text-sm font-semibold text-[var(--vf-primary)]"
            onClick={() => {
              setQuery('')
              setDepartment('all')
              setStatus('all')
              setPage(0)
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      ) : null}
      <footer className="flex items-center justify-between gap-3 border-t border-[color:var(--vf-border)] p-4 text-xs text-[var(--vf-text-muted)]">
        <span>
          Page {currentPage + 1} of {pageCount}
        </span>
        <div className="flex gap-2">
          <button
            className={`${control} disabled:opacity-40`}
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            type="button"
          >
            Previous
          </button>
          <button
            className={`${control} disabled:opacity-40`}
            disabled={currentPage + 1 >= pageCount}
            onClick={() => setPage(currentPage + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </footer>
    </article>
  )
}
