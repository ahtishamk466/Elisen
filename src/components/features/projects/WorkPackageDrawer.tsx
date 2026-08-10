import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useProjectLabel } from './useProjectLabel'
import type { WorkPackage, WorkPackageStatus } from '@/types/workPackage'

export interface WorkPackageDrawerProps {
  mode: 'create' | 'edit'
  projectId: string
  initial?: WorkPackage
  onClose: () => void
  onSubmit: (wp: WorkPackage) => void
}

export function WorkPackageDrawer({ mode, projectId, initial, onClose, onSubmit }: WorkPackageDrawerProps) {
  const isEdit = mode === 'edit'
  const label = useProjectLabel(projectId)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<WorkPackageStatus>(initial?.status ?? 'not-started')
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const requestClose = () => (dirty ? setConfirmClose(true) : close())
  const close = () => { setConfirmClose(false); onClose() }

  const submit = () => {
    if (!title.trim()) {
      setError('Work package title is required.')
      return
    }
    onSubmit({
      id: initial?.id ?? crypto.randomUUID(),
      projectId,
      title: title.trim(),
      description: description.trim(),
      status,
    })
    close()
  }

  return (
    <>
      <Drawer
        open
        onClose={requestClose}
        title={isEdit ? `Edit Work Package “${initial?.title}” — ${label}` : `Add Work Package “${label}”`}
        footer={
          <>
            <div className="flex gap-sm">
              <Button variant="secondary" onClick={requestClose}>Cancel</Button>
              <Button onClick={submit}>{isEdit ? 'Save Changes' : 'Add Work Package'}</Button>
            </div>
          </>
        }
      >
        <FormSection
          title="Work Package"
          subtitle="A scope of work inside this project. Free text — packages differ on every aircraft, so there are no templates."
        >
          <FormField label="Title" htmlFor="wp-title" required error={error}
            help={'e.g. "Add missing USB plug", "Seat installation", "Certification Plan"'}>
            <Input id="wp-title" value={title} error={!!error}
              onChange={(e) => { setTitle(e.target.value); setError(''); setDirty(true) }} />
          </FormField>
          <FormField label="Description" htmlFor="wp-desc">
            <Textarea id="wp-desc" value={description} placeholder="What this package covers..."
              onChange={(e) => { setDescription(e.target.value); setDirty(true) }} />
          </FormField>
          {isEdit && (
            <FormField label="Status" htmlFor="wp-status">
              <Select id="wp-status" value={status}
                onChange={(e) => { setStatus(e.target.value as WorkPackageStatus); setDirty(true) }}>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
              </Select>
            </FormField>
          )}
        </FormSection>
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
