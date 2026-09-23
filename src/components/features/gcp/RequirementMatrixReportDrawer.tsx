import { useState } from 'react'
import { Download } from 'lucide-react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useTccaStore } from '@/stores/tccaStore'

export interface RequirementMatrixReportDrawerProps {
  /** Pre-selects the project this drawer was opened from — the Certification
      Flow already has one in scope, the standalone Reports page doesn't. */
  defaultTccaProjectId?: string
  onClose: () => void
  onDownload?: () => void
}

/** "Requirement Cross reference – Matrix" report parameters — the shortest
    of the three, exactly as the legacy Reports screen collects them. */
export function RequirementMatrixReportDrawer({ defaultTccaProjectId, onClose, onDownload }: RequirementMatrixReportDrawerProps) {
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const [tccaProjectId, setTccaProjectId] = useState(defaultTccaProjectId ?? '')
  const [reportDate, setReportDate] = useState('')

  const valid = !!tccaProjectId && !!reportDate

  return (
    <Drawer
      open
      onClose={onClose}
      title="Requirement Cross reference – Matrix — Enter Parameters"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} leadingIcon={<Download size={16} />} onClick={() => { onDownload?.(); onClose() }}>Download</Button>
        </>
      }
    >
      <FormSection title="Parameters" subtitle="Everything the Requirement Cross Reference Matrix is built from.">
        <FormField label="TCCA Project Number" htmlFor="rm-tcca" required fullWidth>
          <SearchableSelect
            id="rm-tcca"
            value={tccaProjectId}
            onChange={setTccaProjectId}
            placeholder="Select a TCCA Project"
            emptyLabel="No TCCA projects exist yet."
            options={tccaProjects.map((t) => ({ value: t.id, label: t.number, hint: t.description }))}
          />
        </FormField>
        <FormField label="Report Date" htmlFor="rm-date" required fullWidth>
          <Input id="rm-date" type="date" value={reportDate}
            onChange={(e) => setReportDate(e.target.value)} />
        </FormField>
      </FormSection>
    </Drawer>
  )
}
