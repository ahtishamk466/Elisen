import { useNavigate } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import { Avatar } from '@/components/patterns/Avatar'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct } from '@/lib/projectHealth'
import type { PersonSummary } from '@/lib/hoursByPerson'

/**
 * Pixel widths, not percentages, each measured as the column's own widest
 * text — heading or body content, whichever is wider — plus the 16px the two
 * `px-sm` pads supply and a little slack. Percentages divided the table by
 * eleven arbitrary shares, so a column whose heading happened to be long
 * ("Non-project", "Packages") filled its whole cell and sat 3px from its
 * neighbour's text while short-headed columns floated in 100px of space —
 * the "columns merging into each other" the client flagged, twice. Under
 * `table-fixed` any width the table has beyond the sum is shared out
 * proportionally, so wider screens loosen every gap instead of one lucky
 * column. */
const COLUMNS: { label: string; width: number }[] = [
  { label: 'Person', width: 150 },
  { label: 'Projects', width: 74 },
  { label: 'Packages', width: 84 },
  { label: 'Actual / Budget', width: 138 },
  { label: 'Remaining', width: 90 },
  { label: 'Used', width: 70 },
  { label: 'Overtime', width: 80 },
  { label: 'Banked', width: 68 },
  { label: 'Non-project', width: 100 },
  { label: 'Status', width: 148 },
  { label: 'Actions', width: 126 },
]

/** The sum of every column's floor — the point below which the widths above
    would start lying — kept derived so it can't drift when one is retuned. */
const MIN_TABLE_WIDTH = COLUMNS.reduce((n, c) => n + c.width, 0)

export interface HoursByPersonTabProps {
  people: PersonSummary[]
  loading?: boolean
  /** Shown when nothing matched, so the caller owns the "clear filters" action. */
  emptyAction?: React.ReactNode
  filtered?: boolean
}

/**
 * Everyone's hours in one list, each row opening that person's own page — the
 * aggregated counterpart to the raw All Entries tab, and the doc's "Hours Worked
 * summary".
 *
 * **The row used to expand in place.** It opened a second table, up to eight
 * columns wide, inside a cell of this eleven-column one — every activity across
 * every project, flat, with the work package reduced to a repeating column.
 * A busy person filled a screen and a half and pushed the next person out of
 * sight. It now leads to `PersonDetailPage`, which gives the three levels
 * (project → work package → activity) three levels of layout and adds the
 * period filter; nothing that was in the expanded row was dropped.
 *
 * The three columns that stop the headline percentage from lying: **Overtime**,
 * **Banked** and **Non-project** are hours worked that no budget covers, so they
 * are reported beside Actual and never inside it. `summarisePeople` in
 * lib/hoursByPerson.ts explains the attribution rules in full.
 *
 * No toolbar of its own — a period picker and a project/work-package search
 * used to sit above this table, scoped only to it. Removed: the page's own
 * search and filter menu already scope both tabs' rows, and a person's own
 * period filter lives one click away on `PersonDetailPage`.
 */
