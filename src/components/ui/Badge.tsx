import type { ReactNode } from 'react'

export type BadgeTone = 'danger' | 'info' | 'success' | 'warning' | 'neutral'
export type BadgeAppearance = 'subtle' | 'outline'
/** `sm` (20px) is the table/row badge and the default — every existing call
    site keeps it. `md` (28px) is for a card heading, where a 12px badge reads
    as an afterthought beside an 20px title and sits visibly shorter than the
    count chips next to it. */
export type BadgeSize = 'sm' | 'md'

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-sm py-xxss text-xs',
  md: 'px-base py-xs text-sm',
}

const SUBTLE_CLASSES: Record<BadgeTone, string> = {
  danger: 'bg-danger-subtle text-danger',
  info: 'bg-info-subtle text-info',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  neutral: 'bg-neutral-100 text-text-secondary',
}

export interface BadgeProps {
  tone?: BadgeTone
  appearance?: BadgeAppearance
  size?: BadgeSize
  children: ReactNode
}

export function Badge({ tone = 'neutral', appearance = 'subtle', size = 'sm', children }: BadgeProps) {
  const base = `inline-flex items-center whitespace-nowrap rounded-sm font-medium ${SIZE_CLASSES[size]}`
  const look =
    appearance === 'subtle'
      ? SUBTLE_CLASSES[tone]
      : 'border border-border-default bg-neutral-25 text-text-secondary'
  return (
    <span className={`${base} ${look}`}>
      {children}
    </span>
  )
}
