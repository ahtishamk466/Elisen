import { amendmentLabel } from '@/lib/gcpDisplay'
import { GcpChip } from './GcpChip'

/**
 * An amendment in a table cell, the same in every regulation table: a chip, as
 * the Regulatory Library first showed it (2026-11-02, "keep the consistency in
 * the app for the same columns"). A blank one (an existing legacy record with no
 * amendment) shows the app's empty mark, a muted em dash, with "No amendment
 * recorded" on hover and for screen readers — the full phrase overran narrow
 * Amendment columns into the next cell (2026-11-01). Not "N/A": the rule
 * applies, its amendment just was not recorded. Headings, option labels and
 * sentences keep `amendmentLabel`'s full phrase.
 */
export function AmendmentText({ amdt }: { amdt: string }) {
  if (amdt.trim()) return <GcpChip value={amdt} label="amendments" />
  return (
    <span className="text-text-muted" title={amendmentLabel(amdt)}>
      <span aria-hidden>—</span>
      <span className="sr-only">{amendmentLabel(amdt)}</span>
    </span>
  )
}
