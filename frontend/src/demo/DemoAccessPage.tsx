import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  LoaderCircle,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { BrandLogo } from '../components/BrandLogo'
import { type WorkspaceRole, roleLabels } from '../components/workspace-navigation-model'
import { apiFetch } from '../lib/api-client'
import { supabase } from '../lib/supabase'
import { installWorkspaceSession } from '../lib/workspace-auth'

type DemoAccount = { key: string; email: string; fullName: string; role: WorkspaceRole }
const roles = [
  { role: 'owner', icon: ShieldCheck, description: 'Organization overview, access, and final approval.' },
  { role: 'hr', icon: UsersRound, description: 'People records, leave decisions, and attendance.' },
  { role: 'finance', icon: WalletCards, description: 'Payroll preparation, review, payslips, and exports.' },
  {
    role: 'manager',
    icon: BriefcaseBusiness,
    description: 'Direct reports, team attendance, and leave approvals.',
  },
  {
    role: 'employee',
    icon: BadgeCheck,
    description: 'Personal profile, digital ID, leave, and pay history.',
  },
  { role: 'admin', icon: ShieldCheck, description: 'Organization setup and day-to-day administration.' },
] as const

export default function DemoAccessPage() {
  const [accounts, setAccounts] = useState<DemoAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [manualSignIn, setManualSignIn] = useState(import.meta.env.PROD)
  useEffect(() => {
    if (import.meta.env.PROD) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    void apiFetch('/api/demo/accounts', { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json()
        if (response.status === 404) {
          setManualSignIn(true)
          return
        }
        if (!response.ok) throw new Error(payload.error)
        setAccounts(payload.data)
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : 'Demo accounts could not be loaded.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  async function enter(account: DemoAccount) {
    if (!supabase) {
      setError('Configure Supabase before opening the live demo.')
      return
    }
    setPending(account.key)
    setError('')
    try {
      const response = await apiFetch('/api/demo/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: account.key }),
      })
      const payload = (await response.json()) as { data?: Session; error?: string }
      if (!response.ok || !payload.data) throw new Error(payload.error ?? 'Unable to open this workspace.')
      await installWorkspaceSession(payload.data)
      window.location.replace('/app#overview')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in.')
    } finally {
      setPending(null)
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--vf-surface)] px-4 py-6 text-[var(--vf-navy)] sm:px-8">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-b border-[color:var(--vf-border)] pb-5">
        <a aria-label="VetanFlow home" href="/">
          <BrandLogo />
        </a>
        <a
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--vf-primary)]"
          href="/login"
        >
          <ArrowLeft size={16} /> Work account sign-in
        </a>
      </header>
      <div className="mx-auto max-w-6xl py-8 sm:py-12">
        <p className="text-xs font-semibold uppercase text-[var(--vf-primary)]">Live product demo</p>
        <h1 className="mt-2 text-3xl font-semibold">Choose a workspace</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--vf-text-muted)]">
          Follow one payroll cycle through the people who make it happen. Each account opens its own role and
          permissions with sample company data.
        </p>
        {manualSignIn ? (
          <p className="mt-4 border-l-2 border-blue-500 pl-3 text-sm leading-6 text-[var(--vf-text-muted)]">
            Choose a role, then use the demo credentials shared with you. For a local presentation, the role
            shortcut is available with <code>npm run demo</code>.
          </p>
        ) : null}
        {error ? (
          <div
            className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
            role="alert"
          >
            <CircleAlert className="mt-1 shrink-0" size={18} />
            <div>
              {error}
              {!accounts.length ? (
                <p className="mt-1">
                  For a local presentation, start with <code>npm run demo</code>. Existing invited accounts
                  can use the regular sign-in page.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        {loading ? (
          <p className="mt-8 flex items-center gap-2 text-sm" role="status">
            <LoaderCircle className="animate-spin" size={18} />
            Loading demo accounts
          </p>
        ) : (
          <section aria-label="Demo workspaces" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map(({ role, icon: Icon, description }) => {
              const available = accounts.filter((account) => account.role === role)
              return (
                <article
                  className="flex flex-col rounded-lg border border-[color:var(--vf-border)] bg-white p-5"
                  key={role}
                >
                  <Icon className="text-[var(--vf-primary)]" size={23} aria-hidden="true" />
                  <h2 className="mt-4 text-lg font-semibold">{roleLabels[role]}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--vf-text-muted)]">{description}</p>
                  <div className="mt-auto space-y-2 pt-5">
                    {available.length ? (
                      available.map((account) => (
                        <button
                          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-md border border-[color:var(--vf-border)] px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-50"
                          disabled={pending !== null}
                          key={account.key}
                          onClick={() => void enter(account)}
                          type="button"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{account.fullName}</span>
                            <span className="block break-all text-xs text-[var(--vf-text-muted)]">
                              {account.email}
                            </span>
                          </span>
                          {pending === account.key ? (
                            <LoaderCircle className="shrink-0 animate-spin" size={16} />
                          ) : (
                            <ArrowRight className="shrink-0" size={16} aria-hidden="true" />
                          )}
                        </button>
                      ))
                    ) : (
                      <a
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--vf-primary)]"
                        href={`/login?demoRole=${role}`}
                      >
                        Sign in as {role} <ArrowRight size={16} />
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        )}
        <section
          className="mt-9 border-t border-[color:var(--vf-border)] pt-6"
          aria-label="Suggested presentation sequence"
        >
          <h2 className="text-base font-semibold">A complete story in five stops</h2>
          <ol className="mt-4 grid gap-4 text-sm sm:grid-cols-5">
            {[
              'HR: open an employee',
              'Employee: request leave',
              'Manager: review the request',
              'Finance: inspect payroll',
              'Employee: download a payslip',
            ].map((step, index) => (
              <li className="flex items-start gap-2 leading-6" key={step}>
                <span className="font-semibold text-[var(--vf-primary)]">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}
