import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { SortMenu } from '@/components/patterns/SortMenu'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Badge } from '@/components/ui/Badge'
import { activityName } from '@/lib/catalog'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct, healthOf } from '@/lib/projectHealth'
import type { Activity } from '@/types/catalog'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

/** One activity a person holds, plus the package it sits in. The same
    activity name can appear twice under different packages. */
export interface PersonActivity {
  activity: WorkPackageActivity
  workPackage: WorkPackage
  /** Timesheet rows this person filed against this activity on this project. */
  entries: number
}

type SortKey = 'package' | 'activity' | 'actual' | 'budget' | 'remaining' | 'used' | 'status' | 'entries'

const COLUMNS: { label: string; sort?: SortKey; sorts?: { key: SortKey; label: string }[] }[] = [
  { label: 'Work Package', sort: 'package' },
  { label: 'Activity', sort: 'activity' },
  { label: 'Actual / Budget', sorts: [{ key: 'actual', label: 'Actual' }, { key: 'budget', label: 'Budget' }] },
  { label: 'Remaining', sort: 'remaining' },
  { label: 'Used', sort: 'used' },
  { label: 'Status', sort: 'status' },
  { label: 'Time Entries', sort: 'entries' },
]

export interface TeamActivityTableProps {
  personName: string
  items: PersonActivity[]
  catalogActivities: Activity[]
}

/**
 * The activities one person holds on a project — the expanded half of a
 * `ProjectTeamTab` card.
 *
 * Its own component because each card owns its own sort state, and a hook
 * cannot run inside the `people.map()` that renders the cards. Splitting it
 * also kept `ProjectTeamTab` under the ~200-line guideline, the same way
 * `PersonWorkPackageCard` came out of `PersonProjectPanel`.
 */
export function TeamActivityTable({ personName, items, catalogActivities }: TeamActivityTableProps) {
  /* Sorted on the health roll-up rather than the printed cell: Remaining is a
     signed number the cell renders with a minus sign and no sign at all when
     there is no budget, and Used is a percentage that is null — not zero —
     for an unbudgeted activity, so those rows sink instead of leading. */
  const health = (i: PersonActivity) =>
    healthOf(i.activity.budgetHours, i.activity.actualHours, i.workPackage.status === 'complete')

  const { sorted, sort, setSort } = useTableSort(items, {
    package: (i) => i.workPackage.title,
    activity: (i) => activityName(catalogActivities, i.activity.activityId),
    actual: (i) => health(i).actual,
    budget: (i) => health(i).budget,
    remaining: (i) => (health(i).budget > 0 ? health(i).remaining : null),
    used: (i) => health(i).progressPct,
    status: (i) => health(i).state,
    entries: (i) => i.entries,
  })

  return (
    <div className="overflow-x-auto border-t border-border-default p-lg">
      <table className="w-full border-collapse text-left" style={{ minWidth: 740 }}>
        <caption className="sr-only">Activities held by {personName} on this project</caption>
        <thead>
          <tr className="border-b border-border-default">
            {COLUMNS.map((c) => (
              <SortableTh
                key={c.label}
                sortKey={c.sort}
                ownsKeys={c.sorts?.map((o) => o.key)}
                sort={sort}
                onSortChange={setSort}
                className="whitespace-nowrap px-sm py-sm text-xs font-semibold text-text-secondary"
              >
                {c.sorts
                  ? <SortMenu label={c.label} options={c.sorts} sort={sort} onChange={setSort} />
                  : c.label}
              </SortableTh>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(({ activity, workPackage, entries }) => {
            const h = healthOf(activity.budgetHours, activity.actualHours, workPackage.status === 'complete')
            const over = h.remaining < 0
            return (
              <tr key={activity.id} className="border-b border-border-default last:border-b-0">
                <td className="whitespace-nowrap px-sm py-sm text-sm text-text-primary">{workPackage.title}</td>
                <td className="whitespace-nowrap px-sm py-sm text-sm text-text-primary">{activityName(catalogActivities, activity.activityId)}</td>
                <td className="whitespace-nowrap px-sm py-sm text-sm text-text-primary">
                  {h.budget > 0 ? `${formatHours(h.actual)} / ${formatHours(h.budget)}` : `${formatHours(h.actual)} / no budget`}
                </td>
                <td className={`whitespace-nowrap px-sm py-sm text-sm ${over ? 'font-semibold text-danger' : 'text-text-primary'}`}>
                  {h.budget > 0 ? `${over ? '−' : ''}${formatHours(Math.abs(h.remaining))}` : '—'}
                </td>
                <td className="whitespace-nowrap px-sm py-sm">
                  <span className="block text-sm text-text-primary">{formatPct(h.progressPct)}</span>
                  <span className="mt-xxss block" style={{ width: 44 }}>
                    <ProgressMeter health={h} size="sm" ariaLabel={`${activityName(catalogActivities, activity.activityId)} budget`} />
                  </span>
                </td>
                <td className="whitespace-nowrap px-sm py-sm">
                  <Badge tone={HEALTH_TONE[h.state]}>{HEALTH_LABEL[h.state]}</Badge>
                </td>
                <td className="whitespace-nowrap px-sm py-sm text-sm text-text-primary">{entries}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
