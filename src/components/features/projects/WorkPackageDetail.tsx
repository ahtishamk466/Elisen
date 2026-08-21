import { ClipboardCheck, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ChipOverflow } from '@/components/patterns/ChipOverflow'
import { PersonCell } from '@/components/patterns/PersonCell'
import { ProgressMeter } from '@/components/patterns/ProgressMeter'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { activityName, tasksForActivity, type Catalog } from '@/lib/catalog'
import { formatHours, formatPct, healthOf, rollUpActivities } from '@/lib/projectHealth'
import { WP_STATUS_LABEL, WP_STATUS_TONE } from '@/lib/workPackageDisplay'
import { formatDate } from '@/lib/formatDate'
import { PRIORITY_LABEL } from '@/lib/projectDisplay'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'
import type { ProjectPriority } from '@/types/project'

/* Shares of the detail pane, not pixel caps: the pane is ~750px next to the
   rail, so every heading has to fit its share on one line. "Actual / Budget"
   is the widest heading here and sets its own column, as usual. */
const COLUMNS: { label: string; width: string }[] = [
  { label: 'Activity Name', width: '16%' },
  { label: 'Responsible', width: '14%' },
  { label: 'Actual / Budget', width: '17%' },
  { label: 'Remaining', width: '12.5%' },
  { label: 'Used', width: '14%' },
  { label: 'Tasks', width: '18%' },
  { label: 'Action', width: '8.5%' },
]

export interface WorkPackageDetailProps {
  workPackage: WorkPackage
  projectLabel: string
  projectTitle: string
  projectType: string
  /** The project's priority key, so this can render the app's own label and
      tone rather than being handed a pre-formatted string. */
  projectPriority?: ProjectPriority
  /** ISO opened date of the project this package belongs to. */
  projectOpenedDate: string
  activities: WorkPackageActivity[]
  catalog: Catalog
  onEditPackage: () => void
  onDeletePackage: () => void
  onAddActivity: () => void
  onViewActivity: (a: WorkPackageActivity) => void
  onEditActivity: (a: WorkPackageActivity) => void
  onRemoveActivity: (a: WorkPackageActivity) => void
}

/** One label/value pair in the summary strip under the package header. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-sm text-text-muted">{label}</dt>
      <dd className="mt-xs text-sm font-semibold text-text-primary">{children}</dd>
    </div>
  )
}

/**
 * The selected package in full: what it is, how it is tracking, and the
 * activities that make it up.
 *
 * Two surfaces, not one: the package is a **card** — icon, name, description,
 * size and status on the header line, then a tinted strip of its five figures —
 * and the activities are their own titled section with their own card beneath
 * it. Folding the table into the same box made the package's own facts read as
 * one more table header.
 *
 * The strip states hours as figures (`2.6h / 2h`) and keeps the single meter for
 * "Used", where a bar earns its place: it is the one value a reader scans down
 * the activity rows to compare.
 */
