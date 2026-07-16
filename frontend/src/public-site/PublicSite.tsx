import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  FileText,
  Github,
  Globe2,
  KeyRound,
  Layers3,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { BrandLogo } from '../components/BrandLogo'
import { blogArticles, journeySteps, roleStories, trustSignals } from './content'
import { WorkflowTour } from './WorkflowTour'

const navItems = [
  { href: '/tour', label: 'Product tour' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/blog', label: 'Journal' },
]

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <a aria-label="VetanFlow home" className="inline-flex items-center gap-3" href="/">
      <BrandLogo inverse={inverse} />
    </a>
  )
}

function PublicHeader({ inverse = false }: { inverse?: boolean }) {
  const textClass = inverse ? 'text-white' : 'text-slate-950'
  const borderClass = inverse ? 'border-white/10 bg-[color:rgba(5,22,38,0.82)]' : 'border-[color:var(--vf-border)] bg-white/92'

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${borderClass} ${textClass}`}>
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <BrandMark inverse={inverse} />
        <nav aria-label="Primary navigation" className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <a className={`text-sm font-medium transition ${inverse ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`} href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <a className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${inverse ? 'border-white/20 text-white hover:bg-white/8' : 'border-[color:var(--vf-border-strong)] hover:bg-slate-50'}`} href="/login">
            Sign in
          </a>
          <a className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${inverse ? 'bg-white text-slate-950 hover:bg-blue-50' : 'bg-[var(--vf-primary)] text-white hover:bg-[var(--vf-primary-hover)]'}`} href="/tour">
            Explore the flow
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
        <details className="relative md:hidden">
          <summary aria-label="Open navigation" className={`flex size-11 list-none items-center justify-center rounded-lg border ${inverse ? 'border-white/20' : 'border-[color:var(--vf-border)]'}`}>
            <Menu size={19} aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-13 w-64 rounded-lg border border-[color:var(--vf-border)] bg-white p-2 text-slate-950 shadow-xl">
            {[...navItems, { href: '/login', label: 'Sign in' }].map((item) => (
              <a className="flex min-h-11 items-center justify-between rounded-md px-3 text-sm font-medium hover:bg-slate-50" href={item.href} key={item.href}>
                {item.label}
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            ))}
          </div>
        </details>
      </div>
    </header>
  )
}

function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[var(--vf-navy)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <BrandMark inverse />
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
            A role-aware payroll operations system built around traceable inputs, controlled approvals, and private employee delivery.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-blue-200">Product</p>
          <div className="mt-4 grid gap-3 text-sm text-white/65">
            <a className="hover:text-white" href="/tour">Product tour</a>
            <a className="hover:text-white" href="/how-it-works">How it works</a>
            <a className="hover:text-white" href="/blog">Journal</a>
            <a className="hover:text-white" href="/login">Sign in</a>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-blue-200">Legal & source</p>
          <div className="mt-4 grid gap-3 text-sm text-white/65">
            <a className="hover:text-white" href="/terms">Terms of service</a>
            <a className="hover:text-white" href="/privacy">Privacy</a>
            <a className="hover:text-white" href="/licenses">Licenses</a>
            <a className="inline-flex items-center gap-2 hover:text-white" href="https://github.com/FardeenAnsari/vetanflow" rel="noreferrer" target="_blank">
              <Github size={15} aria-hidden="true" /> GitHub repository
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">
        © 2026 VetanFlow. Built for careful payroll operations.
      </div>
    </footer>
  )
}

function PageIntro({ eyebrow, title, description }: { description: string; eyebrow: string; title: string }) {
  return (
    <section className="border-b border-[color:var(--vf-border)] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-xs font-semibold uppercase text-blue-700">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-semibold text-slate-950 sm:text-5xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{description}</p>
      </div>
    </section>
  )
}

function LandingPage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="bg-[var(--vf-surface)] text-slate-950">
      <PublicHeader inverse />
      <main>
        <section className="relative isolate flex min-h-[min(760px,calc(100svh-88px))] items-end overflow-hidden bg-[var(--vf-navy)] text-white">
          <img alt="VetanFlow owner payroll workspace with operational metrics and workflow controls" className="absolute inset-0 size-full object-cover object-[58%_top] opacity-38" height="1000" loading="eager" src="/vetanflow-owner-workspace.png" width="1440" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,22,38,0.98)_0%,rgba(5,22,38,0.91)_43%,rgba(5,22,38,0.28)_100%)]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 lg:px-8">
            <motion.div animate={{ opacity: 1, y: 0 }} className="max-w-2xl" initial={reduceMotion ? false : { opacity: 0, y: 18 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 text-xs font-semibold text-blue-100">
                <Sparkles size={15} aria-hidden="true" />
                Payroll operations, end to end
              </div>
              <h1 className="mt-6 text-5xl font-semibold sm:text-6xl">VetanFlow</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/72 sm:text-xl">
                Move from employee setup to approved payroll, private payslips, and finance exports with a role-aware operating trail.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50" href="/tour">
                  Walk through the workflow
                  <ArrowRight size={17} aria-hidden="true" />
                </a>
                <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/8 px-5 text-sm font-semibold text-white transition hover:bg-white/14" href="/login">
                  <KeyRound size={17} aria-hidden="true" />
                  Open secure workspace
                </a>
              </div>
            </motion.div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/12 pt-5">
              {trustSignals.map((signal) => {
                const Icon = signal.icon
                return <span className="inline-flex items-center gap-2 text-xs font-medium text-white/60" key={signal.label}><Icon size={15} className="text-blue-300" aria-hidden="true" />{signal.label}</span>
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--vf-border)] bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-[color:var(--vf-border)] px-4 sm:px-6 md:grid-cols-4 md:divide-y-0 lg:px-8">
            {[
              ['6', 'Role-specific workspaces'],
              ['7', 'Controlled workflow stages'],
              ['3', 'Finance-ready exports'],
              ['1', 'Auditable source of truth'],
            ].map(([value, label]) => <div className="px-4 py-6 text-center" key={label}><p className="tabular text-2xl font-semibold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-600">{label}</p></div>)}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase text-blue-700">One connected journey</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">See how a person becomes a payslip</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">The walkthrough follows the actual system boundary: people data, approvals, locked time inputs, payroll snapshots, and private delivery.</p>
              <a className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700" href="/how-it-works">Read the architecture story <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <WorkflowTour compact />
          </div>
        </section>

        <section className="border-y border-[color:var(--vf-border)] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase text-blue-700">Work divided by responsibility</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">A different workspace for every role</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">Each person sees the information and actions needed for their job. Employees do not receive a disabled administrator screen.</p>
            </div>
            <div className="mt-12 grid border-x border-t border-[color:var(--vf-border)] sm:grid-cols-2 lg:grid-cols-3">
              {roleStories.map((role, index) => (
                <article className="border-b border-[color:var(--vf-border)] p-6 sm:border-r" key={role.label}>
                  <div className="flex items-center justify-between gap-4"><p className="text-lg font-semibold">{role.label}</p><span className="tabular text-xs text-slate-400">0{index + 1}</span></div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{role.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="overflow-hidden rounded-lg border border-[color:var(--vf-border)] bg-white p-2 shadow-xl shadow-slate-900/10">
              <img alt="VetanFlow employee self-service portal showing a downloadable digital ID and payroll information" className="aspect-[1.44/1] w-full rounded-md object-cover object-top" height="1000" loading="lazy" src="/vetanflow-employee-workspace.png" width="1440" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-blue-700">Employee delivery</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">The final mile is personal and private</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">Employees receive a focused self-service portal with a printable digital ID, personal records, leave workflow, compensation history, and signed payslip downloads.</p>
              <div className="mt-8 grid gap-4">
                {['Two-sided employee ID cards available as PDF', 'Private document storage with short-lived signed access', 'Personal records separated from company-wide operations'].map((item) => <p className="flex items-start gap-3 text-sm font-medium" key={item}><Check className="mt-0.5 shrink-0 text-emerald-600" size={17} aria-hidden="true" />{item}</p>)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--vf-primary-soft)]">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div><p className="text-xs font-semibold uppercase text-blue-700">Study the complete product</p><h2 className="mt-3 text-3xl font-semibold">Follow every control from setup to delivery.</h2></div>
            <a className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg bg-[var(--vf-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--vf-primary-hover)]" href="/tour">Start the guided tour <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

function TourPage() {
  return (
    <div className="bg-[var(--vf-surface)] text-slate-950">
      <PublicHeader />
      <main>
        <PageIntro eyebrow="Guided product tour" title="From a new employee to a delivered payslip" description="Use the controls to inspect each stage. The sequence mirrors the real VetanFlow data and authorization flow." />
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"><WorkflowTour /></section>
        <section className="border-y border-[color:var(--vf-border)] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold">What survives each handoff</h2>
            <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-border)] md:grid-cols-3">
              {[['Identity', 'Employee, organization, role, and reporting relationship remain explicit.'], ['Decision', 'Reviewer, timestamp, status, and notes travel with the workflow.'], ['Calculation', 'Attendance inputs and payroll results are stored as a finalized snapshot.']].map(([title, text]) => <article className="bg-white p-6" key={title}><p className="font-semibold">{title}</p><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

function HowItWorksPage() {
  return (
    <div className="bg-[var(--vf-surface)] text-slate-950">
      <PublicHeader />
      <main>
        <PageIntro eyebrow="System guide" title="How VetanFlow works" description="The product is split into clear trust boundaries so the interface, API, database, and private documents each do one job well." />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div><p className="text-xs font-semibold uppercase text-blue-700">Runtime boundary</p><h2 className="mt-4 text-3xl font-semibold">Four layers, one operating trail</h2></div>
            <div className="border-l border-[color:var(--vf-border-strong)]">
              {[
                [Globe2, 'React workspace', 'Renders a distinct role experience and sends authenticated requests. It never receives the service-role key.'],
                [Layers3, 'Express API', 'Validates input, resolves the organization and role, and owns sensitive workflow decisions.'],
                [ShieldCheck, 'Supabase Postgres', 'Stores operational records with row policies, restricted grants, and trigger-enforced finalization rules.'],
                [FileText, 'Private Storage', 'Keeps employee photos and payslips private, issuing signed access only after authorization.'],
              ].map(([Icon, title, text], index) => {
                const LayerIcon = Icon as typeof Globe2
                return <article className="relative border-b border-[color:var(--vf-border)] py-7 pl-10" key={title as string}><span className="absolute -left-5 top-7 flex size-10 items-center justify-center rounded-lg border border-[color:var(--vf-border)] bg-white text-blue-700"><LayerIcon size={18} aria-hidden="true" /></span><p className="text-xs font-semibold uppercase text-slate-400">Layer 0{index + 1}</p><h3 className="mt-2 text-lg font-semibold">{title as string}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{text as string}</p></article>
              })}
            </div>
          </div>
        </section>
        <section className="border-y border-[color:var(--vf-border)] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase text-blue-700">Monthly lifecycle</p><h2 className="mt-4 text-3xl font-semibold">Every stage produces the input for the next</h2></div>
            <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-border)] sm:grid-cols-2 lg:grid-cols-4">
              {journeySteps.map((step, index) => { const Icon = step.icon; return <li className="bg-white p-5" key={step.id}><Icon className="text-blue-700" size={20} aria-hidden="true" /><p className="mt-6 text-xs font-semibold text-slate-400">0{index + 1}</p><p className="mt-2 font-semibold">{step.title}</p><p className="mt-3 text-sm leading-6 text-slate-600">{step.detail}</p></li> })}
            </ol>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {[['Authorization', LockKeyhole, 'Every sensitive request resolves the authenticated user, organization, and allowed role before data access.'], ['Data integrity', BadgeCheck, 'Locked months and finalized payroll runs reject later changes at the database layer.'], ['Auditability', Workflow, 'Important people, leave, attendance, access, and payroll actions create durable audit entries.']].map(([title, Icon, text]) => { const ItemIcon = Icon as typeof LockKeyhole; return <article className="border-t-2 border-blue-600 pt-5" key={title as string}><ItemIcon size={20} className="text-blue-700" aria-hidden="true" /><h3 className="mt-5 text-lg font-semibold">{title as string}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{text as string}</p></article> })}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

function BlogPage() {
  return (
    <div className="bg-[var(--vf-surface)] text-slate-950">
      <PublicHeader />
      <main>
        <PageIntro eyebrow="VetanFlow journal" title="Notes on building reliable payroll operations" description="Short explanations of the product decisions behind role boundaries, payroll controls, and private delivery." />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-px overflow-hidden rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-border)] lg:grid-cols-3">
            {blogArticles.map((article) => <article className="flex min-h-[330px] flex-col bg-white p-6" key={article.slug}><p className="text-xs font-semibold uppercase text-blue-700">{article.eyebrow}</p><h2 className="mt-5 text-2xl font-semibold">{article.title}</h2><p className="mt-4 text-sm leading-7 text-slate-600">{article.description}</p><div className="mt-auto pt-8"><p className="text-xs text-slate-400">{article.publishedAt} · {article.readTime}</p><a className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700" href={`/blog/${article.slug}`}>Read article <ArrowRight size={16} aria-hidden="true" /></a></div></article>)}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}

function BlogArticlePage({ slug }: { slug: string }) {
  const article = blogArticles.find((candidate) => candidate.slug === slug)

  if (!article) {
    return <NotFoundPage />
  }

  return (
    <div className="bg-white text-slate-950">
      <PublicHeader />
      <main>
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <a className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700" href="/blog">← Back to journal</a>
          <p className="mt-10 text-xs font-semibold uppercase text-blue-700">{article.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">{article.title}</h1>
          <p className="mt-6 text-sm text-slate-400">{article.publishedAt} · {article.readTime}</p>
          <p className="mt-10 border-l-2 border-blue-600 pl-5 text-lg leading-8 text-slate-600">{article.description}</p>
          <div className="mt-10 space-y-7 text-base leading-8 text-slate-700">{article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </article>
      </main>
      <PublicFooter />
    </div>
  )
}

type LegalSection = { paragraphs?: string[]; points?: string[]; title: string }

function LegalPage({ description, eyebrow, sections, title }: { description: string; eyebrow: string; sections: LegalSection[]; title: string }) {
  return (
    <div className="bg-[var(--vf-surface)] text-slate-950">
      <PublicHeader />
      <main>
        <PageIntro description={description} eyebrow={eyebrow} title={title} />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
          <aside><p className="text-xs font-semibold uppercase text-slate-400">Effective July 16, 2026</p><p className="mt-4 text-sm leading-6 text-slate-600">Questions can be sent to developer.fardeenansari@gmail.com.</p></aside>
          <div className="max-w-3xl space-y-10">
            {sections.map((section) => <section key={section.title}><h2 className="text-xl font-semibold">{section.title}</h2>{section.paragraphs?.map((paragraph) => <p className="mt-4 text-sm leading-7 text-slate-700" key={paragraph}>{paragraph}</p>)}{section.points ? <ul className="mt-4 grid gap-3">{section.points.map((point) => <li className="flex items-start gap-3 text-sm leading-7 text-slate-700" key={point}><Check className="mt-1 shrink-0 text-emerald-600" size={16} aria-hidden="true" />{point}</li>)}</ul> : null}</section>)}
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

const termsSections: LegalSection[] = [
  { title: 'Using the service', paragraphs: ['VetanFlow is payroll operations software. Organizations remain responsible for the accuracy of employee inputs, payroll settings, approvals, payments, tax treatment, and legal compliance in every jurisdiction where they operate.'] },
  { title: 'Accounts and access', points: ['Keep account credentials confidential and assign the minimum role required.', 'Do not share production accounts or attempt to bypass role and organization boundaries.', 'Notify the operator promptly if an account or payroll record may have been compromised.'] },
  { title: 'Payroll responsibility', paragraphs: ['VetanFlow provides workflow and calculation tooling, not legal, tax, accounting, or employment advice. Payroll results must be reviewed by qualified operators before approval, payment, or filing.'] },
  { title: 'Availability and changes', paragraphs: ['Evaluation and demonstration environments may change, reset, or become unavailable. Commercial availability, support, service levels, retention, and pricing require a separate written agreement.'] },
  { title: 'Acceptable use', points: ['Do not upload unlawful, malicious, or unauthorized personal data.', 'Do not probe, overload, reverse engineer, or interfere with the service.', 'Do not represent an evaluation deployment as an authoritative payroll filing system.'] },
]

const privacySections: LegalSection[] = [
  { title: 'Data handled', paragraphs: ['VetanFlow can store organization records, work identity, employment details, compensation, payout information, attendance, leave, payroll results, audit events, photos, and generated payslips.'] },
  { title: 'Why data is used', points: ['Authenticate users and enforce organization and role boundaries.', 'Operate employee, leave, attendance, payroll, document, and reporting workflows.', 'Protect the service, investigate errors, and retain an operational audit trail.'] },
  { title: 'Storage and access', paragraphs: ['Application data is stored in Supabase Postgres and private Storage. The browser receives a publishable key, while privileged credentials remain on the backend. Signed document links are short-lived.'] },
  { title: 'Retention and deletion', paragraphs: ['Retention requirements vary by organization and jurisdiction. A production operator must define retention, export, deletion, backup, and legal-hold policies before collecting real payroll data.'] },
  { title: 'Evaluation warning', paragraphs: ['The current project is a demonstration environment. Do not enter real employee, bank, tax, identity, or payroll information until production privacy, security, retention, and contractual controls are configured.'] },
]

const licenseSections: LegalSection[] = [
  { title: 'Free evaluation license', paragraphs: ['You may run and evaluate the VetanFlow demonstration for learning, internal review, and non-commercial testing at no charge. This permission does not grant the right to resell, sublicense, host for customers, or use VetanFlow to process production payroll.'] },
  { title: 'Commercial use', paragraphs: ['Commercial deployment, customer hosting, resale, white-labeling, support, and production payroll processing require a separate written license from the project owner.'] },
  { title: 'Open-source components', paragraphs: ['VetanFlow uses open-source libraries including React, Vite, TypeScript, Express, Supabase JS, Motion, Lucide, Tailwind CSS, Zod, and Vitest. Each dependency remains governed by its own license and copyright notice.'] },
  { title: 'Generated notices', points: ['The production frontend build emits dist/.vite/license.md.', 'Package lockfiles preserve the exact dependency versions used by the build.', 'No project-level open-source license is implied by the licenses of dependencies.'] },
  { title: 'No warranty', paragraphs: ['The evaluation version is provided as-is without warranties. Have qualified security, legal, tax, payroll, and compliance professionals review any production deployment.'] },
]

function NotFoundPage() {
  return (
    <div className="min-h-dvh bg-[var(--vf-surface)] text-slate-950">
      <PublicHeader />
      <main className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col items-center justify-center px-4 text-center"><p className="text-xs font-semibold uppercase text-blue-700">404</p><h1 className="mt-4 text-4xl font-semibold">This page is not part of the workflow.</h1><p className="mt-5 text-slate-600">Return to the product overview or open the secure application.</p><a className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--vf-primary)] px-5 text-sm font-semibold text-white" href="/">Return home <ArrowRight size={17} aria-hidden="true" /></a></main>
      <PublicFooter />
    </div>
  )
}

function resolvePage(pathname: string) {
  if (pathname === '/') return <LandingPage />
  if (pathname === '/tour') return <TourPage />
  if (pathname === '/how-it-works') return <HowItWorksPage />
  if (pathname === '/blog') return <BlogPage />
  if (pathname.startsWith('/blog/')) return <BlogArticlePage slug={decodeURIComponent(pathname.slice('/blog/'.length))} />
  if (pathname === '/terms') return <LegalPage description="The conditions for evaluating and using VetanFlow." eyebrow="Legal" sections={termsSections} title="Terms of service" />
  if (pathname === '/privacy') return <LegalPage description="How the project handles identity, employment, payroll, and operational information." eyebrow="Data handling" sections={privacySections} title="Privacy notice" />
  if (pathname === '/licenses') return <LegalPage description="A no-cost evaluation grant and the open-source notices that support VetanFlow." eyebrow="Licensing" sections={licenseSections} title="Free evaluation and licenses" />
  return <NotFoundPage />
}

function getPageTitle(pathname: string) {
  if (pathname === '/') return 'VetanFlow | Payroll operations, controlled end to end'
  if (pathname === '/tour') return 'Product tour | VetanFlow'
  if (pathname === '/how-it-works') return 'How VetanFlow works'
  if (pathname.startsWith('/blog')) return 'VetanFlow Journal'
  if (pathname === '/terms') return 'Terms of service | VetanFlow'
  if (pathname === '/privacy') return 'Privacy notice | VetanFlow'
  if (pathname === '/licenses') return 'Licenses | VetanFlow'
  return 'Page not found | VetanFlow'
}

export function PublicSite() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'

  useEffect(() => {
    document.title = getPageTitle(pathname)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return resolvePage(pathname)
}
