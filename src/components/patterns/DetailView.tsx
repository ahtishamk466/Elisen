import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'

export interface DetailCardProps {
  title: string
  /** A pencil icon in the card header — only for detail pages where each
      section opens its own edit drawer. Most read-only views omit it. */
  onEdit?: () => void
  children: ReactNode
}

/** Standard read-only card: bordered section, bold title, optional edit
    icon. Pair with DetailField for the label/value grid inside. This is
    THE way to show read-only data — never a disabled form input, which
    dims real values to the same gray as an empty placeholder. */
export function DetailCard({ title, onEdit, children }: DetailCardProps) {
  return (
    <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
      <div className="flex items-start justify-between gap-lg">
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title.toLowerCase()}`}
            className="rounded-sm p-xs text-text-secondary transition-colors duration-fast hover:bg-neutral-100 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            <Pencil size={16} aria-hidden />
          </button>
        )}
      </div>
      <div className="mt-lg">{children}</div>
    </section>
  )
}

export interface DetailFieldProps {
  label: string
  children?: ReactNode
  /** Short codes (serial no, reg no, model no, IDs) must never wrap —
      a 2-line code reads as broken, not as data. Long free text (names,
      descriptions, comments) should use <Truncate> instead, never this. */
  nowrap?: boolean
}

/** Muted label above a plain-text value — an em dash when empty, so blank
    is visibly distinct from a real value (unlike a grayed-out input, where
    both look identical). */
export function DetailField({ label, children, nowrap = false }: DetailFieldProps) {
  const isEmpty = children === undefined || children === null || children === ''
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-xxss text-sm text-text-primary ${nowrap ? 'whitespace-nowrap' : ''}`}>{isEmpty ? '—' : children}</p>
    </div>
  )
}
