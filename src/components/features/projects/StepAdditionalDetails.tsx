import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useLookupStore } from '@/stores/lookupStore'
import { useApprovalsStore } from '@/stores/approvalsStore'
import { useTccaStore } from '@/stores/tccaStore'
import { useDocumentsStore } from '@/stores/documentsStore'
import type { DocumentKind } from '@/types/documents'
import type { StepProps } from './StepBasicInfo'

export function StepAdditionalDetails({ values, errors, setField }: StepProps) {
  const aircraft = useLookupStore((s) => s.aircraft)
  const approvals = useApprovalsStore((s) => s.approvals)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const documents = useDocumentsStore((s) => s.documents)
  const revisions = useDocumentsStore((s) => s.revisions)

  /** One option per revision — a project links to a specific revision of a
      document, not to the document as a whole. */
  const revisionOptions = (kind: DocumentKind) =>
    revisions.flatMap((rev) => {
      const doc = documents.find((d) => d.id === rev.documentId)
      return doc && doc.kind === kind
        ? [{ value: rev.id, label: `${doc.number} · ${rev.rev}`, hint: doc.title }]
        : []
    })

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

      <FormSection title="Proposal" subtitle="Optional, fill in once a proposal is in motion.">
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

      {/* Everything here is chosen from a global list — the project links to
          records, it never creates them. Anything not known yet can be linked
          later from the project's own tabs, so nothing is required. */}
      <FormSection
        title="Linked Records"
        subtitle="Link records that already exist. All optional."
      >
        <FormField label="Aircraft Model Number" htmlFor="link-aircraft" help="From Reference Data. Serials set later.">
          <MultiSelect
            id="link-aircraft"
            value={values.aircraftIds}
            onChange={(v) => setField('aircraftIds', v)}
            placeholder="Select aircraft..."
            emptyLabel="No aircraft in Reference Data yet."
            options={aircraft.filter((a) => a.active).map((a) => ({
              value: a.id,
              label: a.modelName ? `${a.modelNumber}: ${a.modelName}` : a.modelNumber,
              hint: a.manufacturer,
            }))}
          />
        </FormField>
        <FormField label="Approval Number" htmlFor="link-approvals" help="From Approvals. Its own, or one it amends.">
          <MultiSelect
            id="link-approvals"
            value={values.approvalIds}
            onChange={(v) => setField('approvalIds', v)}
            placeholder="Select approvals..."
            emptyLabel="No approvals recorded yet."
            options={approvals.map((a) => ({ value: a.id, label: a.number, hint: a.description }))}
          />
        </FormField>
        <FormField label="Deliverable Number" htmlFor="link-deliverables" help="From Deliverables.">
          <MultiSelect
            id="link-deliverables"
            value={values.deliverableRevisionIds}
            onChange={(v) => setField('deliverableRevisionIds', v)}
            placeholder="Select deliverables..."
            emptyLabel="No deliverables recorded yet."
            options={revisionOptions('deliverable')}
          />
        </FormField>
        <FormField label="Design Data Number" htmlFor="link-design-data" help="From Design Data.">
          <MultiSelect
            id="link-design-data"
            value={values.designDataRevisionIds}
            onChange={(v) => setField('designDataRevisionIds', v)}
            placeholder="Select design data..."
            emptyLabel="No design data recorded yet."
            options={revisionOptions('drawing')}
          />
        </FormField>
        <FormField label="TCCA Project Number" htmlFor="link-tcca" help="From TCCA Projects.">
          <MultiSelect
            id="link-tcca"
            value={values.tccaProjectIds}
            onChange={(v) => setField('tccaProjectIds', v)}
            placeholder="Select TCCA projects..."
            emptyLabel="No TCCA projects exist yet."
            options={tccaProjects.map((t) => ({ value: t.id, label: t.number, hint: t.description }))}
          />
        </FormField>
        <FormField label="Aircraft Specifics" htmlFor="aircraftSpecifics" help="Configuration notes for the airframes above.">
          <Textarea id="aircraftSpecifics" rows={3} value={values.aircraftSpecifics} placeholder="Write here..." onChange={(e) => setField('aircraftSpecifics', e.target.value)} />
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
