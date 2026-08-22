import { useMemo, useState } from 'react'
import { ChevronDown, Users } from 'lucide-react'
import { Avatar } from '@/components/patterns/Avatar'
import { EmptyState } from '@/components/patterns/EmptyState'
import { BudgetInline, ProgressMeter } from '@/components/patterns/ProgressMeter'
import { Stat as GlobalStat } from '@/components/patterns/Stat'
import { Badge } from '@/components/ui/Badge'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { useTimesheetStore } from '@/stores/timesheetStore'
import { activityName } from '@/lib/catalog'
import { useCatalogStore } from '@/stores/catalogStore'
import {
  HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct, healthOf, rollUpActivities,
} from '@/lib/projectHealth'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

/** One activity a person holds, plus the package it sits in. The same
    activity name can appear twice under different packages. */
interface PersonActivity {
  activity: WorkPackageActivity
  workPackage: WorkPackage
  /** Timesheet rows this person filed against this activity on this project. */
  entries: number
}

/**
 * Who is working on this project, and how each of them is tracking.
 *
 * The project already answers "how is the *work* going" (Work Packages). This
 * answers "how are the *people* going" — the same hours sliced by person
 * instead of by package, which is the only way to see that one engineer holds
 * four activities spread across two packages.
 *
 * Deliberately the same visual language as WorkPackageCard: a summary row you
 * can read without expanding (count chip, hours, bar, % used), and the detail
 * underneath. Budget and actual come from the activity roll-up, the same source
 * as every other total in the app, so this tab can never disagree with the
 * package rows or the tiles above. Time Entry contributes the entry count only,
 * for the same reason.
 */
export function ProjectTeamTab({ projectId }: { projectId: string }) {
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const activities = useWorkPackagesStore((s) => s.activities)
  const timesheet = useTimesheetStore((s) => s.rows)
  const catalogActivities = useCatalogStore((s) => s.activities)
  const [open, setOpen] = useState<string[]>([])

  const people = useMemo(() => {
    const packages = workPackages.filter((w) => w.projectId === projectId)
    const byId = new Map(packages.map((w) => [w.id, w]))
    const mine = activities.filter((a) => byId.has(a.workPackageId))

    const entriesFor = (a: WorkPackageActivity) =>
      timesheet.filter((t) =>
        t.projectId === projectId && t.workPackageId === a.workPackageId
        && t.activityId === a.activityId && t.employeeName === a.responsible).length

    const grouped = new Map<string, PersonActivity[]>()
    for (const a of mine) {
      const name = a.responsible || 'Unassigned'
      const list = grouped.get(name) ?? []
      list.push({ activity: a, workPackage: byId.get(a.workPackageId)!, entries: entriesFor(a) })
      grouped.set(name, list)
    }

    return [...grouped.entries()]
      .map(([name, list]) => {
        const health = rollUpActivities(list.map((x) => x.activity))
        return {
          name,
          items: list.sort((x, y) =>
            x.workPackage.title.localeCompare(y.workPackage.title)
            || activityName(catalogActivities, x.activity.activityId).localeCompare(activityName(catalogActivities, y.activity.activityId))),
          packageCount: new Set(list.map((x) => x.workPackage.id)).size,
          entries: list.reduce((n, x) => n + x.entries, 0),
          health,
        }
      })
      // Most hours first: the people carrying the project lead the list, and
      // anyone over budget surfaces near the top where it matters.
      .sort((a, b) => b.health.actual - a.health.actual || a.name.localeCompare(b.name))
  }, [workPackages, activities, timesheet, projectId, catalogActivities])

  const toggle = (name: string) =>
    setOpen((o) => (o.includes(name) ? o.filter((n) => n !== name) : [...o, name]))

  const totals = useMemo(() => ({
    activities: people.reduce((n, p) => n + p.items.length, 0),
    entries: people.reduce((n, p) => n + p.entries, 0),
    // State, not a negative remainder: no budget at all is not over budget.
    over: people.filter((p) => p.health.state === 'over-budget').length,
  }), [people])

  if (people.length === 0) {
    return (
      <div className="rounded-sm border border-border-default bg-neutral-25">
        <EmptyState
          icon={<Users size={48} strokeWidth={1.5} />}
          title="Nobody is assigned to this project yet"
          description="People appear here once activities inside its work packages have someone responsible."
        />
      </div>
    )
  }

  return (
    <div className="grid gap-lg">
      {/* Same compact strip as the Work Packages tab, so the two read as a pair. */}
      <div className="flex flex-wrap items-stretch gap-y-base rounded-sm border border-border-default bg-neutral-25 px-lg py-base">
        <dl className="flex flex-wrap items-stretch">
          <Stat label="People" value={people.length} />
          <Stat label="Activities" value={totals.activities} />
          <Stat label="Time entries" value={totals.entries} />
          <Stat label="Over budget" value={totals.over} />
        </dl>
      </div>

      {people.map((p) => {
        const isOpen = open.includes(p.name)
        return (
          <section key={p.name} className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
            <header className="flex flex-wrap items-center gap-sm px-lg py-base">
              <button
                type="button"
                onClick={() => toggle(p.name)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
              >
                <ChevronDown size={16} className={`shrink-0 text-text-muted transition-transform duration-fast ${isOpen ? '' : '-rotate-90'}`} aria-hidden />
                <Avatar name={p.name} />
                <span className="truncate text-sm font-semibold text-text-primary">{p.name}</span>
                <Badge tone={HEALTH_TONE[p.health.state]}>{HEALTH_LABEL[p.health.state]}</Badge>
                {/* Counts as neutral chips, the app's one way of saying "how
                    much is inside" without expanding. */}
                <span className="shrink-0 whitespace-nowrap rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">
                  {p.items.length} {p.items.length === 1 ? 'activity' : 'activities'}
                </span>
                <span className="shrink-0 whitespace-nowrap rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">
                  {p.packageCount} {p.packageCount === 1 ? 'package' : 'packages'}
                </span>
              </button>
              <BudgetInline health={p.health} ariaLabel={`${p.name} budget on this project`} />
            </header>

            {isOpen && (
              <div className="overflow-x-auto border-t border-border-default p-lg">
                <table className="w-full border-collapse text-left" style={{ minWidth: 740 }}>
                  <caption className="sr-only">Activities held by {p.name} on this project</caption>
                  <thead>
                    <tr className="border-b border-border-default">
                      {['Work Package', 'Activity', 'Actual / Budget', 'Remaining', 'Used', 'Status', 'Time Entries'].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="whitespace-nowrap px-sm py-sm text-xs font-semibold text-text-secondary"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.items.map(({ activity, workPackage, entries }) => {
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
            )}
          </section>
        )
      })}
    </div>
  )
}

/** One label/value pair in the summary strip — the global `Stat` pair in
    this strip's own divider bay. */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l border-border-default px-2xl first:border-l-0 first:pl-0 last:pr-0">
      <GlobalStat dl label={label}>{value}</GlobalStat>
    </div>
  )
}
