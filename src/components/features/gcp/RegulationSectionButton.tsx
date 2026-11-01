import { Button } from '@/components/ui/Button'
import { amendmentLabel } from '@/lib/gcpDisplay'
import type { Regulation } from '@/types/gcp'

/**
 * A regulation's Section in a table cell: the row's one bold item and its
 * keyboard control, opening the rule (COMPONENTS.md → "One bold item per table
 * row"). It wraps rather than truncates — a section number is the row's
 * identity ("25.1707(a)(c)…(l)"), so none of it may be hidden. It stops the
 * click reaching the row, whose own click opens the same rule.
 */
export function RegulationSectionButton({ regulation, onOpen }: { regulation: Regulation; onOpen: () => void }) {
  return (
    <Button variant="tertiary" size="sm" className="!h-auto !whitespace-normal break-all text-left tabular-nums"
      aria-label={`Read ${regulation.section} at ${amendmentLabel(regulation.amdt)}`}
      onClick={(e) => { e.stopPropagation(); onOpen() }}>
      {regulation.section}
    </Button>
  )
}
