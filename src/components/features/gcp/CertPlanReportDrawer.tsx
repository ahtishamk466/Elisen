import { useState } from 'react'
import { Download } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useTccaStore } from '@/stores/tccaStore'

export interface CertPlanReportDrawerProps {
  /** Pre-selects the project this drawer was opened from — the Certification
      Flow already has one in scope, the standalone Reports page doesn't. */
  defaultTccaProjectId?: string
  onClose: () => void
  onDownload?: () => void
}

/** "Certification Plan" report parameters, exactly as the legacy Reports
    screen collects them. */
export function CertPlanReportDrawer({ defaultTccaProjectId, onClose, onDownload }: CertPlanReportDrawerProps) {
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const [tccaProjectId, setTccaProjectId] = useState(defaultTccaProjectId ?? '')
  const [startingPage, setStartingPage] = useState('')
  const [reportNumber, setReportNumber] = useState('')
  const [addendumNumber, setAddendumNumber] = useState('')
  const [reportIssue, setReportIssue] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [delegationSection, setDelegationSection] = useState('')
  const [deliverablesSection, setDeliverablesSection] = useState('')

  const valid = !!tccaProjectId && !!startingPage && !!reportDate

  return (
    <Drawer
      open
      onClose={onClose}
      title="Certification Plan — Enter Parameters"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} leadingIcon={<Download size={16} />} onClick={() => { onDownload?.(); onClose() }}>Download</Button>
        </>
      }
    >
      <FormSection title="Parameters" subtitle="Everything the Certification Plan report is built from.">
        <FormField label="TCCA Project Number" htmlFor="cp-tcca" required fullWidth>
          <SearchableSelect
            id="cp-tcca"
            value={tccaProjectId}
            onChange={setTccaProjectId}
            placeholder="Select a TCCA Project"
            emptyLabel="No TCCA projects exist yet."
            options={tccaProjects.map((t) => ({ value: t.id, label: t.number, hint: t.description }))}
          />
        </FormField>
        <FormField label="Starting Page Number" htmlFor="cp-page" required fullWidth>
          <Input id="cp-page" type="number" value={startingPage} placeholder="e.g. 1"
            onChange={(e) => setStartingPage(e.target.value)} />
        </FormField>
        <FormField label="Report Number" htmlFor="cp-report-number" fullWidth>
          <Input id="cp-report-number" value={reportNumber} placeholder="e.g. 1623-CP-01"
            onChange={(e) => setReportNumber(e.target.value)} />
        </FormField>
        <FormField label="Addendum Number" htmlFor="cp-addendum" fullWidth>
          <Input id="cp-addendum" value={addendumNumber} placeholder="e.g. A1"
            onChange={(e) => setAddendumNumber(e.target.value)} />
        </FormField>
        <FormField label="Report Issue" htmlFor="cp-issue" fullWidth>
          <Input id="cp-issue" value={reportIssue} placeholder="e.g. 1"
            onChange={(e) => setReportIssue(e.target.value)} />
        </FormField>
        <FormField label="Report Date" htmlFor="cp-date" required fullWidth>
          <Input id="cp-date" type="date" value={reportDate}
            onChange={(e) => setReportDate(e.target.value)} />
        </FormField>
        <FormField label="Delegation Section" htmlFor="cp-delegation" fullWidth>
          <Input id="cp-delegation" value={delegationSection} placeholder="Enter a Delegation Section"
            onChange={(e) => setDelegationSection(e.target.value)} />
        </FormField>
        <FormField label="Deliverables Section" htmlFor="cp-deliverables" fullWidth>
          <Input id="cp-deliverables" value={deliverablesSection} placeholder="Enter a Deliverables Section"
            onChange={(e) => setDeliverablesSection(e.target.value)} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
