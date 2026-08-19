import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PersonSelect } from '@/components/ui/PersonSelect'
import { Textarea } from '@/components/ui/Textarea'
import type { ProjectListRow } from '@/types/project'
import type { WorkPackage } from '@/types/workPackage'
import type { Activity, Task } from '@/types/catalog'
import type { DeliverableRevision } from '@/types/tcca'
import type { Errors, TimesheetEntryValues } from './useTimesheetEntryForm'

export interface TimesheetEntryFormFieldsProps {
  values: TimesheetEntryValues
  errors: Errors
  hasErrors: boolean
  setField: <K extends keyof TimesheetEntryValues>(key: K, value: TimesheetEntryValues[K]) => void
  setProject: (projectId: string) => void
  setWorkPackage: (workPackageId: string) => void
  setActivity: (activityId: string) => void
  employeeMode: 'fixed' | 'selectable'
  employeeOptions: string[]
  projects: ProjectListRow[]
  workPackageOptions: WorkPackage[]
  activityOptions: Activity[]
  taskOptions: Task[]
  /** The chosen activity, which decides whether Task is shown at all. */
  activity?: Activity
  deliverableOptions: DeliverableRevision[]
}

/** The Add/Edit form body — split out of TimesheetEntryDrawer to keep that
    file under ~200 lines (CLAUDE.md rule). View mode never renders this. */
export function TimesheetEntryFormFields({
  values, errors, hasErrors, setField, setProject, setWorkPackage, setActivity,
  employeeMode, employeeOptions, projects, workPackageOptions, activityOptions, taskOptions, deliverableOptions, activity,
}: TimesheetEntryFormFieldsProps) {
  return (
    <>
      {hasErrors && (
        <Alert title="Please complete the required fields">
          Fill in all fields marked with an asterisk (*) before saving.
        </Alert>
      )}

      <FormSection title="Entry" subtitle="Who did the work, and against which project.">
        <FormField label="Employee" htmlFor="employeeName" required={employeeMode === 'selectable'} error={errors.employeeName}>
          {employeeMode === 'fixed' ? (
            <Input id="employeeName" value={values.employeeName} disabled />
          ) : (
            <PersonSelect
              id="employeeName" value={values.employeeName} error={!!errors.employeeName}
              placeholder="Select an employee..." people={employeeOptions}
              onChange={(v) => setField('employeeName', v)}
            />
          )}
        </FormField>
        <FormField label="Project Number" htmlFor="projectId" required error={errors.projectId}>
          <Select
            id="projectId" value={values.projectId} error={!!errors.projectId}
            placeholder="Select a project..." onChange={(e) => setProject(e.target.value)}
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.number}-{p.subNumber} {p.title}</option>)}
          </Select>
        </FormField>
        <FormField
          label="Work Package" htmlFor="workPackageId" required error={errors.workPackageId}
          help={!values.projectId ? 'Select a project first.' : workPackageOptions.length === 0 ? 'This project has no work packages yet.' : undefined}
        >
          <Select
            id="workPackageId" value={values.workPackageId} error={!!errors.workPackageId} disabled={!values.projectId}
            placeholder="Select a work package..." onChange={(e) => setWorkPackage(e.target.value)}
          >
            {workPackageOptions.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
          </Select>
        </FormField>
      </FormSection>

      <FormSection title="Work performed" subtitle="What kind of work, and against which deliverable.">
        <FormField
          label="Activity" htmlFor="activityId" required error={errors.activityId}
          help={values.workPackageId && activityOptions.length === 0 ? 'No activities assigned to this work package yet.' : undefined}
        >
          <Select
            id="activityId" value={values.activityId} error={!!errors.activityId} disabled={!values.workPackageId}
            placeholder="Select an activity..." onChange={(e) => setActivity(e.target.value)}
          >
            {activityOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </FormField>
        {/* The requirement doc's "hide Task when activity does not require one":
            the field is gone rather than sitting there disabled and empty. It
            still shows before an activity is picked, so the form does not jump
            around as you fill it in. */}
        {(!values.activityId || activity?.taskRequired) && (
          <FormField
            label="Task" htmlFor="task" required={!!activity?.taskRequired} error={errors.task}
            help={values.activityId && taskOptions.length === 0
              ? 'This activity requires a task but has none linked. An administrator can link one in Reference Data → Activities & Tasks.'
              : undefined}
          >
            <Select
              id="task" value={values.task} error={!!errors.task}
              disabled={!values.activityId || taskOptions.length === 0}
              placeholder="Select a task..." onChange={(e) => setField('task', e.target.value)}
            >
              {taskOptions.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </Select>
          </FormField>
        )}
        <FormField
          label="Deliverable" htmlFor="deliverableRevisionId"
          help={values.projectId && deliverableOptions.length === 0 ? 'No deliverables tracked on this project yet.' : undefined}
        >
          <Select
            id="deliverableRevisionId" value={values.deliverableRevisionId} disabled={!values.projectId || deliverableOptions.length === 0}
            placeholder="Select a deliverable..." onChange={(e) => setField('deliverableRevisionId', e.target.value)}
          >
            {deliverableOptions.map((d) => <option key={d.id} value={d.id}>{d.number} — {d.title}</option>)}
          </Select>
        </FormField>
      </FormSection>

      <FormSection title="Hours" subtitle="Working date and hours logged.">
        <FormField label="Working Date" htmlFor="workingDate" required error={errors.workingDate}>
          <Input id="workingDate" type="date" value={values.workingDate} error={!!errors.workingDate} onChange={(e) => setField('workingDate', e.target.value)} />
        </FormField>
        <FormField label="Hours" htmlFor="hoursRegular" required error={errors.hoursRegular}>
          <Input id="hoursRegular" inputMode="decimal" placeholder="0" value={values.hoursRegular} error={!!errors.hoursRegular} onChange={(e) => setField('hoursRegular', e.target.value)} />
        </FormField>
        <FormField label="Hours Overtime" htmlFor="hoursOvertime" error={errors.hoursOvertime}>
          <Input id="hoursOvertime" inputMode="decimal" placeholder="0" value={values.hoursOvertime} error={!!errors.hoursOvertime} onChange={(e) => setField('hoursOvertime', e.target.value)} />
        </FormField>
        <FormField label="Bank Regular Hours" htmlFor="bankHoursRegular" error={errors.bankHoursRegular}>
          <Input id="bankHoursRegular" inputMode="decimal" placeholder="0" value={values.bankHoursRegular} error={!!errors.bankHoursRegular} onChange={(e) => setField('bankHoursRegular', e.target.value)} />
        </FormField>
        <FormField label="Comment" htmlFor="comment">
          <Textarea id="comment" value={values.comment} placeholder="Enter comment..." onChange={(e) => setField('comment', e.target.value)} />
        </FormField>
      </FormSection>
    </>
  )
}
