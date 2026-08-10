import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { projectLabel } from './useProjectLabel'
import type { ProjectListRow } from '@/types/project'

export interface NotesEditDrawerProps {
  open: boolean
  row: ProjectListRow
  onClose: () => void
  onSave: (patch: Pick<ProjectListRow, 'nextAction' | 'comments'>) => void
}

/** Focused edit for just the Notes card. */
export function NotesEditDrawer({ open, row, onClose, onSave }: NotesEditDrawerProps) {
  const [nextAction, setNextAction] = useState(row.nextAction)
  const [comments, setComments] = useState(row.comments)

  const handleSave = () => {
    onSave({ nextAction, comments })
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Edit Notes “${projectLabel(row)}”`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      <FormSection title="Notes" subtitle="What the next person working on this project should know.">
        <FormField label="Next Action" htmlFor="nextAction">
          <Textarea id="nextAction" value={nextAction} placeholder="Write here..." onChange={(e) => setNextAction(e.target.value)} />
        </FormField>
        <FormField label="Comments" htmlFor="comments">
          <Textarea id="comments" value={comments} placeholder="Write here..." onChange={(e) => setComments(e.target.value)} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
