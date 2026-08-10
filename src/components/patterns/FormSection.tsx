import type { ReactNode } from 'react'

export interface FormSectionProps {
  title: string
  subtitle?: string
  children: ReactNode
}

export function FormSection({ title, subtitle, children }: FormSectionProps) {
  return (
    <section className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <header className="border-b border-border-default bg-neutral-50 px-lg py-base">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {subtitle && <p className="mt-xxss text-xs text-text-muted">{subtitle}</p>}
      </header>
      <div className="grid gap-lg p-lg">{children}</div>
    </section>
  )
}
