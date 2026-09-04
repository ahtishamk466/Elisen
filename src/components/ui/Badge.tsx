import type { ReactNode } from 'react'

export type BadgeTone = 'danger' | 'info' | 'success' | 'warning' | 'neutral'
export type BadgeAppearance = 'subtle' | 'outline'
/** `sm` (20px) is the table/row badge and the default — every existing call
    site keeps it. `md` is the card-heading status tag: 12px semibold, a
    touch more padding than `sm` so it still reads as a deliberately larger
    tag rather than the same badge with bigger type. */
export type BadgeSize = 'sm' | 'md'

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-sm py-xxss text-xs font-medium',
  md: 'px-base py-xs text-xs font-semibold',
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
  /* `rounded-xs` (4px), not the 8px every other rectangular surface uses:
     a tag is a small pill sitting *inside* a card or a table cell, and at
     that size an 8px radius reads as a rounded box competing with its
     container rather than as a label attached to a value. This is THE tag
     radius — see docs/DESIGN.md "Tags". */
  const base = `inline-flex items-center whitespace-nowrap rounded-xs ${SIZE_CLASSES[size]}`
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