export function WorkPackageDetail({
  workPackage, projectLabel, projectTitle, projectType, projectPriority, projectOpenedDate, activities, catalog,
  onEditPackage, onDeletePackage, onAddActivity, onViewActivity, onEditActivity, onRemoveActivity,
}: WorkPackageDetailProps) {
  const health = rollUpActivities(activities, workPackage.status === 'complete')
  const over = health.remaining < 0
  const n = activities.length

  return (
    <div className="grid gap-xl">
      {/* 3px of card showing all the way round the tinted header panel — the
          panel is a surface inside the card, not the card's own top edge. */}
      <section className="rounded-sm border border-border-default bg-neutral-25" style={{ padding: 3 }}>
        <header className="flex flex-wrap items-start gap-base rounded-xs bg-neutral-100 px-lg py-lg">
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-accent text-text-inverse">
            <ClipboardCheck size={22} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1" style={{ flexBasis: 200 }}>
            <h2 className="truncate text-base font-bold text-text-primary">{workPackage.title}</h2>
            <p className="mt-xxss truncate text-sm text-text-secondary">
              {workPackage.description || 'No description'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-sm">
            {/* Built like a Badge, not beside one: same padding, size and
                weight, so the count and the status sit on one baseline at one
                height instead of two chips that nearly match. */}
            <span className="inline-flex items-center whitespace-nowrap rounded-sm bg-neutral-200 px-sm py-xxss text-xs font-medium text-text-secondary">
              {n} {n === 1 ? 'Activity' : 'Activities'}
            </span>
            <Badge tone={WP_STATUS_TONE[workPackage.status]}>{WP_STATUS_LABEL[workPackage.status]}</Badge>
            <ActionsMenu
              ariaLabel={`Actions for work package ${workPackage.title}`}
              items={[
                { label: 'Edit', icon: <Pencil size={16} />, onSelect: onEditPackage },
                { label: 'Delete', icon: <Trash2 size={16} />, onSelect: onDeletePackage, tone: 'danger' },
              ]}
            />
          </div>
        </header>

        {/* Three per row, two rows: six facts of roughly equal weight read as
            a block, where auto-fit tracks re-flowed them into a ragged 5 + 1
            depending on the width of the pane. */}
        <dl className="grid gap-x-lg gap-y-xl px-lg py-lg tablet:grid-cols-3">
          <Fact label="Sr #"><span className="block truncate tabular-nums">{projectLabel}</span></Fact>
          {/* Its own field: a project's type is not a qualifier of its number,
              and stacked under one label neither could be read at a glance. */}
          <Fact label="Type"><span className="block truncate">{projectType || '—'}</span></Fact>
          <Fact label="Project">
            <span className="block truncate" title={projectTitle}>{projectTitle || '—'}</span>
          </Fact>
          <Fact label="Opened">
            <span className="block truncate tabular-nums">{formatDate(projectOpenedDate)}</span>
          </Fact>
          {/* One field for the whole budget question, as on the Projects
              List: only two of its four numbers are independent, so it reads
              top to bottom — spent of what was set aside, then how far through
              and what is left. Merging them is what freed the slot Priority
              needed without making a seventh cell. */}
          <Fact label="Budget">
            <span className="block tabular-nums">
              <span className="font-semibold text-text-primary">{formatHours(health.actual)}</span>
              <span className="font-normal text-text-muted">
                {health.budget > 0 ? ` / ${formatHours(health.budget)}` : ' / no budget'}
              </span>
            </span>
            {health.progressPct === null ? (
              <span className="mt-xxss block text-xs font-normal text-text-muted">Not budgeted</span>
            ) : (
              <span className="mt-xxss flex items-center gap-xs">
                <span className="shrink-0" style={{ width: 40 }}>
                  <ProgressMeter health={health} size="sm" ariaLabel={`${workPackage.title} budget`} />
                </span>
                <span className={`text-xs tabular-nums ${over ? 'font-semibold text-danger' : 'text-text-secondary'}`}>
                  {formatPct(health.progressPct)}
                </span>
                <span className={`text-xs font-normal tabular-nums ${over ? 'text-danger' : 'text-text-muted'}`}>
                  {over
                    ? `${formatHours(Math.abs(health.remaining))} over`
                    : `${formatHours(health.remaining)} left`}
                </span>
              </span>
            )}
          </Fact>
          {/* Back in the strip, where the client wants it: it is a fact about
              the project this package belongs to, alongside its type and its
              number, not a state chip on the package's own header. */}
          <Fact label="Priority">
            {projectPriority
              ? <span className="block truncate">{PRIORITY_LABEL[projectPriority]}</span>
              : <span className="text-text-muted">—</span>}
          </Fact>
        </dl>
      </section>

      <section className="grid gap-base">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <h3 className="text-base font-bold text-text-primary">
            Activities <span className="tabular-nums text-text-secondary">( {n} )</span>
          </h3>
          <Button leadingIcon={<Plus size={16} />} onClick={onAddActivity}>Add New Activity</Button>
        </div>

        {n === 0 ? (
          <p className="rounded-sm border border-border-default bg-neutral-25 px-lg py-xl text-sm text-text-muted">
            No activities yet. Add who will do this work.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25">
            {/* The shares fit the pane from ~1400px up; below that the headings
                stop fitting their own share, so the table scrolls rather than
                silently overflowing one column into the next. */}
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 730 }}>
              <caption className="sr-only">Activities in {workPackage.title}</caption>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {COLUMNS.map((c) => (
                    <th key={c.label} scope="col" style={{ width: c.width }}
                      className="whitespace-nowrap px-sm py-base text-sm font-semibold text-text-secondary">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => {
                  const ah = healthOf(a.budgetHours, a.actualHours, workPackage.status === 'complete')
                  const over = ah.remaining < 0
                  const name = activityName(catalog.activities, a.activityId)
                  return (
                    <tr key={a.id} className="border-b border-border-default last:border-b-0">
                      <td className="px-sm py-lg align-middle text-sm text-text-primary">
                        <span className="block truncate" title={name}>{name}</span>
                      </td>
                      <td className="px-sm py-lg align-middle"><PersonCell name={a.responsible} /></td>
                      <td className="whitespace-nowrap px-sm py-lg align-middle text-sm tabular-nums text-text-primary">
                        {ah.budget > 0 ? `${formatHours(ah.actual)} / ${formatHours(ah.budget)}` : `${formatHours(ah.actual)} / no budget`}
                      </td>
                      <td className={`whitespace-nowrap px-sm py-lg align-middle text-sm tabular-nums ${over ? 'font-semibold text-danger' : 'text-text-primary'}`}>
                        {ah.budget > 0 ? `${over ? '−' : ''}${formatHours(Math.abs(ah.remaining))}` : '—'}
                      </td>
                      {/* Bar and figure on one line: the state colour and the
                          number sit together, and the row stays one line tall. */}
                      <td className="whitespace-nowrap px-sm py-lg align-middle">
                        {ah.progressPct === null ? (
                          <span className="text-sm text-text-muted">—</span>
                        ) : (
                          <span className="flex items-center gap-sm">
                            <span className="shrink-0" style={{ width: 40 }}>
                              <ProgressMeter health={ah} size="sm" ariaLabel={`${name} budget`} />
                            </span>
                            <span className="text-sm tabular-nums text-text-primary">{formatPct(ah.progressPct)}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-sm py-lg align-middle">
                        {/* One chip then the count: task names are long and the
                            detail pane is narrow, so two chips would leave both
                            truncated to nothing. */}
                        <ChipOverflow
                          items={tasksForActivity(catalog, a.activityId, true).map((t) => t.name)}
                          max={1}
                          label="tasks"
                          onShowAll={() => onViewActivity(a)}
                        />
                      </td>
                      <td className="px-sm py-lg align-middle">
                        <ActionsMenu
                          ariaLabel={`Actions for activity ${name}`}
                          items={[
                            { label: 'View', icon: <Eye size={16} />, onSelect: () => onViewActivity(a) },
                            { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEditActivity(a) },
                            { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => onRemoveActivity(a), tone: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
