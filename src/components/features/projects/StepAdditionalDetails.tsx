import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { StepProps } from './StepBasicInfo'

export function StepAdditionalDetails({ values, errors, setField }: StepProps) {
  return (
    <>
      <FormSection title="Status & Dates" subtitle="Where this project stands, and its key milestones.">
        <FormField label="Status" htmlFor="status">
          <Select id="status" value={values.status} placeholder="Select status..." onChange={(e) => setField('status', e.target.value)}>
            <option value="query">Query</option>
            <option value="quoted">Quoted</option>
            <option value="tentative">Tentative</option>
            <option value="active">Active</option>
            <option value="on-hold">On hold</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FormField>
        <FormField label="Project Opened Date" htmlFor="openedDate" required error={errors.openedDate}>
          <Input id="openedDate" type="date" value={values.openedDate} error={!!errors.openedDate} onChange={(e) => setField('openedDate', e.target.value)} />
        </FormField>
        <FormField label="Due Date" htmlFor="dueDate" error={errors.dueDate}>
          <Input id="dueDate" type="date" value={values.dueDate} error={!!errors.dueDate} onChange={(e) => setField('dueDate', e.target.value)} />
        </FormField>
        <FormField label="Aircraft Input Date" htmlFor="aircraftInputDate" help="When the aircraft arrives on site.">
          <Input id="aircraftInputDate" type="date" value={values.aircraftInputDate} onChange={(e) => setField('aircraftInputDate', e.target.value)} />
        </FormField>
        <FormField label="Closed Date" htmlFor="closedDate" error={errors.closedDate}>
          <Input id="closedDate" type="date" value={values.closedDate} error={!!errors.closedDate} onChange={(e) => setField('closedDate', e.target.value)} />
        </FormField>
      </FormSection>

      <FormSection title="Proposal" subtitle="Optional — fill in once a proposal is in motion.">
        <FormField label="Proposal Submitted" htmlFor="proposalSubmitted">
          <Select id="proposalSubmitted" value={values.proposalSubmitted} onChange={(e) => setField('proposalSubmitted', e.target.value)}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </FormField>
        <FormField label="Submitted Date" htmlFor="proposalSubmittedDate">
          <Input id="proposalSubmittedDate" type="date" value={values.proposalSubmittedDate} disabled={values.proposalSubmitted !== 'yes'} onChange={(e) => setField('proposalSubmittedDate', e.target.value)} />
        </FormField>
        <FormField label="Proposal Accepted" htmlFor="proposalAccepted">
          <Select id="proposalAccepted" value={values.proposalAccepted} onChange={(e) => setField('proposalAccepted', e.target.value)}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </Select>
        </FormField>
        <FormField label="Accepted Date" htmlFor="proposalAcceptedDate">
          <Input id="proposalAcceptedDate" type="date" value={values.proposalAcceptedDate} disabled={values.proposalAccepted !== 'yes'} onChange={(e) => setField('proposalAcceptedDate', e.target.value)} />
        </FormField>
      </FormSection>

      <FormSection title="Notes" subtitle="Anything the next person picking this up should know.">
        <FormField label="Next Action" htmlFor="nextAction">
          <Textarea id="nextAction" value={values.nextAction} placeholder="Write here..." onChange={(e) => setField('nextAction', e.target.value)} />
        </FormField>
        <FormField label="Comments" htmlFor="comments">
          <Textarea id="comments" value={values.comments} placeholder="Write here..." onChange={(e) => setField('comments', e.target.value)} />
        </FormField>
      </FormSection>
    </>
  )
}
