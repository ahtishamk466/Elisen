import { useState } from 'react'

export interface ChipOverflowProps {
  items: string[]
  /** Chips shown before the count takes over. */
  max?: number
  /** Names the list for the expand button's aria-label, e.g. "tasks". */
  label: string
  /**
   * Take over "+N more" instead of expanding in place — for a table row, where
   * growing the cell would break the two-line rule. Open a view that can hold
   * the full list properly.
   */
  onShowAll?: () => void
}

/**
 * THE way a list of chips appears in a table cell: **at most `max` chips, then
 * `+N more`**, which expands in place (and collapses again).
 *
 * It exists to enforce the two-line row rule structurally. A cell that renders
 * every chip grows with its data — eight task chips once stacked a row to nine
 * lines — and a rule that relies on every call site remembering it will be
 * broken by the next one. The count is a button, not a hint: clicking it shows
 * the full list, so nothing is hidden, only folded.
 */
export function ChipOverflow({ items, max = 2, label, onShowAll }: ChipOverflowProps) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return <span className="text-sm text-text-muted">—</span>
  const shown = open && !onShowAll ? items : items.slice(0, max)
  const hidden = items.length - shown.length

  /* In table-row mode the chips share one line and truncate; a long task name
     would otherwise wrap the cell to a second and third line, which is the very
     thing this component exists to prevent. */
  const inRow = !!onShowAll

  return (
    <span className={`flex min-w-0 items-center gap-xs ${inRow ? 'flex-nowrap' : 'flex-wrap'}`}>
      {shown.map((t) => (
        <span
          key={t}
          title={inRow ? t : undefined}
          style={inRow ? { maxWidth: 96 } : undefined}
          className={`rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary ${inRow ? 'truncate' : 'whitespace-nowrap'}`}
        >
          {t}
        </span>
      ))}
      {items.length > max && (
        <button
          type="button"
          aria-expanded={onShowAll ? undefined : open}
          aria-label={open && !onShowAll ? `Show fewer ${label}` : `Show all ${items.length} ${label}`}
          onClick={(e) => { e.stopPropagation(); if (onShowAll) onShowAll(); else setOpen((v) => !v) }}
          className="shrink-0 whitespace-nowrap text-xs font-medium text-text-primary underline underline-offset-2 transition-colors duration-fast hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          {open && !onShowAll ? 'Show less' : `+${hidden} more`}
        </button>
      )}
    </span>
  )
}
