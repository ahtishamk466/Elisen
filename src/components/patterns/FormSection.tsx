import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'

export interface FormSectionProps {
  title: string
  /** Retained for caller compatibility; shared section headers render titles only. */
  subtitle?: string
  /** Optional semantic badge; it never changes the section surface or selection state. */
  requirement?: 'required' | 'optional'
  children: ReactNode
}

export function FormSection({ title, requirement, children }: FormSectionProps) {
  return (
    <section className="overflow-hidden rounded-sm border border-section-border bg-section-surface">
      <header className="border-b border-section-border bg-section-header px-lg py-lg">
        <div className="flex flex-wrap items-center gap-sm">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {requirement && <Badge tone="neutral">{requirement === 'required' ? 'Required' : 'Optional'}</Badge>}
        </div>
      </header>
      <div className="grid gap-lg p-lg">{children}</div>
    </section>
  )
}
