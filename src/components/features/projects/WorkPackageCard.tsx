import { useState } from 'react'
import { ChevronDown, Pencil, Trash2, CheckCircle2, RotateCcw, Plus } from 'lucide-react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { activityName, ACTIVITY_TASKS } from '@/lib/activityCatalog'
import type { WorkPackage, WorkPackageActivity, WorkPackageStatus } from '@/types/workPackage'

const STATUS_LABEL: Record<WorkPackageStatus, string> = {
  'not-started': 'Not Started', 'in-progress': 'In Progress', complete: 'Complete',
}
const STATUS_TONE: Record<WorkPackageStatus, BadgeTone> = {
  'not-started': 'neutral', 'in-progress': 'warning', complete: 'success',
}

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
}

export function WorkPackageCard({
  wp, activities, defaultOpen = false,
  onEdit, onDelete, onToggleComplete, onAddActivity, onEditActivity, onRemoveActivity,
}: WorkPackageCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const budget = activities.reduce((s, a) => s + a.budgetHours, 0)
  const actual = activities.reduce((s, a) => s + a.actualHours, 0)

  return (
    <section className="overflow-hidden rounded-sm border border-border-default bg-neutral-25">
      <header className="flex flex-wrap items-center gap-sm bg-neutral-50 px-lg py-base">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
        >
          <ChevronDown size={16} className={`shrink-0 text-text-muted transition-transform duration-fast ${open ? '' : '-rotate-90'}`} aria-hidden />
          <span className="truncate text-sm font-semibold text-text-primary">{wp.title}</span>
          <Badge tone={STATUS_TONE[wp.status]}>{STATUS_LABEL[wp.status]}</Badge>
        </button>
        <span className={`whitespace-nowrap text-sm ${actual > budget && budget > 0 ? 'text-danger' : 'text-text-secondary'}`}>
          {actual} / {budget}h
        </span>
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
        <div className="grid gap-base p-lg">
          {wp.description && <p className="text-sm text-text-secondary">{wp.description}</p>}

          {activities.length === 0 ? (
            <p className="text-sm text-text-muted">No activities yet — add who will do this work.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 640 }}>
                <caption className="sr-only">Activities in {wp.title}</caption>
                <thead>
                  <tr className="border-b border-border-default">
                    {['Activity', 'Responsible', 'Budget (h)', 'Actual (h)', 'Tasks', 'Actions'].map((h) => (
                      <th key={h} scope="col" className="whitespace-nowrap px-sm py-sm text-xs font-semibold text-text-secondary">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id} className="border-b border-border-default last:border-b-0">
                      <td className="whitespace-nowrap px-sm py-sm text-sm text-text-primary">{activityName(a.activityId)}</td>
                      <td className="whitespace-nowrap px-sm py-sm text-sm text-text-primary">{a.responsible}</td>
                      <td className="px-sm py-sm text-sm text-text-primary">{a.budgetHours}</td>
                      <td className={`px-sm py-sm text-sm ${a.actualHours > a.budgetHours && a.budgetHours > 0 ? 'text-danger' : 'text-text-primary'}`}>
                        {a.actualHours}
                        {a.actualHours > a.budgetHours && a.budgetHours > 0 && <span className="ml-xs text-xs">over</span>}
                      </td>
                      <td className="px-sm py-sm">
                        <span className="flex max-w-64 flex-wrap gap-xs">
                          {(ACTIVITY_TASKS[a.activityId] ?? []).length === 0 ? (
                            <span className="text-sm text-text-muted">—</span>
                          ) : (
                            ACTIVITY_TASKS[a.activityId].map((t) => (
                              <span key={t} className="whitespace-nowrap rounded-sm bg-neutral-100 px-sm py-xxss text-xs text-text-secondary">{t}</span>
                            ))
                          )}
                        </span>
                      </td>
                      <td className="px-sm py-sm">
                        <ActionsMenu
                          ariaLabel={`Actions for activity ${activityName(a.activityId)}`}
                          items={[
                            { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => onEditActivity(a) },
                            { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => onRemoveActivity(a), tone: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <Button variant="tertiary" size="sm" leadingIcon={<Plus size={14} />} onClick={onAddActivity}>
              Add Activity
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
