import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, FolderKanban, ListTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Button } from '@/components/ui/Button'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { codeName, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import { duplicateSections, keepLatest } from '@/lib/certBasisLevel'
import type { CertBasis, Regulation } from '@/types/gcp'
import { CertBasisDrawer } from './CertBasisDrawer'
import { CertBasisImportDrawer } from './CertBasisImportDrawer'
import { CertBasisRail } from './CertBasisRail'
import { CertBasisSummary } from './CertBasisSummary'
import { CertBasisTable } from './CertBasisTable'
import { GcpDataGate } from './GcpDataGate'
import { RegulationDetailDrawer } from './RegulationDetailDrawer'
import { RegulationDrawer } from './RegulationDrawer'

const regsIn = (b: CertBasis, byId: Map<string, Regulation>) =>
  b.regulationIds.map((id) => byId.get(id)).filter((r): r is Regulation => !!r)

/**
 * Certification Basis — every basis listed once on the left, the selected one on the
 * right: its name once, its source and usage, the duplicate check, and only
 * its own rules, in **one** card that fills the height. The user's request,
 * 2026-10-30: the flat table repeated each basis's name on every row and was
 * too congested for a normal user. Reverses the 2026-09-25 "one flat table",
 * avoiding what the 2026-09-24 master–detail was rejected for: a separate
 * header card over a separate table, and dead space under a short table.
 * Same rail shape as Regulation Groups; the selection lives in `?basis=`.
 */
export function GcpCertBasesPage() {
  const bases = useGcpFlowStore((s) => s.bases)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const updateRegulation = useGcpStore((s) => s.updateRegulation)
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const [basisDrawer, setBasisDrawer] = useState<{ mode: 'create' | 'edit'; basis?: CertBasis } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deletingBasis, setDeletingBasis] = useState<CertBasis | null>(null)
  const [trimming, setTrimming] = useState<CertBasis | null>(null)
  const [viewing, setViewing] = useState<Regulation | null>(null)
  const [editing, setEditing] = useState<Regulation | null>(null)
  const [removingReg, setRemovingReg] = useState<{ basis: CertBasis; regulation: Regulation } | null>(null)

  const regById = useMemo(() => new Map(regulations.map((r) => [r.id, r])), [regulations])
  const regsOf = (b: CertBasis) => regsIn(b, regById)
  const needsFixing = new Set(bases.filter((b) => duplicateSections(regsOf(b)).length > 0).map((b) => b.id))

  const q = query.trim().toLowerCase()
  const filtered = bases.filter((b) => !q
    || `${b.aircraftModel} ${b.tcdsNumber} ${b.description ?? ''}`.toLowerCase().includes(q)
    || regsOf(b).some((r) => `${r.section} ${r.amdt} ${r.title}`.toLowerCase().includes(q)))
  const selected = filtered.find((b) => b.id === searchParams.get('basis')) ?? filtered[0] ?? null
  const selectedRules = useMemo(() => (selected ? regsIn(selected, regById) : []), [selected, regById])
  const select = (b: CertBasis) => {
    const p = new URLSearchParams(searchParams)
    p.set('basis', b.id)
    setSearchParams(p, { replace: true })
  }
  const trimCount = trimming ? regsOf(trimming).length - keepLatest(trimming, regsOf(trimming)).length : 0

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Certification Basis"
      title="Certification Basis"
      description="Each aircraft's rules from its Type Certificate Data Sheet (TCDS): which regulation, at which amendment."
      fill
      headerActions={
        <>
          <Button variant="secondary" leadingIcon={<Download size={16} />} onClick={() => setImportOpen(true)}>Import</Button>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setBasisDrawer({ mode: 'create' })}>Add Certification Basis</Button>
        </>
      }
    >
      <GcpDataGate>
      {bases.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState icon={<FolderKanban size={48} strokeWidth={1.5} />} title="No certification basis yet"
            description="Add one for an aircraft's type certificate, or import a regulation export to build one automatically."
            action={<Button leadingIcon={<Plus size={16} />} onClick={() => setBasisDrawer({ mode: 'create' })}>Add Certification Basis</Button>} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
          <CertBasisRail bases={filtered} selectedId={selected?.id} needsFixing={needsFixing}
            query={query} onQueryChange={setQuery} onSelect={select} />

          {selected ? (
            <section aria-label={`Certification basis ${selected.aircraftModel}`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              <div className="shrink-0">
                <CertBasisSummary basis={selected} onKeepLatest={() => setTrimming(selected)} actions={
                  <>
                    <Button variant="secondary" size="sm" leadingIcon={<Pencil size={14} />}
                      onClick={() => setBasisDrawer({ mode: 'edit', basis: selected })}>Edit</Button>
                    <ActionsMenu ariaLabel={`More actions for ${selected.aircraftModel}`} items={[
                      { label: 'Delete Certification Basis', icon: <Trash2 size={16} />, onSelect: () => setDeletingBasis(selected), tone: 'danger' },
                    ]} />
                  </>
                } />
              </div>
              {selectedRules.length === 0 ? (
                <div className="border-t border-border-default">
                  <EmptyState icon={<ListTree size={48} strokeWidth={1.5} />} title="No regulations yet"
                    description="Build this basis's rules in GCP Projects' Certification Basis step, or edit it here." />
                </div>
              ) : (
                <CertBasisTable basis={selected} rules={selectedRules} pool={regulations}
                  onView={setViewing} onEditRegulation={setEditing}
                  onRemove={(regulation) => setRemovingReg({ basis: selected, regulation })} />
              )}
            </section>
          ) : (
            <div className="rounded-sm border border-border-default bg-neutral-25">
              <EmptyState icon={<FolderKanban size={48} strokeWidth={1.5} />} title="No certification basis matches your search"
                description="Try another aircraft, TCDS or regulation."
                action={<Button variant="secondary" onClick={() => setQuery('')}>Clear Search</Button>} />
            </div>
          )}
        </div>
      )}
      </GcpDataGate>

      {basisDrawer && (
        <CertBasisDrawer mode={basisDrawer.mode} initial={basisDrawer.basis}
          onClose={() => setBasisDrawer(null)} onSubmit={(b) => { saveBasis(b); select(b) }} />
      )}

      {importOpen && (
        <CertBasisImportDrawer initialBasisId={selected?.id} onClose={() => setImportOpen(false)} onImported={select} />
      )}

      {trimming && (
        <ConfirmDialog open title={`Keep the latest version in "${trimming.aircraftModel}"?`}
          description={`Removes ${trimCount} older version${trimCount === 1 ? '' : 's'} from this basis, so each rule appears once. The regulations stay in the library.`}
          confirmLabel="Keep Latest Version"
          onConfirm={() => { saveBasis({ ...trimming, regulationIds: keepLatest(trimming, regsOf(trimming)) }); setTrimming(null) }}
          onCancel={() => setTrimming(null)} />
      )}

      {deletingBasis && (
        <ConfirmDialog open title={`Delete "${deletingBasis.aircraftModel}"?`}
          description={`${regsOf(deletingBasis).length} regulation${regsOf(deletingBasis).length === 1 ? '' : 's'} allocated to this basis will no longer be attached to it. This cannot be undone.`}
          confirmLabel="Delete" tone="danger"
          onConfirm={() => {
            if (deletingBasis.sourceDocument) URL.revokeObjectURL(deletingBasis.sourceDocument.url)
            useGcpFlowStore.setState((s) => ({ bases: s.bases.filter((b) => b.id !== deletingBasis.id) }))
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
          description="The regulation stays in the library; only its place in this certification basis is removed."
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
