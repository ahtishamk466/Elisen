import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-lg py-6xl text-center">
      <span className="mb-lg text-neutral-300" aria-hidden>
        {icon ?? <Inbox size={48} strokeWidth={1.5} />}
      </span>
      <p className="text-lg font-bold text-text-primary">{title}</p>
      <p className="mt-xs max-w-96 text-sm text-text-muted">{description}</p>
      {action && <div className="mt-lg">{action}</div>}
    </div>
  )
}
