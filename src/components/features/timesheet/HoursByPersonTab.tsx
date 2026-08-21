import { useNavigate } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { Avatar } from '@/components/patterns/Avatar'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct } from '@/lib/projectHealth'
import { HOURS_PERIODS, type HoursPeriod } from '@/lib/hoursPeriod'
import type { PersonSummary } from '@/lib/hoursByPerson'

/** Share of the table width per column — fixed layout, so nothing overflows
    its own cell and the widths scale with the page. */
const COLUMNS: { label: string; width: string }[] = [
  { label: 'Person', width: '15%' },
  { label: 'Projects', width: '7%' },
  { label: 'Packages', width: '7%' },
  { label: 'Actual / Budget', width: '14%' },
  { label: 'Remaining', width: '8%' },
  { label: 'Used', width: '7%' },
  { label: 'Overtime', width: '6%' },
  { label: 'Banked', width: '6%' },
  { label: 'Non-project', width: '7%' },
  { label: 'Status', width: '10%' },
  { label: 'Actions', width: '13%' },
]

export interface HoursByPersonTabProps {
  people: PersonSummary[]
  loading?: boolean
  /** Shown when nothing matched, so the caller owns the "clear filters" action. */
  emptyAction?: React.ReactNode
  filtered?: boolean
  /** The period this table's own figures are scoped to — independent of the
      page's date-range filter, and narrower: see `lib/hoursPeriod.ts`. */
  period: HoursPeriod
  onPeriodChange: (period: HoursPeriod) => void
  /** Project / work package name only — the page's own search already covers
      employee, activity and comment text, so this one stays scoped to what its
      placeholder promises. */
  query: string
  onQueryChange: (query: string) => void
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
 * **Its own toolbar**, not the page's. The period picker and the project/work
 * package search only ever change what this table sums — the page's search and
 * filter menu keep scoping the raw entries both tabs share, so a period picked
 * here has no effect on All Entries. Compact on purpose: a person's name is the
 * thing being scanned in this list, so the controls above it are sized to stay
 * out of the way rather than to match the page header's search field.
 */
export function HoursByPersonTab({
  people, loading = false, emptyAction, filtered = false, period, onPeriodChange, query, onQueryChange,
}: HoursByPersonTabProps) {
  const navigate = useNavigate()

  const toolbar = (
    <div className="flex flex-wrap items-center gap-sm border-b border-border-default px-lg py-base">
      <div className="min-w-0" style={{ width: 160 }}>
        <label htmlFor="by-person-period" className="sr-only">Time period</label>
        <Select id="by-person-period" size="sm" value={period} onChange={(e) => onPeriodChange(e.target.value as HoursPeriod)}>
          {HOURS_PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </Select>
      </div>
      <div className="min-w-0 flex-1" style={{ maxWidth: 280 }}>
        <label htmlFor="by-person-search" className="sr-only">Search by project or work package</label>
        <Input
          size="sm" id="by-person-search" value={query} onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search project or work package..." leadingIcon={<Search size={16} />}
        />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div aria-busy="true">
        {toolbar}
        <div className="grid gap-sm p-lg">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-sm bg-neutral-100" />)}
        </div>
      </div>
    )
  }

  if (people.length === 0) {
    return (
      <div>
        {toolbar}
        <EmptyState
          icon={<Users size={48} strokeWidth={1.5} />}
          title={filtered ? 'No hours match your search' : 'No hours logged yet'}
          description={
            filtered
              ? 'Try a different employee, project, work package, period or filter.'
              : 'Once anyone logs time, their totals appear here.'
          }
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <div>
      {toolbar}
      <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 1060 }}>
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
                        className="whitespace-nowrap rounded-sm bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">
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
    </div>
  )
}
