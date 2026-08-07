import { useState, type ReactNode } from 'react'
import { ChevronUp } from 'lucide-react'

export interface AccordionSectionProps {
  title: string
  meta?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function AccordionSection({ title, meta, defaultOpen = true, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-lg bg-neutral-50 px-lg py-base text-left transition-colors duration-fast hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary"
        >
          <span className="text-sm font-semibold text-text-primary">{title}</span>
          <span className="flex items-center gap-sm">
            {meta && <span className="text-xs text-text-muted">{meta}</span>}
            <ChevronUp size={16} className={`text-text-muted transition-transform duration-fast ${open ? '' : 'rotate-180'}`} aria-hidden />
          </span>
        </button>
      </h3>
      {open && <div className="grid gap-lg p-lg">{children}</div>}
    </section>
  )
}
