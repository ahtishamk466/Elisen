import { useState } from 'react'
import { Download } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useTccaStore } from '@/stores/tccaStore'

export interface CertRecordReportDrawerProps {
  /** Pre-selects the project this drawer was opened from — the Certification
      Flow already has one in scope, the standalone Reports page doesn't. */
  defaultTccaProjectId?: string
  onClose: () => void
  onDownload?: () => void
}

/** "Certification Record" report parameters, exactly as the legacy Reports
    screen collects them — the aircraft identity fields arrive pre-filled
    with this DAO's own values, the same way the legacy screen does. */
export function CertRecordReportDrawer({ defaultTccaProjectId, onClose, onDownload }: CertRecordReportDrawerProps) {
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const [tccaProjectId, setTccaProjectId] = useState(defaultTccaProjectId ?? '')
  const [startingPage, setStartingPage] = useState('')
  const [reportNumber, setReportNumber] = useState('')
  const [addendumNumber, setAddendumNumber] = useState('')
  const [reportIssue, setReportIssue] = useState('')
  const [reportDate, setReportDate] = useState('')
  const [focCodesSection, setFocCodesSection] = useState('')
  const [mocCodesSection, setMocCodesSection] = useState('')
  const [complianceReportsSection, setComplianceReportsSection] = useState('')
  const [mdlNumberAndRev, setMdlNumberAndRev] = useState('')
  const [applicationName, setApplicationName] = useState('Elisen & associes inc.')
  const [designApprovalDoc, setDesignApprovalDoc] = useState('A-177')
  const [aircraftMake, setAircraftMake] = useState('Bombardier')
  const [aircraftModel, setAircraftModel] = useState('BD-700-1A11')
  const [type, setType] = useState('Aircraft')

  const valid = !!tccaProjectId && !!startingPage && !!reportDate

  return (
    <Drawer
      open
      onClose={onClose}
      title="Certification Record — Enter Parameters"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} leadingIcon={<Download size={16} />} onClick={() => { onDownload?.(); onClose() }}>Download</Button>
        </>
      }
    >
      <FormSection title="Parameters" subtitle="Everything the Certification Record report is built from.">
        <FormField label="TCCA Project Number" htmlFor="cr-tcca" required fullWidth>
          <SearchableSelect
            id="cr-tcca"
            value={tccaProjectId}
            onChange={setTccaProjectId}
            placeholder="Select a TCCA Project"
            emptyLabel="No TCCA projects exist yet."
            options={tccaProjects.map((t) => ({ value: t.id, label: t.number, hint: t.description }))}
          />
        </FormField>
        <FormField label="Starting Page Number" htmlFor="cr-page" required fullWidth>
          <Input id="cr-page" type="number" value={startingPage} placeholder="e.g. 1"
            onChange={(e) => setStartingPage(e.target.value)} />
        </FormField>
        <FormField label="Report Number" htmlFor="cr-report-number" fullWidth>
          <Input id="cr-report-number" value={reportNumber} placeholder="e.g. 1623-CR-01"
            onChange={(e) => setReportNumber(e.target.value)} />
        </FormField>
        <FormField label="Addendum Number" htmlFor="cr-addendum" fullWidth>
          <Input id="cr-addendum" value={addendumNumber} placeholder="e.g. A1"
            onChange={(e) => setAddendumNumber(e.target.value)} />
        </FormField>
        <FormField label="Report Issue" htmlFor="cr-issue" fullWidth>
          <Input id="cr-issue" value={reportIssue} placeholder="e.g. 1"
            onChange={(e) => setReportIssue(e.target.value)} />
        </FormField>
        <FormField label="Report Date" htmlFor="cr-date" required fullWidth>
          <Input id="cr-date" type="date" value={reportDate}
            onChange={(e) => setReportDate(e.target.value)} />
        </FormField>
        <FormField label="Foc Codes Section" htmlFor="cr-foc" fullWidth>
          <Input id="cr-foc" value={focCodesSection} placeholder="e.g. AP-01"
            onChange={(e) => setFocCodesSection(e.target.value)} />
        </FormField>
        <FormField label="Moc Codes Section" htmlFor="cr-moc" fullWidth>
          <Input id="cr-moc" value={mocCodesSection} placeholder="e.g. DR"
            onChange={(e) => setMocCodesSection(e.target.value)} />
        </FormField>
        <FormField label="Compliance Reports Section" htmlFor="cr-compliance" fullWidth>
          <Input id="cr-compliance" value={complianceReportsSection} placeholder="e.g. Section 9.0"
            onChange={(e) => setComplianceReportsSection(e.target.value)} />
        </FormField>
        <FormField label="Mdl Number And Rev" htmlFor="cr-mdl" fullWidth>
          <Input id="cr-mdl" value={mdlNumberAndRev} placeholder="e.g. MDL-01 Rev A"
            onChange={(e) => setMdlNumberAndRev(e.target.value)} />
        </FormField>
        <FormField label="Application Name" htmlFor="cr-application" fullWidth>
          <Input id="cr-application" value={applicationName} placeholder="e.g. Elisen & associes inc."
            onChange={(e) => setApplicationName(e.target.value)} />
        </FormField>
        <FormField label="Design Approval Doc" htmlFor="cr-design-doc" fullWidth>
          <Input id="cr-design-doc" value={designApprovalDoc} placeholder="e.g. A-177"
            onChange={(e) => setDesignApprovalDoc(e.target.value)} />
        </FormField>
        <FormField label="Aircraft Make" htmlFor="cr-make" fullWidth>
          <Input id="cr-make" value={aircraftMake} placeholder="e.g. Bombardier"
            onChange={(e) => setAircraftMake(e.target.value)} />
        </FormField>
        <FormField label="Aircraft Model" htmlFor="cr-model" fullWidth>
          <Input id="cr-model" value={aircraftModel} placeholder="e.g. BD-700-1A11"
            onChange={(e) => setAircraftModel(e.target.value)} />
        </FormField>
        <FormField label="Type" htmlFor="cr-type" fullWidth>
          <Input id="cr-type" value={type} placeholder="e.g. Aircraft"
            onChange={(e) => setType(e.target.value)} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
