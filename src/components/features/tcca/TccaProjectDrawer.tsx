import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { AccordionSection } from '@/components/patterns/AccordionSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Alert } from '@/components/ui/Alert'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { getNextTccaNumber } from '@/lib/tccaFixtures'
import { TCCA_CHECKLIST } from '@/lib/tccaChecklist'
import type { TccaProject, TccaStatus } from '@/types/tcca'

export interface TccaProjectDrawerProps {
  open: boolean
  mode: 'create' | 'edit'
  /** Preselects and locks the Elisen project when opened from a project's TCCA tab. */
  lockedProjectId?: string
  initial?: TccaProject
  onClose: () => void
  onSubmit: (t: TccaProject) => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function TccaProjectDrawer({ open, mode, lockedProjectId, initial, onClose, onSubmit }: TccaProjectDrawerProps) {
  const projects = useProjectsStore((s) => s.rows)
  const existing = useTccaStore((s) => s.tccaProjects)
  const suggested = getNextTccaNumber(existing)
  const isEdit = mode === 'edit'

  const [number, setNumber] = useState(initial?.number ?? suggested)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<TccaStatus>(initial?.status ?? 'in-progress')
  const [projectId, setProjectId] = useState(initial?.projectIds[0] ?? lockedProjectId ?? '')
  const [openedDate, setOpenedDate] = useState(initial?.openedDate ?? today())
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
      status,
      openedDate,
      closedDate: initial?.closedDate ?? '',
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
        title={isEdit ? `Edit TCCA project ${initial?.number}` : 'Add TCCA project'}
        footer={
          <>
            <span />
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
          {isEdit && (
            <FormField label="Status" htmlFor="tcca-status">
              <Select id="tcca-status" value={status} onChange={(e) => touch(setStatus)(e.target.value as TccaStatus)}>
                <option value="in-progress">In Progress</option>
                <option value="approved">Approved</option>
                <option value="closed">Closed</option>
              </Select>
            </FormField>
          )}
          <FormField label="Elisen Project" htmlFor="tcca-project"
            help="Almost always linked to a project. Leave unlinked only for baseline / DAO organizational work.">
            <Select id="tcca-project" value={projectId} disabled={!!lockedProjectId} onChange={(e) => touch(setProjectId)(e.target.value)}>
              <option value="">— No linked project (baseline / DAO)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.number}-{p.subNumber} — {p.title}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Opened Date" htmlFor="tcca-opened" required error={errors.openedDate}>
            <Input id="tcca-opened" type="date" value={openedDate} error={!!errors.openedDate} onChange={(e) => touch(setOpenedDate)(e.target.value)} />
          </FormField>
          <FormField label="Next Action" htmlFor="tcca-next">
            <Textarea id="tcca-next" value={nextAction} placeholder="Write here..." onChange={(e) => touch(setNextAction)(e.target.value)} />
          </FormField>
          <FormField label="Comments" htmlFor="tcca-comments">
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
