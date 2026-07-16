import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Check, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { journeySteps } from './content'

const tourIntervalMs = 4_400

export function WorkflowTour({ compact = false }: { compact?: boolean }) {
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(!reduceMotion)
  const activeStep = journeySteps[activeIndex]

  useEffect(() => {
    if (!isPlaying || reduceMotion) {
      return
    }

    const timer = window.setTimeout(() => {
      if (activeIndex >= journeySteps.length - 1) {
        setIsPlaying(false)
        return
      }

      setActiveIndex((current) => current + 1)
    }, tourIntervalMs)

    return () => window.clearTimeout(timer)
  }, [activeIndex, isPlaying, reduceMotion])

  function restart() {
    setActiveIndex(0)
    setIsPlaying(!reduceMotion)
  }

  const ActiveIcon = activeStep.icon
  const progress = (activeIndex + 1) / journeySteps.length

  return (
    <section aria-label="VetanFlow workflow walkthrough" className="overflow-hidden rounded-lg border border-white/12 bg-[color:rgba(5,22,38,0.88)] text-white shadow-2xl shadow-slate-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
        <div>
          <p className="text-xs font-semibold uppercase text-blue-200">Live workflow walkthrough</p>
          <p className="mt-1 text-sm text-white/70">Step {activeIndex + 1} of {journeySteps.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={isPlaying ? 'Pause walkthrough' : 'Play walkthrough'}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-white/15 bg-white/8 text-white transition hover:bg-white/14"
            onClick={() => setIsPlaying((current) => !current)}
            type="button"
          >
            {isPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          </button>
          <button
            aria-label="Restart walkthrough"
            className="inline-flex size-11 items-center justify-center rounded-lg border border-white/15 bg-white/8 text-white transition hover:bg-white/14"
            onClick={restart}
            type="button"
          >
            <RotateCcw size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={`grid ${compact ? '' : 'lg:grid-cols-[260px_1fr]'}`}>
        {!compact ? (
          <div className="border-b border-white/10 p-3 lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
              {journeySteps.map((step, index) => {
                const Icon = step.icon
                const isActive = activeIndex === index
                const isComplete = activeIndex > index

                return (
                  <button
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      isActive ? 'bg-white text-slate-950' : 'text-white/70 hover:bg-white/8 hover:text-white'
                    }`}
                    key={step.id}
                    onClick={() => {
                      setActiveIndex(index)
                      setIsPlaying(false)
                    }}
                    type="button"
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-white/8'}`}>
                      {isComplete ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                    </span>
                    <span className="line-clamp-2">{step.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="relative min-h-[360px] overflow-hidden p-5 sm:min-h-[390px] sm:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
            <motion.div
              animate={{ scaleX: progress }}
              className="h-full origin-left bg-blue-400"
              initial={false}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              className="flex min-h-[315px] flex-col justify-between"
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              initial={reduceMotion ? false : { opacity: 0, y: 14, filter: 'blur(6px)' }}
              key={activeStep.id}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-950/30">
                  <ActiveIcon size={22} aria-hidden="true" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase text-blue-200">{activeStep.eyebrow}</p>
                <h2 className="mt-2 max-w-xl text-2xl font-semibold sm:text-3xl">{activeStep.title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">{activeStep.detail}</p>
              </div>

              <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
                <div>
                  <p className="text-xs uppercase text-white/45">Control produced</p>
                  <p className="mt-1 text-base font-semibold">{activeStep.metric}</p>
                </div>
                <div className="flex gap-1.5" aria-hidden="true">
                  {journeySteps.map((step, index) => (
                    <span
                      className={`h-1.5 w-6 rounded-full ${index <= activeIndex ? 'bg-blue-400' : 'bg-white/15'}`}
                      key={step.id}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
