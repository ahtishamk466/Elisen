import { amendmentLabel } from '@/lib/gcpDisplay'
import { useMemo, useState } from 'react'
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, FolderKanban, ListTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { Button } from '@/components/ui/Button'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { codeName, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import { keepLatest } from '@/lib/certBasisLevel'
import type { CertBasis, Regulation } from '@/types/gcp'
import { CertBasisDrawer } from './CertBasisDrawer'
import { CertBasisImportDrawer } from './CertBasisImportDrawer'
import { TableTabs } from '@/components/patterns/TableTabs'
import { DetailCard, DetailField } from '@/components/patterns/DetailView'
import { CertBasisUsage } from './CertBasisUsage'
import { CertBasisSummary } from './CertBasisSummary'
import { CertBasisTable } from './CertBasisTable'
import { GcpDataGate } from './GcpDataGate'
import { RegulationDetailDrawer } from './RegulationDetailDrawer'
import { RegulationDrawer } from './RegulationDrawer'

const regsIn = (b: CertBasis, byId: Map<string, Regulation>) =>
  b.regulationIds.map((id) => byId.get(id)).filter((r): r is Regulation => !!r)

/** Master workspace using the Project detail overview and section navigation pattern. */
export function CertBasisDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const bases = useGcpFlowStore((s) => s.bases)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const regulations = useGcpStore((s) => s.regulations)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const updateRegulation = useGcpStore((s) => s.updateRegulation)
  const [searchParams, setSearchParams] = useSearchParams()

  const [basisDrawer, setBasisDrawer] = useState<{ mode: 'create' | 'edit'; basis?: CertBasis } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deletingBasis, setDeletingBasis] = useState<CertBasis | null>(null)
  const [trimming, setTrimming] = useState<CertBasis | null>(null)
  const [viewing, setViewing] = useState<Regulation | null>(null)
  const [editing, setEditing] = useState<Regulation | null>(null)
  const [removingReg, setRemovingReg] = useState<{ basis: CertBasis; regulation: Regulation } | null>(null)

  const regById = useMemo(() => new Map(regulations.map((r) => [r.id, r])), [regulations])
  const regsOf = (b: CertBasis) => regsIn(b, regById)

  const selected = bases.find((b) => b.id === id) ?? null
  const tab = searchParams.get('tab') || 'overview'
  const selectedRules = useMemo(() => (selected ? regsIn(selected, regById) : []), [selected, regById])
  const select = (b: CertBasis) => {
    navigate(`/gcp/cert-bases/${b.id}`)
  }
  const trimCount = trimming ? regsOf(trimming).length - keepLatest(trimming, regsOf(trimming)).length : 0

  if (location.pathname.endsWith('/edit') && selected) return <CertBasisDrawer mode="edit" initial={selected} onClose={() => navigate(`/gcp/cert-bases/${selected.id}`)} onSubmit={(b) => { saveBasis(b); navigate(`/gcp/cert-bases/${b.id}`) }} />
  if (basisDrawer) return <CertBasisDrawer mode={basisDrawer.mode} initial={basisDrawer.basis} onClose={() => setBasisDrawer(null)} onSubmit={(b) => { saveBasis(b); setBasisDrawer(null); select(b) }} />

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Certification Basis"
      title={selected?.aircraftModel || "Certification Basis not found"}
      headerLeft={<Button variant="tertiary" leadingIcon={<ArrowLeft size={18} aria-hidden />} onClick={() => navigate("/gcp/cert-bases")}>Go back</Button>}
      description={selected?.description}
      headerActions={
        <>
          <Button variant="secondary" leadingIcon={<Download size={16} />} onClick={() => setImportOpen(true)}>Import</Button>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setBasisDrawer({ mode: 'create' })}>Add</Button>
        </>
      }
    >
      <GcpDataGate>
      <div className="grid gap-lg">
              {selected && <div className="rounded-sm border border-border-default bg-neutral-25 p-lg">
                <CertBasisSummary basis={selected} onViewUsage={() => setSearchParams({tab: 'projects'}, {replace: true})} onKeepLatest={() => setTrimming(selected)} actions={
                  <>
                    <Button variant="secondary" size="sm" leadingIcon={<Pencil size={14} />}
                      onClick={() => setBasisDrawer({ mode: 'edit', basis: selected })}>Edit</Button>
                    <Button variant="danger" size="sm" leadingIcon={<Trash2 size={14} />}
                      onClick={() => setDeletingBasis(selected)}>Delete</Button>
                  </>
                } />
              </div>}
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <TableTabs tabs={[{key: 'overview', label: 'Overview'}, {key: 'regulations', label: 'Regulations', count: selected?.regulationIds.length ?? 0}, {key: 'projects', label: 'Used By', count: Object.values(projectBasis).filter((v) => v === id).length}]}
            activeKey={tab} onChange={(key) => setSearchParams({tab: key}, {replace: true})} ariaLabel="Certification basis sections" />
        </div>
          {selected ? (
            <section aria-label={`Certification basis ${selected.aircraftModel}`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              {tab === 'overview' && <DetailCard title="Master details"><div className="grid gap-lg tablet:grid-cols-2"><DetailField label="Code">{selected.aircraftModel}</DetailField><DetailField label="Description">{selected.description}</DetailField><DetailField label="TCDS Number">{selected.tcdsNumber}</DetailField></div></DetailCard>}
              {tab === 'projects' && <CertBasisUsage basisId={selected.id} />}
              {tab === 'regulations' && (selectedRules.length === 0 ? (
                <div className="border-t border-border-default">
                  <EmptyState icon={<ListTree size={48} strokeWidth={1.5} />} title="No regulations yet"
                    description="Build this basis's rules in GCP Projects' Certification Basis step, or edit it here." />
                </div>
              ) : (
                <CertBasisTable basis={selected} rules={selectedRules} pool={regulations}
                  onView={setViewing} onEditRegulation={setEditing}
                  onRemove={(regulation) => setRemovingReg({ basis: selected, regulation })} />
              ))}
            </section>
          ) : (
            <div className="rounded-sm border border-border-default bg-neutral-25">
              <EmptyState icon={<FolderKanban size={48} strokeWidth={1.5} />} title="Certification basis not found"
                description="This Master may have been deleted, or the link is out of date."
                action={<Button variant="secondary" onClick={() => navigate('/gcp/cert-bases')}>Back to list</Button>} />
            </div>
          )}
      </div>
      </GcpDataGate>

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
          description="This deletes the shared Master and unlinks every TCCA project using it. Regulations and initialized compliance plans remain available. This cannot be undone."
          confirmLabel="Delete" tone="danger"
          onConfirm={() => {
            if (deletingBasis.sourceDocument) URL.revokeObjectURL(deletingBasis.sourceDocument.url)
            useGcpFlowStore.getState().removeBasis(deletingBasis.id)
            navigate('/gcp/cert-bases')
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
        <ConfirmDialog open title={`Remove "${removingReg.regulation.section} · ${amendmentLabel(removingReg.regulation.amdt)}" from this basis?`}
          description="The regulation stays in the library. Removing this link changes this shared Master for every project using it; existing initialized compliance plans stay unchanged."
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