export function HoursByPersonTab({
  people, loading = false, emptyAction, filtered = false,
}: HoursByPersonTabProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div aria-busy="true">
        <div className="grid gap-sm p-lg">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-sm bg-neutral-100" />)}
        </div>
      </div>
    )
  }

  if (people.length === 0) {
    return (
      <EmptyState
        icon={<Users size={48} strokeWidth={1.5} />}
        title={filtered ? 'No hours match your search' : 'No hours logged yet'}
        description={
          filtered
            ? 'Try a different employee, project, payroll group or date range.'
            : 'Once anyone logs time, their totals appear here.'
        }
        action={emptyAction}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: MIN_TABLE_WIDTH }}>
        <caption className="sr-only">
          Hours per person: budget, actual and remaining across every project. View Details opens the full breakdown for that person.
        </caption>
        <thead>
          <tr className="border-b border-border-default bg-neutral-50">
            {COLUMNS.map((c) => (
              <th key={c.label} scope="col" style={{ width: c.width }}
                className="whitespace-nowrap px-sm py-base text-sm font-semibold text-text-secondary">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((p) => {
            const over = p.health.state === 'over-budget'
            return (
              <tr
                key={p.name}
                onClick={() => navigate(`/hours-worked/person/${encodeURIComponent(p.name)}`)}
                className="cursor-pointer border-b border-border-default transition-colors duration-fast hover:bg-accent-subtle"
              >
                <td className="px-sm py-base align-middle">
                  {/* The name is the link, so the row is reachable by keyboard
                      and reads as one destination — the whole-row click is the
                      mouse convenience on top, as on the projects table. */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); navigate(`/hours-worked/person/${encodeURIComponent(p.name)}`) }}
                    className="flex w-full min-w-0 items-center gap-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    <Avatar name={p.name} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-text-primary">{p.name}</span>
                      {/* Designation under the name — it is what tells a reader
                          whether 200h of Airworthiness is expected or odd. The
                          staff flag shares this line rather than taking a third. */}
                      <span className="block truncate text-xs text-text-secondary">
                        {!p.onStaff
                          ? <span title="Hours exist for this name, but there is no staff record for them" className="text-danger">Not on staff record</span>
                          : !p.employed
                            ? <span title="Former employee. Their logged hours stay on the record.">Former · {p.designation}</span>
                            : p.designation}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="whitespace-nowrap px-sm py-base align-middle text-sm text-text-primary">{p.projectCount}</td>
                <td className="whitespace-nowrap px-sm py-base align-middle text-sm text-text-primary">{p.packageCount}</td>
                <td className="whitespace-nowrap px-sm py-base align-middle text-sm text-text-primary">
                  {p.health.budget > 0 ? `${formatHours(p.health.actual)} / ${formatHours(p.health.budget)}` : `${formatHours(p.health.actual)} / no budget`}
                </td>
                <td className={`whitespace-nowrap px-sm py-base align-middle text-sm ${over ? 'font-semibold text-danger' : 'text-text-primary'}`}>
                  {p.health.budget > 0 ? `${over ? '−' : ''}${formatHours(Math.abs(p.health.remaining))}` : '—'}
                </td>
                <td className="whitespace-nowrap px-sm py-base align-middle">
                  <span className="block text-sm text-text-primary">{formatPct(p.health.progressPct)}</span>
                  <span className="mt-xxss block" style={{ width: 44 }}>
                    <ProgressMeter health={p.health} size="sm" ariaLabel={`${p.name} budget across all projects`} />
                  </span>
                </td>
                <td className="whitespace-nowrap px-sm py-base align-middle text-sm text-text-primary">
                  {p.overtime > 0 ? formatHours(p.overtime) : '—'}
                </td>
                <td className="whitespace-nowrap px-sm py-base align-middle text-sm text-text-primary">
                  {p.banked > 0 ? formatHours(p.banked) : '—'}
                </td>
                <td className="whitespace-nowrap px-sm py-base align-middle text-sm text-text-primary">
                  {p.nonProjectHours > 0 ? formatHours(p.nonProjectHours) : '—'}
                </td>
                <td className="px-sm py-base align-middle">
                  {/* Two lines at most: where they stand, and the one flag that
                      needs acting on. The over-budget count came out — the Used
                      percentage and its meter already carry that, and the
                      expanded rows name exactly which activities are over. */}
                  <span className="flex flex-col items-start gap-xs">
                    <Badge tone={HEALTH_TONE[p.health.state]}>{HEALTH_LABEL[p.health.state]}</Badge>
                    {p.unvalidated > 0 && (
                      <span title="Entries an administrator has not validated yet"
                        className="whitespace-nowrap rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">
                        {p.unvalidated} unvalidated
                      </span>
                    )}
                  </span>
                </td>
                <td className="whitespace-nowrap px-sm py-base align-middle" onClick={(e) => e.stopPropagation()}>
                  {/* A direct action rather than a 3-dot menu: there is exactly
                      one thing to do with a row here, and a menu that opens to
                      reveal a single item is a click this doesn't need. */}
                  <Button
                    variant="tertiary" size="sm"
                    trailingIcon={<ArrowRight size={14} aria-hidden />}
                    /* `!text-accent`: tertiary's own `text-text-primary` is
                       the same Tailwind layer/specificity, so appending a
                       plain `text-accent` after it in the class string does
                       not reliably win — verified live (computed colour
                       stayed black without `!`). The important-modifier is
                       what actually makes this one CTA read in the primary
                       colour by default, not just on hover. */
                    className="!text-accent"
                    onClick={() => navigate(`/hours-worked/person/${encodeURIComponent(p.name)}`)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
