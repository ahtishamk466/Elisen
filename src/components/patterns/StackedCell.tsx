import type { ReactNode } from 'react'
import { Truncate } from './Truncate'

export interface StackedCellProps {
  /** Line 1 — how the row is asked for: a project number, a basis code, a
      TCCA number. Truncates rather than wrapping. */
  identifier: ReactNode
  /** Line 2 — the line that confirms the row (title, description). One line,
      clipped, with the full text on hover. Omit for a single-line cell. */
  detail?: string
  /** Sits after the identifier and never shrinks: a `Badge` (Copy, a
      warning count). */
  trailing?: ReactNode
  /** Digits line up down the column — use for numbers like `4417-02`. */
  tabularNums?: boolean
  /** Makes the whole cell the row's keyboard control: a real `<button>`
      filling the cell. It stops the click reaching the row, so the row's own
      `onClick` does not fire twice. Omit when the identifier is already a
      link (pass the `Link` as `identifier`) or the row has another control. */
  onClick?: () => void
  /** Accessible name for the button; defaults to its text. */
  ariaLabel?: string
}

const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary'

/**
 * THE two-line identifier cell for list tables: identifier on top (14px
 * semibold), the confirming line under it (13px, secondary, one line).
 *
 * Extracted from the Projects and Certification Basis lists, which each
 * carried a hand-rolled copy. Every list table that leads with an identifier
 * renders it through this component, so the size, weight, truncation and
 * focus ring cannot drift apart between tables.
 */
export function StackedCell({ identifier, detail, trailing, tabularNums, onClick, ariaLabel }: StackedCellProps) {
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-xs">
        <span className={`min-w-0 truncate text-sm font-semibold${tabularNums ? ' tabular-nums' : ''}`}>{identifier}</span>
        {trailing && <span className="shrink-0">{trailing}</span>}
      </span>
      {detail && (
        <span className="block text-xs text-text-secondary">
          <Truncate lines={1}>{detail}</Truncate>
        </span>
      )}
    </>
  )

  if (!onClick) return <div className="min-w-0 text-text-primary">{body}</div>

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`block w-full min-w-0 text-left text-text-primary underline-offset-2 hover:text-accent ${FOCUS}`}
    >
      {body}
    </button>
  )
}
