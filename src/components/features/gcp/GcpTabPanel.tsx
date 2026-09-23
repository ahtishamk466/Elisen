import { ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/components/patterns/EmptyState'

export interface GcpTabPanelProps {
  /** The legacy screen this tab carries, e.g. "Cert Plan Initialize". */
  title: string
  /** What the screen is for, in the client's own terms. */
  description: string
}

/** A GCP tab whose screen is mapped but whose content is still being written
    up with the client. Replaced tab by tab as each screen is specified.
    Renders inside the caller's card — a tab strip already carries one. */
export function GcpTabPanel({ title, description }: GcpTabPanelProps) {
  return (
    <EmptyState
      icon={<ShieldCheck size={48} strokeWidth={1.5} />}
      title={title}
      description={description}
    />
  )
}
