import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { projectLabel } from './useProjectLabel'
import type { ProjectListRow } from '@/types/project'

export interface ProposalEditDrawerProps {
  open: boolean
  row: ProjectListRow
  onClose: () => void
  onSave: (patch: Pick<ProjectListRow, 'proposalSubmitted' | 'proposalSubmittedDate' | 'proposalAccepted' | 'proposalAcceptedDate'>) => void
}

/** Focused edit for just the Proposal card — the shared multi-step drawer
    used to open with Dates/Aircraft/Notes mixed in too. */
export function ProposalEditDrawer({ open, row, onClose, onSave }: ProposalEditDrawerProps) {
  const [submitted, setSubmitted] = useState(row.proposalSubmitted)
  const [submittedDate, setSubmittedDate] = useState(row.proposalSubmittedDate)
  const [accepted, setAccepted] = useState(row.proposalAccepted)
  const [acceptedDate, setAcceptedDate] = useState(row.proposalAcceptedDate)

  const handleSave = () => {
    onSave({ proposalSubmitted: submitted, proposalSubmittedDate: submittedDate, proposalAccepted: accepted, proposalAcceptedDate: acceptedDate })
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Edit Proposal “${projectLabel(row)}”`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      <FormSection title="Proposal" subtitle="Whether a proposal has been submitted and accepted.">
        <FormField label="Proposal Submitted" htmlFor="proposalSubmitted">
          <Select id="proposalSubmitted" value={submitted} onChange={(e) => setSubmitted(e.target.value as 'yes' | 'no')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </FormField>
        <FormField label="Submitted Date" htmlFor="proposalSubmittedDate">
          <Input id="proposalSubmittedDate" type="date" value={submittedDate} disabled={submitted !== 'yes'} onChange={(e) => setSubmittedDate(e.target.value)} />
        </FormField>
        <FormField label="Proposal Accepted" htmlFor="proposalAccepted">
          <Select id="proposalAccepted" value={accepted} onChange={(e) => setAccepted(e.target.value as 'yes' | 'no')}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </FormField>
        <FormField label="Accepted Date" htmlFor="proposalAcceptedDate">
          <Input id="proposalAcceptedDate" type="date" value={acceptedDate} disabled={accepted !== 'yes'} onChange={(e) => setAcceptedDate(e.target.value)} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
