const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * THE way a date reads anywhere a person sees one: **`Aug 20, 2026`**.
 *
 * Dates are stored and compared as ISO (`2026-08-20`) — it sorts as text and
 * `<input type="date">` requires it — but ISO is not what a reader wants in a
 * cell, and `20/08/2026` means two different days depending on which side of
 * the Atlantic you read it on. A named month can only be read one way.
 *
 * Anything that isn't a plain ISO date comes back untouched rather than
 * becoming "Invalid Date" — legacy rows carry the occasional free-text value.
 */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!m) return iso
  const [, year, month, day] = m
  const name = MONTHS[Number(month) - 1]
  if (!name) return iso
  return `${name} ${Number(day)}, ${year}`
}

/**
 * The same date split for a **table cell**: `Mar 7,` on line one, `2026` on
 * line two.
 *
 * A date is the only value in these tables whose width is fixed by its format
 * rather than its data — twelve characters, every row, forever. Stacking the
 * year hands roughly 30px per date column back to the columns that actually
 * vary, and a year on its own line is still unambiguous.
 */
export function formatDateParts(iso?: string | null): { head: string; year: string } | null {
  const full = formatDate(iso)
  const m = /^(.+), (\d{4})$/.exec(full)
  if (!m) return null
  return { head: `${m[1]},`, year: m[2] }
}
