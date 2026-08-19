import { useState } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { Avatar } from '@/components/patterns/Avatar'
import { EmptyState } from '@/components/patterns/EmptyState'
import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { Badge } from '@/components/ui/Badge'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct } from '@/lib/projectHealth'
import { PersonHoursDetail } from './PersonHoursDetail'
import type { PersonSummary } from '@/lib/hoursByPerson'

/** Share of the table width per column — fixed layout, so nothing overflows
    its own cell and the widths scale with the page. */
const COLUMNS: { label: string; width: string }[] = [
  { label: 'Person', width: '14%' },
  { label: 'Projects', width: '7%' },
  { label: 'Packages', width: '8%' },
  { label: 'Activities', width: '8%' },
  { label: 'Actual / Budget', width: '14%' },
  { label: 'Remaining', width: '8%' },
  { label: 'Used', width: '7%' },
  { label: 'Overtime', width: '7%' },
  { label: 'Banked', width: '7%' },
  { label: 'Non-project', width: '8%' },
  { label: 'Status', width: '12%' },
]

export interface HoursByPersonTabProps {
  people: PersonSummary[]
  loading?: boolean
  /** Shown when nothing matched, so the caller owns the "clear filters" action. */
  emptyAction?: React.ReactNode
  filtered?: boolean
}

/**
 * Everyone's hours in one list, each person expandable to their detail — the
 * aggregated counterpart to the raw All Entries tab, and the doc's "Hours Worked
 * summary".
 *
 * Same visual language as the project's Team tab and the work package rows on
 * purpose: chevron, name, status badge, count chips, then the figures with the
 * meter and percentage last. Someone who has learned one has learned all three.
 *
 * The three columns that stop the headline percentage from lying: **Overtime**,
 * **Banked** and **Non-project** are hours worked that no budget covers, so they
 * are reported beside Actual and never inside it. `summarisePeople` in
 * lib/hoursByPerson.ts explains the attribution rules in full.
 */
export function HoursByPersonTab({ people, loading = false, emptyAction, filtered = false }: HoursByPersonTabProps) {
  const [open, setOpen] = useState<string[]>([])
  const toggle = (name: string) =>
    setOpen((o) => (o.includes(name) ? o.filter((n) => n !== name) : [...o, name]))

  if (loading) {
    return (
      <div className="grid gap-sm p-lg" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-sm bg-neutral-100" />)}
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
      <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 1060 }}>
        <caption className="sr-only">
          Hours per person: budget, actual and remaining across every project, expandable to each person&apos;s activities
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
            const isOpen = open.includes(p.name)
            const over = p.health.state === 'over-budget'
            return [
              <tr key={p.name} className="border-b border-border-default">
                <td className="px-sm py-base align-middle">
                  <button
                    type="button"
                    onClick={() => toggle(p.name)}
                    aria-expanded={isOpen}
                    className="flex w-full min-w-0 items-center gap-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
                  >
                    <ChevronDown size={16} aria-hidden className={`shrink-0 text-text-muted transition-transform duration-fast ${isOpen ? '' : '-rotate-90'}`} />
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
                <td className="whitespace-nowrap px-sm py-base align-middle text-sm text-text-primary">{p.activityCount}</td>
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
              </tr>,
              isOpen && (
                <tr key={`${p.name}-detail`} className="border-b border-border-default bg-neutral-50">
                  <td colSpan={COLUMNS.length} className="px-sm pb-lg pt-xs">
                    <PersonHoursDetail person={p} />
                  </td>
                </tr>
              ),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}
