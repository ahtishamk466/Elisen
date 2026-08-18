import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { AccordionSection } from '@/components/patterns/AccordionSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { getNextTccaNumber } from '@/lib/tccaFixtures'
import { TCCA_CHECKLIST } from '@/lib/tccaChecklist'
import { TCCA_PROJECT_LEVEL_LABEL, TCCA_PROJECT_STATUS_LABEL } from '@/lib/tccaDisplay'
import type { TccaProject, TccaStatus, TccaProjectStatus, TccaProjectLevel } from '@/types/tcca'

export interface TccaProjectDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  initial?: TccaProject
  onClose: () => void
  onSubmit: (t: TccaProject) => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function TccaProjectDrawer({ open, mode, initial, onClose, onSubmit }: TccaProjectDrawerProps) {
  const projects = useProjectsStore((s) => s.rows)
  const existing = useTccaStore((s) => s.tccaProjects)
  const suggested = getNextTccaNumber(existing)
  const isEdit = mode === 'edit'

  const [number, setNumber] = useState(initial?.number ?? suggested)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<TccaStatus>(initial?.status ?? 'in-progress')
  const [projectId, setProjectId] = useState(initial?.projectIds[0] ?? '')
  const [priority, setPriority] = useState(initial?.priority ?? '3.0')
  const [certificate, setCertificate] = useState(initial?.certificate ?? '')
  const [issueNumber, setIssueNumber] = useState(initial?.issueNumber ?? '')
  const [issued, setIssued] = useState(initial?.issued ?? false)
  const [projectStatus, setProjectStatus] = useState<TccaProjectStatus>(initial?.projectStatus ?? 'not-started')
  const [projectLevel, setProjectLevel] = useState<TccaProjectLevel>(initial?.projectLevel ?? 'not-assigned')
  const [openedDate, setOpenedDate] = useState(initial?.openedDate ?? today())
  const [closedDate, setClosedDate] = useState(initial?.closedDate ?? '')
  const [expectedFaiDate, setExpectedFaiDate] = useState(initial?.expectedFaiDate ?? '')
  const [expectedTestingDate, setExpectedTestingDate] = useState(initial?.expectedTestingDate ?? '')
  const [expectedApprovalDate, setExpectedApprovalDate] = useState(initial?.expectedApprovalDate ?? '')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(initial?.expectedDeliveryDate ?? '')
  const [nextAction, setNextAction] = useState(initial?.nextAction ?? '')
  const [comments, setComments] = useState(initial?.comments ?? '')
  const [applicable, setApplicable] = useState<string[]>(initial ? Object.keys(initial.checklist) : [])
  const [errors, setErrors] = useState<{ number?: string; description?: string; openedDate?: string }>({})
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const touch = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setDirty(true) }
  const toggleItem = (id: string) =>
    touch(setApplicable)(applicable.includes(id) ? applicable.filter((i) => i !== id) : [...applicable, id])

  const requestClose = () => (dirty ? setConfirmClose(true) : close())
  const close = () => { setConfirmClose(false); onClose() }

  const submit = () => {
    const e: typeof errors = {}
    if (!number.trim()) e.number = 'TCCA project number is required.'
    else if (!isEdit && existing.some((t) => t.number === number.trim()))
      e.number = `${number.trim()} is already used. Suggested: ${suggested}.`
    if (!description.trim()) e.description = 'Transport Canada needs a good description of the change.'
    if (!openedDate) e.openedDate = 'Opened date is required.'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    const restIds = (initial?.projectIds ?? []).slice(1)
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      number: number.trim(),
      description: description.trim(),
      priority: priority.trim(),
      certificate: certificate.trim(),
      issueNumber: issueNumber.trim(),
      issued,
      status,
      projectStatus,
      projectLevel,
      openedDate,
      closedDate,
      expectedFaiDate,
      expectedTestingDate,
      expectedApprovalDate,
      expectedDeliveryDate,
      nextAction,
      comments,
      projectIds: projectId ? [projectId, ...restIds.filter((r) => r !== projectId)] : restIds,
      checklist: isEdit
        ? initial!.checklist
        : Object.fromEntries(applicable.map((id) => [id, ''])),
    })
    close()
  }

  const hasErrors = Object.values(errors).some(Boolean)

  return (
    <>
      <Drawer
        open={open}
        onClose={requestClose}
        title={isEdit ? `Edit TCCA Project ${initial?.number}` : 'Add TCCA Project'}
        footer={
          <>
            <div className="flex gap-sm">
              <Button variant="secondary" onClick={requestClose}>Cancel</Button>
              <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Create TCCA Project'}</Button>
            </div>
          </>
        }
      >
        {hasErrors && (
          <Alert title="Please complete the required fields">
            Fill in all fields marked with an asterisk (*) before continuing.
          </Alert>
        )}

        <FormSection title="TCCA Project" subtitle="Tracks Elisen's interactions with Transport Canada toward one certificate.">
          <FormField label="TCCA Project Number" htmlFor="tcca-number" required error={errors.number} help={`Suggested: ${suggested}`}>
            <Input id="tcca-number" value={number} error={!!errors.number} onChange={(e) => touch(setNumber)(e.target.value)} />
          </FormField>
          <FormField label="Description" htmlFor="tcca-desc" required error={errors.description}
            help="What Elisen intends to do and certify on this change.">
            <Textarea id="tcca-desc" value={description} error={!!errors.description} onChange={(e) => touch(setDescription)(e.target.value)} />
          </FormField>
          <FormField label="Priority" htmlFor="tcca-priority" help="1.0 is highest, 9.9 lowest.">
            <Input id="tcca-priority" value={priority} className="w-28" placeholder="e.g. 3.0"
              onChange={(e) => touch(setPriority)(e.target.value)} />
          </FormField>
          <FormField label="Certificate" htmlFor="tcca-cert" help="The certificate this project is working toward, once known.">
            <Input id="tcca-cert" value={certificate} placeholder="e.g. STC SA25-200"
              onChange={(e) => touch(setCertificate)(e.target.value)} />
          </FormField>
          <FormField label="Issue Number" htmlFor="tcca-issue">
            <Input id="tcca-issue" value={issueNumber} className="w-28" onChange={(e) => touch(setIssueNumber)(e.target.value)} />
          </FormField>
          <FormField label="Issued" htmlFor="tcca-issued">
            <Checkbox id="tcca-issued" checked={issued} onChange={(e) => touch(setIssued)(e.target.checked)}
              label="The certificate has been granted" />
          </FormField>
        </FormSection>

        <FormSection title="Status & Dates" subtitle="Where the project stands with Transport Canada, and when each stage is expected.">
          <FormField label="Project Status" htmlFor="tcca-pstatus" required help="Where the work stands on Elisen's side.">
            <Select id="tcca-pstatus" value={projectStatus} onChange={(e) => touch(setProjectStatus)(e.target.value as TccaProjectStatus)}>
              {Object.entries(TCCA_PROJECT_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </FormField>
          <FormField label="Status" htmlFor="tcca-status" required help="Where it stands with Transport Canada.">
            <Select id="tcca-status" value={status} onChange={(e) => touch(setStatus)(e.target.value as TccaStatus)}>
              <option value="in-progress">In Progress</option>
              <option value="approved">Approved</option>
              <option value="closed">Closed</option>
            </Select>
          </FormField>
          <FormField label="Project Level" htmlFor="tcca-level" required help="How much Transport Canada involvement the change needs.">
            <Select id="tcca-level" value={projectLevel} onChange={(e) => touch(setProjectLevel)(e.target.value as TccaProjectLevel)}>
              {Object.entries(TCCA_PROJECT_LEVEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </FormField>
          <FormField label="Start Date" htmlFor="tcca-opened" required error={errors.openedDate}>
            <Input id="tcca-opened" type="date" value={openedDate} error={!!errors.openedDate} onChange={(e) => touch(setOpenedDate)(e.target.value)} />
          </FormField>
          <FormField label="Closed Date" htmlFor="tcca-closed">
            <Input id="tcca-closed" type="date" value={closedDate} onChange={(e) => touch(setClosedDate)(e.target.value)} />
          </FormField>
          <FormField label="Expected FAI Date" htmlFor="tcca-fai">
            <Input id="tcca-fai" type="date" value={expectedFaiDate} onChange={(e) => touch(setExpectedFaiDate)(e.target.value)} />
          </FormField>
          <FormField label="Expected Testing Date" htmlFor="tcca-testing">
            <Input id="tcca-testing" type="date" value={expectedTestingDate} onChange={(e) => touch(setExpectedTestingDate)(e.target.value)} />
          </FormField>
          <FormField label="Expected Approval Date" htmlFor="tcca-approval">
            <Input id="tcca-approval" type="date" value={expectedApprovalDate} onChange={(e) => touch(setExpectedApprovalDate)(e.target.value)} />
          </FormField>
          <FormField label="Expected Delivery Date" htmlFor="tcca-delivery">
            <Input id="tcca-delivery" type="date" value={expectedDeliveryDate} onChange={(e) => touch(setExpectedDeliveryDate)(e.target.value)} />
          </FormField>
        </FormSection>

        <FormSection title="Link & Notes" subtitle="The Elisen project this relates to. More projects can be linked later from either side.">
          <FormField label="Elisen Project" htmlFor="tcca-project"
            help="Almost always linked to a project. Leave unlinked only for baseline / DAO organizational work.">
            <SearchableSelect
              id="tcca-project" value={projectId} onChange={touch(setProjectId)}
              options={projects.map((p) => ({ value: p.id, label: `${p.number}-${p.subNumber}`, hint: p.title }))}
              placeholder="No linked project (baseline / DAO)"
              emptyLabel="No projects exist yet."
              searchThreshold={0}
            />
          </FormField>
          <FormField label="Next Action" htmlFor="tcca-next">
            <Textarea id="tcca-next" value={nextAction} placeholder="Write here..." onChange={(e) => touch(setNextAction)(e.target.value)} />
          </FormField>
          <FormField label="Comment" htmlFor="tcca-comments">
            <Textarea id="tcca-comments" value={comments} placeholder="Write here..." onChange={(e) => touch(setComments)(e.target.value)} />
          </FormField>
        </FormSection>

        {!isEdit && (
          <>
            <Alert tone="info" title="Tick only what applies to this certificate">
              Completion dates are recorded later, on the Checklist tab, as each task is finished.
            </Alert>
            {TCCA_CHECKLIST.map((phase) => {
              const count = phase.items.filter((i) => applicable.includes(i.id)).length
              return (
                <AccordionSection key={phase.id} title={phase.title} meta={`${count} of ${phase.items.length} applicable`} defaultOpen={phase.id === 'application'}>
                  <fieldset>
                    <legend className="sr-only">{phase.title}</legend>
                    <div className="grid gap-base">
                      {phase.items.map((item) => (
                        <Checkbox key={item.id} label={item.label} checked={applicable.includes(item.id)} onChange={() => toggleItem(item.id)} />
                      ))}
                    </div>
                  </fieldset>
                </AccordionSection>
              )
            })}
          </>
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmClose}
        title="Discard these changes?"
        description="Your changes haven't been saved. Closing now will discard everything you've entered."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={close}
        onCancel={() => setConfirmClose(false)}
      />
    </>
  )
}
