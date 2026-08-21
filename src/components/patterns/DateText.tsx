import { formatDate } from '@/lib/formatDate'

export interface DateTextProps {
  value?: string | null
  /** Muted em dash when there is no date, matching every other empty cell. */
  emptyLabel?: string
}

/**
 * THE way a date appears in a table cell: **`Mar 7, 2026`**, on one line where
 * the column can hold it and broken after the comma where it can't.
 *
 * It is deliberately not `whitespace-nowrap`: the only break opportunity in a
 * formatted date is the space before the year, so letting it wrap gives
 * `Mar 24,` over `2026` — exactly the stacked form a starved column needs —
 * without any table having to decide in advance which it gets. A wide screen
 * gets the date as one thing to read; a 1280 laptop with eleven columns gets
 * the 30px back. `leading-tight` keeps the two-line case inside the row's
 * existing height.
 */
export function DateText({ value, emptyLabel = '—' }: DateTextProps) {
  if (!value) return <span className="text-text-muted">{emptyLabel}</span>
  return <span className="block leading-tight">{formatDate(value)}</span>
}
