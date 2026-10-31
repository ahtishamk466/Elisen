import { useMemo, useRef, useState } from 'react'
import { Drawer } from '@/components/patterns/Drawer'
import { FormSection } from '@/components/patterns/FormSection'
import { FormField } from '@/components/patterns/FormField'
import { FileDropzone } from '@/components/patterns/FileDropzone'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useToastStore } from '@/stores/toastStore'
import { IMPORT_COLUMNS, planImport } from '@/lib/certBasisImport'
import { checkXlsxFile, readXlsx, xlsxMessage, XLSX_MAX_BYTES, type XlsxSheet } from '@/lib/xlsx'
import { formatBytes } from '@/lib/pdfCheck'
import type { CertBasis } from '@/types/gcp'

export interface CertBasisImportDrawerProps {
  /** The basis selected on the page, offered first. */
  initialBasisId?: string
  onClose: () => void
  onImported: (basis: CertBasis) => void
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`

/**
 * The legacy Cert Basis Import: pick a certification basis, upload the
 * `.xlsx` (Harris builds it from the FAA's regulatory-basis export), and its
 * rules are added to that basis, creating any regulation the library doesn't
 * have. The file is read in the browser (`lib/xlsx.ts`) and checked in full
 * before anything changes, with a summary of what will happen; one bad row
 * blocks the import, like the legacy transaction. Replaces the 2026-09-24
 * TCCA Project field: the legacy screen imports into a basis, and a project
 * reaches its rules through the basis it is linked to.
 */
export function CertBasisImportDrawer({ initialBasisId = '', onClose, onImported }: CertBasisImportDrawerProps) {
  const bases = useGcpFlowStore((s) => s.bases)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const addRegulations = useGcpStore((s) => s.addRegulations)
  const showToast = useToastStore((s) => s.show)

  const [basisId, setBasisId] = useState(initialBasisId)
  const [basisError, setBasisError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [sheets, setSheets] = useState<XlsxSheet[] | null>(null)
  const [fileError, setFileError] = useState('')
  const [reading, setReading] = useState(false)
  const lastPick = useRef<File | null>(null)

  const basis = bases.find((b) => b.id === basisId)
  const plan = useMemo(
    () => (basis && sheets ? planImport(sheets, basis, regulations, subparts, subsections) : null),
    [basis, sheets, regulations, subparts, subsections],
  )

  /* A later pick wins over a slower earlier one still being read. */
  const pickFile = async (f: File | null) => {
    lastPick.current = f
    setFile(null)
    setSheets(null)
    setFileError('')
    if (!f) return
    const problem = checkXlsxFile(f)
    if (problem) { setFileError(problem); return }
    setReading(true)
    try {
      const read = await readXlsx(f, IMPORT_COLUMNS.length)
      if (lastPick.current === f) { setFile(f); setSheets(read) }
    } catch (e) {
      if (lastPick.current === f) setFileError(xlsxMessage(e))
    } finally {
      if (lastPick.current === f) setReading(false)
    }
  }

  const submit = () => {
    setBasisError(basis ? '' : 'Select the certification basis to add the rules to.')
    if (!file && !fileError) setFileError('Choose the spreadsheet to import.')
    if (!basis || !plan || plan.errors.length > 0 || plan.addIds.length === 0) return
    addRegulations(plan.newRegulations)
    saveBasis({ ...basis, regulationIds: [...basis.regulationIds, ...plan.addIds] })
    const created = plan.newRegulations.length
    showToast(`Added ${plural(plan.addIds.length, 'rule')} to "${basis.aircraftModel}"${created ? `, ${created} of them new to the regulation library` : ''}.`)
    onImported(basis)
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="Import Certification Basis"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={reading} disabled={!!plan && (plan.errors.length > 0 || plan.addIds.length === 0)}>Import</Button>
        </>
      }
    >
      <FormSection title="Import Certification Basis" subtitle={`Row 1 is headings. Columns A–H: ${IMPORT_COLUMNS.join(', ')}.`}>
        <FormField label="Certification Basis" htmlFor="import-basis" required error={basisError} fullWidth
          help="Existing rules are skipped. Blank amendments must match an existing library record; new regulations require an amendment.">
          <SearchableSelect id="import-basis" value={basisId} error={!!basisError}
            onChange={(id) => { setBasisId(id); setBasisError('') }}
            placeholder="Select a certification basis…" emptyLabel="No certification bases yet. Add one first."
            options={bases.map((b) => ({ value: b.id, label: b.aircraftModel, hint: b.description || plural(b.regulationIds.length, 'rule') }))} />
        </FormField>
        <FileDropzone label="Spreadsheet" required accept=".xlsx" file={file} error={fileError}
          hint={reading ? 'Reading the file…' : `Excel (.xlsx), up to ${formatBytes(XLSX_MAX_BYTES)}`}
          onSelect={pickFile} onReject={() => setFileError('Only Excel files (.xlsx) can be imported.')} />

        {plan && plan.errors.length > 0 && (
          <Alert title={`${plural(plan.errors.length, 'problem')} found, so nothing will be imported`}>
            {plan.errors.slice(0, 5).join(' ')}
            {plan.errors.length > 5 ? ` And ${plan.errors.length - 5} more.` : ''}
          </Alert>
        )}
        {plan && plan.errors.length === 0 && (
          <Alert tone="info" title={plan.addIds.length > 0 ? `${plural(plan.addIds.length, 'rule')} to add` : 'Nothing to add'}>
            {plural(plan.rows, 'row')} read.{' '}
            {plan.skipped > 0 && `${plural(plan.skipped, 'row')} already in this basis or repeated. `}
            {plan.newRegulations.length > 0 && `${plural(plan.newRegulations.length, 'regulation')} will be created in the library.`}
          </Alert>
        )}
      </FormSection>
    </Drawer>
  )
}
