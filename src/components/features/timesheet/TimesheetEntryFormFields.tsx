import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { ProjectListRow } from '@/types/project'
import type { WorkPackage } from '@/types/workPackage'
import type { CatalogActivity } from '@/lib/activityCatalog'
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
  activityOptions: CatalogActivity[]
  taskOptions: string[]
  deliverableOptions: DeliverableRevision[]
}

/** The Add/Edit form body — split out of TimesheetEntryDrawer to keep that
    file under ~200 lines (CLAUDE.md rule). View mode never renders this. */
export function TimesheetEntryFormFields({
  values, errors, hasErrors, setField, setProject, setWorkPackage, setActivity,
  employeeMode, employeeOptions, projects, workPackageOptions, activityOptions, taskOptions, deliverableOptions,
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
            <Select
              id="employeeName" value={values.employeeName} error={!!errors.employeeName}
              placeholder="Select an employee..." onChange={(e) => setField('employeeName', e.target.value)}
            >
              {employeeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
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
        <FormField
          label="Task" htmlFor="task"
          help={values.activityId && taskOptions.length === 0 ? 'No tasks associated with this activity.' : undefined}
        >
          <Select
            id="task" value={values.task} disabled={!values.activityId || taskOptions.length === 0}
            placeholder="Select a task..." onChange={(e) => setField('task', e.target.value)}
          >
            {taskOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FormField>
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
