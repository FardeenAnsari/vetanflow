import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

export type StatusTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning'

const toneClasses: Record<StatusTone, string> = {
  danger: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
}

const toneIcons = {
  danger: CircleX,
  info: Info,
  neutral: Info,
  success: CircleCheck,
  warning: TriangleAlert,
}

type StatusBadgeProps = {
  children: ReactNode
  className?: string
  showIcon?: boolean
  tone?: StatusTone
}

export function StatusBadge({
  children,
  className = '',
  showIcon = true,
  tone = 'neutral',
}: StatusBadgeProps) {
  const Icon = toneIcons[tone]

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    >
      {showIcon ? <Icon size={13} strokeWidth={2} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
