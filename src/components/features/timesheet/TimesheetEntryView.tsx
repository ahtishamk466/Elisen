import type { ProjectListRow } from '@/types/project'
import type { WorkPackage } from '@/types/workPackage'
import type { DeliverableRevision } from '@/types/tcca'
import { useCatalogStore } from '@/stores/catalogStore'
import { DetailCard as Card, DetailField as Field } from '@/components/patterns/DetailView'
import type { TimesheetEntryValues } from './useTimesheetEntryForm'
import { formatDate } from '@/lib/formatDate'

export interface TimesheetEntryViewProps {
  values: TimesheetEntryValues
  projects: ProjectListRow[]
  workPackages: WorkPackage[]
  deliverables: DeliverableRevision[]
}

/** Read-only detail layout for View mode — two cards (data, hours), labels
    and values only, no form controls. Editing happens through the Edit action. */
export function TimesheetEntryView({ values, projects, workPackages, deliverables }: TimesheetEntryViewProps) {
  const activities = useCatalogStore((s) => s.activities)
  const project = projects.find((p) => p.id === values.projectId)
  const workPackage = workPackages.find((w) => w.id === values.workPackageId)
  const activity = activities.find((a) => a.id === values.activityId)
  const deliverable = deliverables.find((d) => d.id === values.deliverableRevisionId)

  return (
    <div className="grid gap-lg">
      <Card title="Entry">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <Field label="Employee">{values.employeeName}</Field>
          <Field label="Project">{project ? `${project.number}-${project.subNumber}: ${project.title}` : '—'}</Field>
          <Field label="Work Package">{workPackage?.title}</Field>
          <Field label="Activity">{activity?.name}</Field>
          <Field label="Task">{values.task}</Field>
          <Field label="Deliverable">{deliverable ? `${deliverable.number}: ${deliverable.title}` : '—'}</Field>
        </div>
        {/* Full width of the card, not another cell in the stat grid above —
            comment text runs longer than a model number or a date. */}
        <div className="mt-lg">
          <Field label="Comment">{values.comment}</Field>
        </div>
      </Card>

      <Card title="Hours">
        <div className="grid grid-cols-2 gap-lg tablet:grid-cols-3">
          <Field label="Working Date">{formatDate(values.workingDate)}</Field>
          <Field label="Hours">{values.hoursRegular}</Field>
          <Field label="Hours Overtime">{values.hoursOvertime || '0'}</Field>
          <Field label="Bank Regular Hours">{values.bankHoursRegular || '0'}</Field>
        </div>
      </Card>
    </div>
  )
}
