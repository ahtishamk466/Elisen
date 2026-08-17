import { useMemo, useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { useProjectsStore } from '@/stores/projectsStore'
import { useWorkPackagesStore } from '@/stores/workPackagesStore'
import { deliverableSummaries, useDocumentsStore } from '@/stores/documentsStore'
import { ACTIVITY_CATALOG, ACTIVITY_TASKS } from '@/lib/activityCatalog'
import { useTimesheetEntryForm, validate, type TimesheetEntryValues } from './useTimesheetEntryForm'
import { TimesheetEntryView } from './TimesheetEntryView'
import { TimesheetEntryFormFields } from './TimesheetEntryFormFields'

export interface TimesheetEntryDrawerProps {
  open: boolean
  onClose: () => void
  mode?: 'create' | 'edit' | 'view'
  initialValues?: Partial<TimesheetEntryValues>
  /** Self-service Timesheet locks Employee to the signed-in user; Hours
      Worked (admin) lets you pick who the entry is for. */
  employeeMode?: 'fixed' | 'selectable'
  currentEmployee: string
  employeeOptions?: string[]
  onSubmit?: (values: TimesheetEntryValues) => void
}

export function TimesheetEntryDrawer({
  open, onClose, mode = 'create', initialValues,
  employeeMode = 'fixed', currentEmployee, employeeOptions = [], onSubmit,
}: TimesheetEntryDrawerProps) {
  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const { values, errors, setErrors, dirty, setField, reset } = useTimesheetEntryForm(currentEmployee, initialValues)
  const [confirmClose, setConfirmClose] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const projects = useProjectsStore((s) => s.rows)
  const workPackages = useWorkPackagesStore((s) => s.workPackages)
  const wpActivities = useWorkPackagesStore((s) => s.activities)
  const documents = useDocumentsStore((s) => s.documents)
  const docRevisions = useDocumentsStore((s) => s.revisions)
  const deliverables = useMemo(() => deliverableSummaries(documents, docRevisions), [documents, docRevisions])

  const workPackageOptions = workPackages.filter((w) => w.projectId === values.projectId)
  const assignedActivityIds = wpActivities.filter((a) => a.workPackageId === values.workPackageId).map((a) => a.activityId)
  const activityOptions = ACTIVITY_CATALOG.filter((a) => assignedActivityIds.includes(a.id))
  const taskOptions = values.activityId ? (ACTIVITY_TASKS[values.activityId] ?? []) : []
  const deliverableOptions = deliverables.filter((d) => d.projectId === values.projectId)

  const hasErrors = Object.values(errors).some(Boolean)
  const requestClose = () => (dirty && !isView ? setConfirmClose(true) : handleClose())
  const handleClose = () => {
    reset()
    setConfirmClose(false)
    onClose()
  }

  const handleSubmit = async () => {
    const e = validate(values)
    setErrors(e)
    if (Object.keys(e).length > 0) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    setSubmitting(false)
    onSubmit?.(values)
    handleClose()
  }

  const setProject = (projectId: string) => {
    setField('projectId', projectId)
    setField('workPackageId', '')
    setField('activityId', '')
    setField('task', '')
    setField('deliverableRevisionId', '')
  }
  const setWorkPackage = (workPackageId: string) => {
    setField('workPackageId', workPackageId)
    setField('activityId', '')
    setField('task', '')
  }
  const setActivity = (activityId: string) => {
    setField('activityId', activityId)
    setField('task', '')
  }

  // Name the record being acted on — the project this entry is booked to,
  // plus who and when, so the user always knows what they're changing.
  const entryProject = projects.find((p) => p.id === values.projectId)
  const entryContext = [
    entryProject ? `${entryProject.number}-${entryProject.subNumber}: ${entryProject.title}` : '',
    values.employeeName,
    values.workingDate,
  ].filter(Boolean).join(' · ')
  const title = isView
    ? `Timesheet Entry${entryContext ? ` “${entryContext}”` : ''}`
    : isEdit
      ? `Edit Timesheet Entry${entryContext ? ` “${entryContext}”` : ''}`
      : `Add Timesheet Entry${employeeMode === 'fixed' ? `: ${currentEmployee}` : ''}`

  return (
    <>
      <Drawer
        open={open}
        onClose={requestClose}
        title={title}
        footer={
          isView ? (
            <>
              <Button variant="secondary" onClick={handleClose}>Close</Button>
            </>
          ) : (
            <>
              <div className="flex gap-sm">
                <Button variant="secondary" onClick={requestClose}>Cancel</Button>
                <Button onClick={handleSubmit} loading={submitting}>{isEdit ? 'Save Changes' : 'Create'}</Button>
              </div>
            </>
          )
        }
      >
        {isView ? (
          <TimesheetEntryView values={values} projects={projects} workPackages={workPackages} deliverables={deliverables} />
        ) : (
          <TimesheetEntryFormFields
            values={values} errors={errors} hasErrors={hasErrors} setField={setField}
            setProject={setProject} setWorkPackage={setWorkPackage} setActivity={setActivity}
            employeeMode={employeeMode} employeeOptions={employeeOptions} projects={projects}
            workPackageOptions={workPackageOptions} activityOptions={activityOptions}
            taskOptions={taskOptions} deliverableOptions={deliverableOptions}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmClose}
        title="Discard this entry?"
        description="Your changes haven't been saved. Closing now will discard everything you've entered."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={handleClose}
        onCancel={() => setConfirmClose(false)}
      />
    </>
  )
}
