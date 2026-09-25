/**
 * Turns a table's per-column pixel widths into `%` shares of the table's own
 * width, so a screen wider than the table's natural content grows *every*
 * column in proportion instead of leaving the extra as dead space.
 *
 * A `table-fixed` column with an explicit pixel width never grows past it —
 * that's the whole point of `table-fixed` — so a handful of narrow reference
 * columns (a code, a badge, a boolean) on a wide card left every row bunched
 * against the left edge with a blank void before Actions (client-reported,
 * 2026-09-25, twice: GCP Reference Lists → DDS, People & Authority →
 * Delegation — "the whole table sits on one side... manage the spacing
 * between columns, make it look visually balanced").
 *
 * The old fix for the *adjacent* problem — a screen wider than the table
 * leaving dead space past the *last* column — was a trailing, unlabeled
 * `<col />` that soaks up the slack on its own (still correct where a table
 * already has one column that legitimately grows with real content, e.g.
 * `AtaChaptersPage`'s Definition). That doesn't help here: an invisible
 * spacer at the end still reads as "everything crammed left, then nothing."
 * Percentages instead give the growth to columns the reader is already
 * looking at.
 *
 * Pass the same pixel numbers a table already uses for its `minWidth` floor
 * — they double as each column's relative weight, so a code column stays
 * visibly narrower than a title column at any width, not just at the floor.
 */
export function proportionalWidths(weights: number[]): string[] {
  const total = weights.reduce((sum, w) => sum + w, 0)
  return weights.map((w) => `${((w / total) * 100).toFixed(2)}%`)
}
