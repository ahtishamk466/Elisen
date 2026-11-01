import type { ReactNode } from 'react'
import { TriangleAlert, Info } from 'lucide-react'

/** `danger` blocks or has gone wrong; `warning` is fixable and doesn't block
    (e.g. a cert basis holding a rule twice); `info` is guidance. */
export type AlertTone = 'danger' | 'warning' | 'info'

export interface AlertProps {
  tone?: AlertTone
  title: string
  children?: ReactNode
  /** Buttons that fix what the alert reports: beside the text when there is
      room, under it when there isn't. */
  actions?: ReactNode
}

const TONES: Record<AlertTone, { box: string; icon: string; Icon: typeof Info }> = {
  danger: { box: 'border-danger bg-danger-subtle', icon: 'text-danger', Icon: TriangleAlert },
  warning: { box: 'border-warning bg-warning-subtle', icon: 'text-warning', Icon: TriangleAlert },
  info: { box: 'border-info bg-info-subtle', icon: 'text-info', Icon: Info },
}

export function Alert({ tone = 'danger', title, children, actions }: AlertProps) {
  const { box, icon, Icon } = TONES[tone]
  return (
    <div role="alert" className={`flex gap-sm rounded-sm border p-lg ${box}`}>
      <Icon size={18} className={`mt-xxss shrink-0 ${icon}`} aria-hidden />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-lg gap-y-sm">
        <div className="min-w-0 flex-1" style={{ flexBasis: 320 }}>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          {children && <p className="mt-xxss text-sm text-text-secondary">{children}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-sm">{actions}</div>}
      </div>
    </div>
  )
}
