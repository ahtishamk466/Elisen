import type { ReactNode } from 'react'
import type { ProjectListRow } from '@/types/project'
import type { WorkPackage } from '@/types/workPackage'
import type { DeliverableRevision } from '@/types/tcca'
import { ACTIVITY_CATALOG } from '@/lib/activityCatalog'
import type { TimesheetEntryValues } from './useTimesheetEntryForm'

/** Matches ProjectDetailPage's Card/Field pattern — the shared "View" look
    used everywhere a read-only detail card appears. */
function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-sm border border-border-default bg-neutral-25 p-lg">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <div className="mt-lg">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-xxss text-sm text-text-primary">{children || '—'}</p>
    </div>
  )
}

export interface TimesheetEntryViewProps {
  values: TimesheetEntryValues
  projects: ProjectListRow[]
  workPackages: WorkPackage[]
  deliverables: DeliverableRevision[]
}

/** Read-only detail layout for View mode — two cards (data, hours), labels
    and values only, no form controls. Editing happens through the Edit action. */
export function TimesheetEntryView({ values, projects, workPackages, deliverables }: TimesheetEntryViewProps) {
  const project = projects.find((p) => p.id === values.projectId)
  const workPackage = workPackages.find((w) => w.id === values.workPackageId)
  const activity = ACTIVITY_CATALOG.find((a) => a.id === values.activityId)
  const deliverable = deliverables.find((d) => d.id === values.deliverableRevisionId)

  return (
    <div className="grid gap-lg">
      <Card title="Entry">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <Field label="Employee">{values.employeeName}</Field>
          <Field label="Project">{project ? `${project.number}-${project.subNumber} — ${project.title}` : '—'}</Field>
          <Field label="Work Package">{workPackage?.title}</Field>
          <Field label="Activity">{activity?.name}</Field>
          <Field label="Task">{values.task}</Field>
          <Field label="Deliverable">{deliverable ? `${deliverable.number} — ${deliverable.title}` : '—'}</Field>
          <Field label="Comment">{values.comment}</Field>
        </div>
      </Card>

      <Card title="Hours">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <Field label="Working Date">{values.workingDate}</Field>
          <Field label="Hours">{values.hoursRegular}</Field>
          <Field label="Hours Overtime">{values.hoursOvertime || '0'}</Field>
          <Field label="Bank Regular Hours">{values.bankHoursRegular || '0'}</Field>
        </div>
      </Card>
    </div>
  )
}
