import { ArrowUpRight } from 'lucide-react'
import { isOpenableUrl } from '@/components/patterns/UrlField'
import { amendmentLabel, sourceLabel } from '@/lib/gcpDisplay'
import type { Regulation } from '@/types/gcp'

/**
 * A regulation's Source in a table cell, as the Regulatory Library shows it:
 * "FAA Source" / "Source" underlined in the accent with the arrow that means
 * "leaves this page" (a link has to look like one before it is hovered), its
 * full purpose for screen readers, opening in a new tab. A muted "No source"
 * when none is stored, or the stored value is not a link that can be opened.
 * The click never reaches the row, so it does not also open the rule.
 */
export function RegulationSourceLink({ regulation: r }: { regulation: Regulation }) {
  if (!isOpenableUrl(r.url)) return <span className="text-sm text-text-muted">No source</span>
  return (
    <a href={r.url.trim()} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-xxss rounded-sm text-sm text-accent underline underline-offset-2 transition-colors duration-fast hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary">
      {sourceLabel(r.url)}
      <ArrowUpRight size={14} aria-hidden className="shrink-0" />
      <span className="sr-only"> for {r.section} at {amendmentLabel(r.amdt)}, opens in a new tab</span>
    </a>
  )
}
