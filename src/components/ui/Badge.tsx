import type { ReactNode } from 'react'

export type BadgeTone = 'danger' | 'info' | 'success' | 'warning' | 'neutral'
export type BadgeAppearance = 'subtle' | 'outline'

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
  children: ReactNode
}

export function Badge({ tone = 'neutral', appearance = 'subtle', children }: BadgeProps) {
  const base = 'inline-flex items-center whitespace-nowrap rounded-sm px-sm py-xxss text-xs font-medium'
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
