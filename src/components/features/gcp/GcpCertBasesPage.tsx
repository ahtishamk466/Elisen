import { useState } from 'react'
import { Download, FolderKanban, Plus, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useTccaStore } from '@/stores/tccaStore'
import { useToastStore } from '@/stores/toastStore'
import { codeName, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import { duplicateSections, keepLatest, levelLabel } from '@/lib/certBasisLevel'
import type { CertBasis, Regulation } from '@/types/gcp'
import { CertBasisDrawer } from './CertBasisDrawer'
import { CertBasisImportDrawer } from './CertBasisImportDrawer'
import { CertBasisSummary } from './CertBasisSummary'
import { CertBasisTable, type CertBasisRow } from './CertBasisTable'
import { RegulationDetailDrawer } from './RegulationDetailDrawer'
import { RegulationDrawer } from './RegulationDrawer'

/**
 * Cert Basis — one flat table of every basis↔regulation link (client
 * instruction, 2026-09-25; see `CertBasisTable`). The **basis filter** in the
 * header narrows it to one basis and shows that basis's summary above the
 * table: its TCDS source, how it was built, which projects use it, and the
 * one-version-per-rule check with a "keep the latest version" fix. Linking a
 * basis to a project happens in GCP Projects' Certification basis step.
 */
export function GcpCertBasesPage() {
  const bases = useGcpFlowStore((s) => s.bases)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const regulations = useGcpStore((s) => s.regulations)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const updateRegulation = useGcpStore((s) => s.updateRegulation)
  const showToast = useToastStore((s) => s.show)

  const [query, setQuery] = useState('')
  const [basisFilter, setBasisFilter] = useState('')
  const [basisDrawer, setBasisDrawer] = useState<{ mode: 'create' | 'edit'; basis?: CertBasis } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deletingBasis, setDeletingBasis] = useState<CertBasis | null>(null)
  const [trimming, setTrimming] = useState<CertBasis | null>(null)
  const [viewing, setViewing] = useState<Regulation | null>(null)
  const [editing, setEditing] = useState<Regulation | null>(null)
  const [removingReg, setRemovingReg] = useState<{ basis: CertBasis; regulation: Regulation } | null>(null)

  const regsOf = (b: CertBasis) => b.regulationIds
    .map((id) => regulations.find((r) => r.id === id))
    .filter((r): r is Regulation => !!r)

  const selected = bases.find((b) => b.id === basisFilter)
  const q = query.trim().toLowerCase()
  const filtered = (selected ? [selected] : bases).filter((b) => !q
    || `${b.aircraftModel} ${b.tcdsNumber}`.toLowerCase().includes(q)
    || regsOf(b).some((r) => `${r.section} ${r.amdt} ${r.title}`.toLowerCase().includes(q)))
  const rows: CertBasisRow[] = filtered.flatMap((b): CertBasisRow[] => {
    const regs = regsOf(b)
    return regs.length > 0 ? regs.map((r) => ({ basis: b, regulation: r })) : [{ basis: b, regulation: null }]
  })

  const trimCount = trimming ? regsOf(trimming).length - keepLatest(trimming, regsOf(trimming)).length : 0

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Cert Basis"
      title="Cert Basis"
      description="Each aircraft's rules from its Type Certificate Data Sheet (TCDS): which regulation, at which amendment."
      fill
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 240 }}>
            <SearchableSelect id="cert-basis-filter" size="sm" value={basisFilter} onChange={setBasisFilter}
              ariaLabel="Show one cert basis" placeholder="All cert bases"
              options={[{ value: '', label: 'All cert bases' }, ...bases.map((b) => ({
                value: b.id, label: b.aircraftModel,
                hint: `${b.regulationIds.length} rules · ${levelLabel(b)}${duplicateSections(regsOf(b)).length ? ' · has duplicates' : ''}`,
              }))]} />
          </div>
          <div className="min-w-0" style={{ width: 260 }}>
            <label htmlFor="cert-bases-search" className="sr-only">Search Cert Basis and their regulations</label>
            <Input id="cert-bases-search" size="sm" leadingIcon={<Search size={16} />}
              placeholder="Search by aircraft, TCDS or regulation..."
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button variant="secondary" leadingIcon={<Download size={16} />} onClick={() => setImportOpen(true)}>Import</Button>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setBasisDrawer({ mode: 'create' })}>Add Cert Basis</Button>
        </>
      }
    >
      {selected && (
        <div className="mb-lg shrink-0">
          <CertBasisSummary basis={selected} onKeepLatest={() => setTrimming(selected)} />
        </div>
      )}

      {bases.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState icon={<FolderKanban size={48} strokeWidth={1.5} />} title="No Cert Basis yet"
            description="Add one for an aircraft's type certificate, or import a regulation export to build one automatically."
            action={<Button leadingIcon={<Plus size={16} />} onClick={() => setBasisDrawer({ mode: 'create' })}>Add Cert Basis</Button>} />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState icon={<FolderKanban size={48} strokeWidth={1.5} />} title="No Cert Basis match your search"
            description="Try another aircraft, TCDS or regulation."
            action={<Button variant="secondary" onClick={() => { setQuery(''); setBasisFilter('') }}>Clear search</Button>} />
        </div>
      ) : (
        <CertBasisTable rows={rows} pool={regulations}
          onView={setViewing} onEditRegulation={setEditing}
          onRemove={(basis, regulation) => setRemovingReg({ basis, regulation })}
          onEditBasis={(basis) => setBasisDrawer({ mode: 'edit', basis })}
          onDeleteBasis={setDeletingBasis} />
      )}

      {basisDrawer && (
        <CertBasisDrawer mode={basisDrawer.mode} initial={basisDrawer.basis}
          onClose={() => setBasisDrawer(null)} onSubmit={(b) => saveBasis(b)} />
      )}

      {importOpen && (
        <CertBasisImportDrawer
          onClose={() => setImportOpen(false)}
          onImport={(file, projectId) => {
            const project = tccaProjects.find((t) => t.id === projectId)
            showToast(`"${file.name}" received for ${project?.number ?? 'the selected project'}. Cert basis import needs a real backend, so nothing was actually processed yet.`)
          }}
        />
      )}

      {trimming && (
        <ConfirmDialog open title={`Keep the latest version in "${trimming.aircraftModel}"?`}
          description={`Removes ${trimCount} older version${trimCount === 1 ? '' : 's'} from this basis, so each rule appears once. The regulations stay in the library.`}
          confirmLabel="Keep latest"
          onConfirm={() => { saveBasis({ ...trimming, regulationIds: keepLatest(trimming, regsOf(trimming)) }); setTrimming(null) }}
          onCancel={() => setTrimming(null)} />
      )}

      {deletingBasis && (
        <ConfirmDialog open title={`Delete "${deletingBasis.aircraftModel}"?`}
          description={`${regsOf(deletingBasis).length} regulation${regsOf(deletingBasis).length === 1 ? '' : 's'} allocated to this basis will no longer be attached to it. This cannot be undone.`}
          confirmLabel="Delete" tone="danger"
          onConfirm={() => {
            useGcpFlowStore.setState((s) => ({ bases: s.bases.filter((b) => b.id !== deletingBasis.id) }))
            if (basisFilter === deletingBasis.id) setBasisFilter('')
            setDeletingBasis(null)
          }}
          onCancel={() => setDeletingBasis(null)} />
      )}

      {viewing && (
        <RegulationDetailDrawer regulation={viewing}
          subpart={codeName(subpartParts(viewing.subpartCode, subparts))}
          subsection={codeName(subsectionParts(viewing.subsectionCode, subsections))}
          onClose={() => setViewing(null)} onEdit={() => { setEditing(viewing); setViewing(null) }} />
      )}

      {editing && (
        <RegulationDrawer mode="edit" initial={editing} onClose={() => setEditing(null)} onSubmit={(r) => updateRegulation(r.id, r)} />
      )}

      {removingReg && (
        <ConfirmDialog open title={`Remove "${removingReg.regulation.section} · ${removingReg.regulation.amdt}" from this basis?`}
          description="The regulation stays in the library; only its place in this cert basis is removed."
          confirmLabel="Remove" tone="danger"
          onConfirm={() => {
            const { basis, regulation } = removingReg
            saveBasis({ ...basis, regulationIds: basis.regulationIds.filter((id) => id !== regulation.id) })
            setRemovingReg(null)
          }}
          onCancel={() => setRemovingReg(null)} />
      )}
    </AppShell>
  )
}
