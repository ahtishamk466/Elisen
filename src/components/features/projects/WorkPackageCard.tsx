import { useState } from 'react'
import { ChevronDown, Eye, Pencil, Trash2, CheckCircle2, RotateCcw, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ChipOverflow } from '@/components/patterns/ChipOverflow'
import { PersonCell } from '@/components/patterns/PersonCell'
import { BudgetInline, ProgressMeter } from '@/components/patterns/ProgressMeter'
import { activityName, tasksForActivity } from '@/lib/catalog'
import { useCatalogStore } from '@/stores/catalogStore'
import { HEALTH_LABEL, HEALTH_TONE, formatHours, formatPct, healthOf, rollUpActivities } from '@/lib/projectHealth'
import { WP_STATUS_LABEL, WP_STATUS_TONE } from '@/lib/workPackageDisplay'
import type { WorkPackage, WorkPackageActivity } from '@/types/workPackage'

const STATUS_LABEL = WP_STATUS_LABEL
const STATUS_TONE = WP_STATUS_TONE

export interface WorkPackageCardProps {
  wp: WorkPackage
  activities: WorkPackageActivity[]
  defaultOpen?: boolean
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: () => void
  onAddActivity: () => void
  onEditActivity: (a: WorkPackageActivity) => void
  onRemoveActivity: (a: WorkPackageActivity) => void
  /** Opens the activity in full — also what "+N more" on Tasks does. */
  onViewActivity: (a: WorkPackageActivity) => void
}

export function WorkPackageCard({
  wp, activities, defaultOpen = false,
  onEdit, onDelete, onToggleComplete, onAddActivity, onEditActivity, onRemoveActivity, onViewActivity,
}: WorkPackageCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const activities_ = useCatalogStore((s) => s.activities)
  const tasks = useCatalogStore((s) => s.tasks)
  const links = useCatalogStore((s) => s.links)
  const catalog = { activities: activities_, tasks, links }
  const health = rollUpActivities(activities, wp.status === 'complete')

  return (
    <section className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <header className="flex flex-wrap items-center gap-sm px-lg py-base">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ChevronDown size={16} className={`shrink-0 text-text-muted transition-transform duration-fast ${open ? '' : '-rotate-90'}`} aria-hidden />
          <span className="truncate text-sm font-semibold text-text-primary">{wp.title}</span>
          <Badge tone={STATUS_TONE[wp.status]}>{STATUS_LABEL[wp.status]}</Badge>
          {/* How much is inside, without expanding — the same neutral chip the
              activity tasks use, so "count of things" reads one way everywhere.
              Zero is shown, not hidden: an empty package is the one you most
              need to notice. */}
          <span className="shrink-0 whitespace-nowrap rounded-xs bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </span>
        </button>
        {/* The package's roll-up, readable without expanding it. "4.4h / 5h"
            alone left the reader to do the arithmetic, so the row states the
            hours, the meter and the percentage — see BudgetInline for why they
            sit in that order. */}
        <BudgetInline health={health} ariaLabel={`${wp.title} budget`} />
        <ActionsMenu
          ariaLabel={`Actions for work package ${wp.title}`}
          items={[
            { label: 'Edit', icon: <Pencil size={16} />, onSelect: onEdit },
            wp.status === 'complete'
              ? { label: 'Reopen', icon: <RotateCcw size={16} />, onSelect: onToggleComplete }
              : { label: 'Mark as complete', icon: <CheckCircle2 size={16} />, onSelect: onToggleComplete },
            { label: 'Delete', icon: <Trash2 size={16} />, onSelect: onDelete, tone: 'danger' },
          ]}
        />
      </header>

      {open && (
        /* No padding on this wrapper — the table used to sit inset inside a
           p-lg box, which left its own borders short of the card's corners and
           added 16px above it that the header's own border-b already supplied
           as separation. The table now runs edge to edge under that border;
           only the empty message and the Add Activity row keep p-lg, since
           they are text/controls rather than a bordered surface of their own. */
        <div className="border-t border-border-default">
          {activities.length === 0 ? (
            <p className="p-lg text-sm text-text-muted">No activities yet, add who will do this work.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 900 }}>
                <caption className="sr-only">Activities in {wp.title}, with budget health each</caption>
                <thead>
                  {/* A tinted row, not just the border below it — the border
                      alone read as one more inter-row line rather than a
                      boundary between titles and data. */}
                  <tr className="border-b border-border-default bg-neutral-50">
                    {['Activity', 'Responsible', 'Actual / Budget', 'Remaining', 'Used', 'Status', 'Tasks', 'Actions'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap px-lg py-base text-xs font-semibold text-text-secondary"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => {
                    const ah = healthOf(a.budgetHours, a.actualHours, wp.status === 'complete')
                    const over = ah.remaining < 0
                    return (
                    /* py-lg, not py-base: this row carries a two-line Used cell,
                       a badge and a chip row at once, and the old py-sm (8px)
                       left almost no air around any of them — the same
                       congestion `px-sm` produced sideways. */
                    <tr key={a.id} className="border-b border-border-default last:border-b-0">
                      <td className="whitespace-nowrap px-lg py-lg text-sm text-text-primary">{activityName(activities_, a.activityId)}</td>
                      <td className="px-lg py-lg"><PersonCell name={a.responsible} /></td>
                      {/* Spent against budgeted, side by side: the two numbers
                          a reader compares, in one glance rather than two. */}
                      <td className="whitespace-nowrap px-lg py-lg text-sm text-text-primary">
                        {ah.budget > 0 ? `${formatHours(ah.actual)} / ${formatHours(ah.budget)}` : `${formatHours(ah.actual)} / no budget`}
                      </td>
                      <td className={`whitespace-nowrap px-lg py-lg text-sm ${over ? 'font-semibold text-danger' : 'text-text-primary'}`}>
                        {ah.budget > 0 ? `${over ? '−' : ''}${formatHours(Math.abs(ah.remaining))}` : '—'}
                      </td>
                      <td className="whitespace-nowrap px-lg py-lg">
                        <span className="block text-sm text-text-primary">{formatPct(ah.progressPct)}</span>
                        <span className="mt-xxss block" style={{ width: 44 }}>
                          <ProgressMeter health={ah} size="sm" ariaLabel={`${activityName(activities_, a.activityId)} budget`} />
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-lg py-lg">
                        <Badge tone={HEALTH_TONE[ah.state]}>{HEALTH_LABEL[ah.state]}</Badge>
                      </td>
                      <td className="px-lg py-lg" style={{ maxWidth: 220 }}>
                        <ChipOverflow items={tasksForActivity(catalog, a.activityId, true).map((t) => t.name)} label="tasks" onShowAll={() => onViewActivity(a)} />
                      </td>
                      <td className="px-lg py-lg">
                        <ActionsMenu
                          ariaLabel={`Actions for activity ${activityName(activities_, a.activityId)}`}
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

          {/* pt-sm, not pt-lg: the last row already carries py-lg of its own
              padding below its text, and with no border between the table and
              this button to anchor the gap, that padding stacked with a second
              p-lg read as nearly double the space anywhere else in the card. */}
          <div className="px-lg pb-lg pt-sm">
            <Button variant="tertiary" size="sm" leadingIcon={<Plus size={14} />} onClick={onAddActivity}>
              Add Activity
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
