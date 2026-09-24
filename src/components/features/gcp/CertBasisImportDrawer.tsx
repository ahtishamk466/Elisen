import { useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { FileDropzone } from '@/components/patterns/FileDropzone'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useTccaStore } from '@/stores/tccaStore'

export interface CertBasisImportDrawerProps {
  onClose: () => void
  onImport: (file: File, projectId: string) => void
}

/**
 * The legacy "Cert Basis Import" tool: the specialist picks which TCCA
 * project the import is for, then builds an Excel export of that project's
 * type certificate rules (from the FAA/TCCA site) and imports it here to
 * build a basis's rule set automatically instead of picking one regulation
 * at a time — the project picker sits above the file zone since it has to
 * be answered first (client instruction, 2026-09-24: this drawer had no way
 * to say which project an import belonged to). No file parsing in this
 * prototype (no backend) — picking a file and importing hands back a
 * confirmation, the same "no export pipeline yet" shape `GcpReportsPage`'s
 * own download already uses.
 */
export function CertBasisImportDrawer({ onClose, onImport }: CertBasisImportDrawerProps) {
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const [projectId, setProjectId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [projectError, setProjectError] = useState('')
  const [fileError, setFileError] = useState('')

  const submit = () => {
    const pe = projectId ? '' : 'Select which project this import is for.'
    const fe = file ? '' : 'Choose a regulation export file to import.'
    setProjectError(pe)
    setFileError(fe)
    if (pe || fe) return
    onImport(file!, projectId)
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Import Cert Basis"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Import</Button>
        </>
      }
    >
      <FormSection title="Import Cert Basis" subtitle="Which project this import is for, then the export file to build its rule set from.">
        <FormField label="TCCA Project" htmlFor="import-project" required error={projectError} fullWidth>
          <SearchableSelect
            id="import-project"
            value={projectId}
            onChange={(id) => { setProjectId(id); setProjectError('') }}
            placeholder="Select a TCCA project…"
            options={tccaProjects.map((t) => ({ value: t.id, label: t.number, hint: t.description }))}
          />
        </FormField>
        <FileDropzone
          label="Upload File"
          required
          accept=".xlsx,.xls,.csv"
          hint="A regulation export from the FAA or TCCA site (.xlsx, .xls or .csv)."
          file={file}
          error={fileError}
          onSelect={(f) => { setFile(f); setFileError(f ? '' : 'Choose a regulation export file to import.') }}
        />
      </FormSection>
    </Drawer>
  )
}
