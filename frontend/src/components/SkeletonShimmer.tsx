import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type SkeletonBlockProps = {
  className?: string
}

function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  const reduceMotion = useReducedMotion()

  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden rounded-lg bg-slate-200/80 ${className}`}
    >
      {reduceMotion ? null : (
        <motion.span
          animate={{ x: ['-120%', '120%'] }}
          className="absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,250,240,0.86),transparent)]"
          transition={{
            duration: 1.35,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.18,
          }}
        />
      )}
    </span>
  )
}

function SkeletonCard({ children, className = '' }: SkeletonBlockProps & { children: ReactNode }) {
  return (
    <article className={`rounded-lg border border-[color:var(--vf-border)] bg-[var(--vf-paper)] p-5 shadow-sm ${className}`}>
      {children}
    </article>
  )
}

export function PayrollWorkspaceSkeleton() {
  return (
    <main className="min-h-dvh bg-[var(--vf-surface)] text-[var(--vf-navy)]" aria-label="Loading payroll workspace">
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 border-r border-[color:var(--vf-border)] bg-[var(--vf-paper)] px-4 py-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <SkeletonBlock className="size-10" />
            <div className="space-y-2">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="h-2.5 w-20" />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex min-h-11 items-center gap-3 rounded-lg px-3">
                <SkeletonBlock className="size-4" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
            ))}
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-[color:var(--vf-border)] bg-[color:rgba(255,250,240,0.95)] px-4 py-4 backdrop-blur md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-3">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="h-8 w-64" />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <SkeletonBlock className="h-11 w-full sm:w-80" />
                <SkeletonBlock className="h-11 w-28" />
                <SkeletonBlock className="h-11 w-28" />
              </div>
            </div>
          </header>

          <div className="space-y-6 px-4 py-6 md:px-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <SkeletonCard key={index}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <SkeletonBlock className="h-3 w-24" />
                      <SkeletonBlock className="h-8 w-20" />
                    </div>
                    <SkeletonBlock className="size-10" />
                  </div>
                  <SkeletonBlock className="mt-5 h-3 w-32" />
                </SkeletonCard>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
              <SkeletonCard className="min-h-[420px]">
                <div className="mb-6 flex items-center justify-between">
                  <div className="space-y-3">
                    <SkeletonBlock className="h-5 w-44" />
                    <SkeletonBlock className="h-3 w-28" />
                  </div>
                  <SkeletonBlock className="h-8 w-24 rounded-full" />
                </div>
                <div className="space-y-3">
                  <SkeletonBlock className="h-10 w-full" />
                  {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonBlock key={index} className="h-16 w-full" />
                  ))}
                </div>
              </SkeletonCard>

              <aside className="space-y-6">
                <SkeletonCard>
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="mt-4 size-20" />
                  <SkeletonBlock className="mt-4 h-6 w-36" />
                  <SkeletonBlock className="mt-2 h-3 w-28" />
                  <div className="mt-5 space-y-2">
                    {Array.from({ length: 4 }, (_, index) => (
                      <SkeletonBlock key={index} className="h-12 w-full" />
                    ))}
                  </div>
                </SkeletonCard>
                <SkeletonCard>
                  <SkeletonBlock className="h-5 w-32" />
                  <SkeletonBlock className="mt-5 h-20 w-full" />
                </SkeletonCard>
              </aside>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonCard key={index}>
                  <SkeletonBlock className="h-5 w-32" />
                  <div className="mt-5 space-y-2">
                    <SkeletonBlock className="h-11 w-full" />
                    <SkeletonBlock className="h-11 w-full" />
                    <SkeletonBlock className="h-11 w-full" />
                  </div>
                </SkeletonCard>
              ))}
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
