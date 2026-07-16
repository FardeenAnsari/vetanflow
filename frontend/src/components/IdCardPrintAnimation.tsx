import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BadgeCheck, Printer } from 'lucide-react'

type PrintStage = 'attaching' | 'printing' | 'ready'

type IdCardPrintAnimationProps = {
  employee: {
    code: string
    fullName: string
    role: string
  } | null
  organizationName?: string
  stage: PrintStage | null
}

const stageCopy: Record<PrintStage, { detail: string; title: string }> = {
  attaching: { detail: 'Securing the card to its lanyard', title: 'Finishing your ID card' },
  printing: { detail: 'Rendering a print-ready, access-controlled PDF', title: 'Printing employee ID' },
  ready: { detail: 'The PDF download has started', title: 'ID card ready' },
}

export function IdCardPrintAnimation({ employee, organizationName, stage }: IdCardPrintAnimationProps) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {stage && employee ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-live="polite"
          className="fixed inset-0 z-[80] grid place-items-center bg-[color:rgba(3,16,28,0.76)] px-4 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          role="status"
        >
          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg overflow-hidden rounded-lg border border-white/15 bg-[var(--vf-paper)] shadow-2xl"
            exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.98, y: reduceMotion ? 0 : 8 }}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.97, y: reduceMotion ? 0 : 12 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            <div className="relative h-80 overflow-hidden bg-[var(--vf-navy)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-[var(--vf-primary)]" />

              <motion.div
                animate={stage === 'printing' ? { y: [0, 3, 0] } : { y: 0 }}
                className="absolute left-1/2 top-8 z-30 flex h-20 w-60 -translate-x-1/2 flex-col items-center justify-center rounded-lg border border-white/15 bg-[#071f35] shadow-xl"
                transition={{ duration: 0.55, repeat: stage === 'printing' && !reduceMotion ? Infinity : 0 }}
              >
                <div className="flex items-center gap-2 text-white">
                  <Printer size={18} aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-normal">Secure print queue</span>
                </div>
                <span className="mt-3 h-2 w-40 rounded-full bg-black/45" />
              </motion.div>

              <motion.div
                animate={{
                  opacity: stage === 'printing' ? 0 : 1,
                  pathLength: stage === 'printing' ? 0 : 1,
                  y: stage === 'printing' ? -100 : 0,
                }}
                className="absolute left-1/2 top-0 z-10 h-36 w-24 -translate-x-1/2 rounded-b-full border-x-8 border-b-8 border-[var(--vf-brown)]"
                initial={{ opacity: 0, y: -100 }}
                transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                animate={{ opacity: stage === 'printing' ? 0 : 1, y: stage === 'printing' ? -32 : 0 }}
                className="absolute left-1/2 top-[118px] z-20 h-8 w-5 -translate-x-1/2 rounded-sm border-2 border-[#d6b56f] bg-[#f0dca7] shadow-md"
                initial={{ opacity: 0, y: -32 }}
                transition={{ delay: reduceMotion ? 0 : 0.32, duration: reduceMotion ? 0 : 0.3 }}
              />

              <motion.article
                animate={{
                  rotate: stage === 'attaching' && !reduceMotion ? [0, -1.2, 0.8, 0] : 0,
                  y: stage === 'printing' ? 12 : 142,
                }}
                className="absolute left-1/2 top-0 z-20 h-36 w-60 -translate-x-1/2 overflow-hidden rounded-lg border border-white/15 bg-[var(--vf-paper)] shadow-2xl"
                initial={{ y: 12 }}
                transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex h-full">
                  <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-[var(--vf-primary)] text-white">
                    <img alt="" className="size-10" src="/brand/vetanflow-mark-inverse.svg" />
                    <span className="mt-3 text-[9px] font-semibold uppercase">Verified</span>
                  </div>
                  <div className="min-w-0 flex-1 p-4 text-[var(--vf-navy)]">
                    <p className="truncate text-[9px] font-semibold uppercase text-[var(--vf-primary)]">{organizationName ?? 'VetanFlow'}</p>
                    <p className="mt-4 truncate text-base font-semibold">{employee.fullName}</p>
                    <p className="mt-1 truncate text-[10px] text-slate-500">{employee.role}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-[color:var(--vf-border)] pt-2 text-[9px]">
                      <span className="font-semibold">{employee.code}</span>
                      <BadgeCheck size={14} className="text-emerald-600" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </motion.article>
            </div>

            <div className="flex items-start gap-4 px-6 py-5">
              <span className={`mt-0.5 size-3 shrink-0 rounded-full ${stage === 'ready' ? 'bg-emerald-500' : 'animate-pulse bg-amber-400'}`} />
              <div>
                <h2 className="font-semibold text-[var(--vf-navy)]">{stageCopy[stage].title}</h2>
                <p className="mt-1 text-sm text-slate-500">{stageCopy[stage].detail}</p>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
