import type { ReactNode } from 'react'
import { TriangleAlert, Info } from 'lucide-react'

export type AlertTone = 'danger' | 'info'

export interface AlertProps {
  tone?: AlertTone
  title: string
  children?: ReactNode
}

export function Alert({ tone = 'danger', title, children }: AlertProps) {
  const toneClasses = tone === 'danger' ? 'border-danger bg-danger-subtle' : 'border-info bg-info-subtle'
  const Icon = tone === 'danger' ? TriangleAlert : Info
  return (
    <div role="alert" className={`flex gap-sm rounded-sm border p-lg ${toneClasses}`}>
      <Icon size={18} className={`mt-xxss shrink-0 ${tone === 'danger' ? 'text-danger' : 'text-info'}`} aria-hidden />
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {children && <p className="mt-xxss text-sm text-text-secondary">{children}</p>}
      </div>
    </div>
  )
}
