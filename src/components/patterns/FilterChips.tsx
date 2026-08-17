import { X } from 'lucide-react'

export interface FilterChip {
  /** Stable key for React, e.g. the filter's field name. */
  key: string
  /** The field, e.g. "Priority" — always shown, so a chip reads on its own. */
  label: string
  /** The chosen value, e.g. "1 – Fire". */
  value: string
  onRemove: () => void
}

export interface FilterChipsProps {
  chips: FilterChip[]
  onClearAll: () => void
}

/**
 * THE applied-filters row. Sits directly under the page header, above the
 * table, on every screen that has a Filters menu — so "what am I currently
 * filtered to?" is answered without reopening the menu.
 *
 * Each chip reads "Field: Value" and removes only itself; Clear filters
 * removes the lot. Renders nothing when no filter is applied, so an unfiltered
 * page keeps its full height.
 */
export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-sm" role="group" aria-label="Applied filters">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-sm rounded-sm border border-border-default bg-neutral-25 py-xs pl-base pr-xs text-sm text-text-primary"
        >
          <span>
            <span className="text-text-secondary">{chip.label}:</span>{' '}
            <span className="font-semibold">{chip.value}</span>
          </span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`Remove ${chip.label} filter`}
            className="rounded-sm p-xxss text-text-muted transition-colors duration-fast hover:bg-neutral-100 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            <X size={14} aria-hidden />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="rounded-sm px-sm py-xs text-sm font-semibold text-text-primary underline-offset-2 transition-colors duration-fast hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
      >
        Clear filters ({chips.length})
      </button>
    </div>
  )
}
