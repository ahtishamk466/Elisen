import { amendmentLabel } from '@/lib/gcpDisplay'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { FolderKanban, ListTree, Search } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { BackLink } from '@/components/patterns/BackLink'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SectionTabs } from '@/components/patterns/SectionTabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { keepLatest } from '@/lib/certBasisLevel'
import type { CertBasis, Regulation } from '@/types/gcp'
import { CertBasisDrawer } from './CertBasisDrawer'
import { CertBasisImportDrawer } from './CertBasisImportDrawer'
import { CertBasisIdentityCard } from './CertBasisIdentityCard'
import { CertBasisUsage } from './CertBasisUsage'
import { DuplicateRulesAlert } from './CertBasisSummary'
import { CertBasisTable, type RuleStatus } from './CertBasisTable'
import { GcpDataGate } from './GcpDataGate'
import { RegulationDetailDrawer } from './RegulationDetailDrawer'
import { RegulationDrawer } from './RegulationDrawer'

const regsIn = (b: CertBasis, byId: Map<string, Regulation>) =>
  b.regulationIds.map((id) => byId.get(id)).filter((r): r is Regulation => !!r)

const TABS = ['Regulations', 'Used By'] as const
type Tab = (typeof TABS)[number]
/** `?tab=` values, unchanged so existing links keep working; an old
    `?tab=overview` link (the Overview tab, removed 2026-11-01) opens Regulations. */
const TAB_KEY: Record<Tab, string> = { Regulations: 'regulations', 'Used By': 'projects' }

/** Master workspace: the identity band over the section tabs, so the rule table
    gets the page's full width (DESIGN.md → Record page, the basis exception). */
export function CertBasisDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const projectBasis = useGcpFlowStore((s) => s.projectBasis)
  const bases = useGcpFlowStore((s) => s.bases)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const regulations = useGcpStore((s) => s.regulations)
  const updateRegulation = useGcpStore((s) => s.updateRegulation)
  const [searchParams, setSearchParams] = useSearchParams()

  const [editingBasis, setEditingBasis] = useState<CertBasis | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deletingBasis, setDeletingBasis] = useState<CertBasis | null>(null)
  const [trimming, setTrimming] = useState<CertBasis | null>(null)
  const [viewing, setViewing] = useState<Regulation | null>(null)
  const [viewingList, setViewingList] = useState<Regulation[]>([])
  const [editing, setEditing] = useState<Regulation | null>(null)
  const [removingReg, setRemovingReg] = useState<{ basis: CertBasis; regulation: Regulation } | null>(null)

  const regById = useMemo(() => new Map(regulations.map((r) => [r.id, r])), [regulations])
  const regsOf = (b: CertBasis) => regsIn(b, regById)

  const selected = bases.find((b) => b.id === id) ?? null
  const activeTab = TABS.find((t) => TAB_KEY[t] === searchParams.get('tab')) ?? 'Regulations'
  const tab = TAB_KEY[activeTab]
  const usedBy = Object.values(projectBasis).filter((v) => v === id).length
  /* The Regulations tab's slice (`?view=`), so the duplicate warning can open
     the tab on exactly those rules. */
  const ruleView = searchParams.get('view') ?? 'all'
  const openRules = (view: string) => setSearchParams({ tab: 'regulations', view }, { replace: true })
  /* Header search for the Regulations tab ("Tabbed page layout", COMPONENTS.md);
     cleared when another basis opens. */
  const [ruleQuery, setRuleQuery] = useState('')
  /* All / Active / Inactive, beside the search; opens on All (user decision,
     2026-11-02) because inactive rules are still part of the basis. */
  const [ruleStatus, setRuleStatus] = useState<RuleStatus>('all')
  useEffect(() => { setRuleQuery(''); setRuleStatus('all') }, [id])
  const selectedRules = useMemo(() => (selected ? regsIn(selected, regById) : []), [selected, regById])
  const activeCount = selectedRules.filter((r) => r.active).length
  const select = (b: CertBasis) => {
    navigate(`/gcp/cert-bases/${b.id}`)
  }
  const trimCount = trimming ? regsOf(trimming).length - keepLatest(trimming, regsOf(trimming)).length : 0

  if (location.pathname.endsWith('/edit') && selected) return <CertBasisDrawer mode="edit" initial={selected} onClose={() => navigate(`/gcp/cert-bases/${selected.id}`)} onSubmit={(b) => { saveBasis(b); navigate(`/gcp/cert-bases/${b.id}`) }} />
  if (editingBasis) return <CertBasisDrawer mode="edit" initial={editingBasis} onClose={() => setEditingBasis(null)} onSubmit={(b) => { saveBasis(b); setEditingBasis(null); select(b) }} />

  return (
    <AppShell
      activeItem="General Certification"
      activeChild="Certification Basis"
      title={selected?.aircraftModel || "Certification Basis not found"}
      /* Without a basis there is no identity card to carry the <h1>, so the
         header keeps the title instead of the back link. */
      headerLeft={selected ? <BackLink to="/gcp/cert-bases" label="Go back to all certification bases" /> : undefined}
      headerActions={tab === 'regulations' && selectedRules.length > 0 && <>
        <SegmentedControl ariaLabel="Show rules" value={ruleStatus} onChange={setRuleStatus} options={[
          { value: 'all', label: 'All', count: selectedRules.length },
          { value: 'active', label: 'Active', count: activeCount },
          { value: 'inactive', label: 'Inactive', count: selectedRules.length - activeCount },
        ]} />
        <div className="min-w-0 max-w-full" style={{ width: 400 }}>
          <Input id="basis-rules-search" aria-label="Search rules in this basis" size="sm" value={ruleQuery} onChange={(e) => setRuleQuery(e.target.value)}
            placeholder="Search rules by section, amendment or title..." leadingIcon={<Search size={16} />} />
        </div>
      </>}
    >
      <GcpDataGate>
          {selected ? (
            <div className="grid min-w-0 content-start gap-lg">
                <CertBasisIdentityCard basis={selected} rules={selectedRules.length} usedBy={usedBy}
                  onEdit={() => setEditingBasis(selected)} onImport={() => setImportOpen(true)} onDelete={() => setDeletingBasis(selected)} />
                <DuplicateRulesAlert regs={selectedRules} onShow={() => openRules('duplicates')} onKeepLatest={() => setTrimming(selected)} />
                <SectionTabs tabs={TABS} active={activeTab} onChange={(t) => setSearchParams({ tab: TAB_KEY[t] }, { replace: true })}
                  ariaLabel="Certification basis sections" counts={{ Regulations: selected.regulationIds.length, 'Used By': usedBy }} />
                {tab === 'regulations' && (selectedRules.length === 0 ? (
                  <div className="rounded-sm border border-border-default bg-neutral-25">
                    <EmptyState icon={<ListTree size={48} strokeWidth={1.5} />} title="No regulations yet"
                      description="Build this basis's rules in Certification Projects' Certification Basis step, or edit it here." />
                  </div>
                ) : (
                  <CertBasisTable basis={selected} rules={selectedRules} pool={regulations} view={ruleView} onViewChange={openRules} query={ruleQuery} status={ruleStatus}
                    onView={(r, list) => { setViewing(r); setViewingList(list) }} onEditRegulation={setEditing}
                    onRemove={(regulation) => setRemovingReg({ basis: selected, regulation })} />
                ))}
                {tab === 'projects' && (
                  <section aria-label={`Used By in ${selected.aircraftModel}`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
                    <CertBasisUsage basisId={selected.id} />
                  </section>
                )}
            </div>
          ) : (
            <div className="rounded-sm border border-border-default bg-neutral-25">
              <EmptyState icon={<FolderKanban size={48} strokeWidth={1.5} />} title="Certification basis not found"
                description="This Master may have been deleted, or the link is out of date."
                action={<Button variant="secondary" onClick={() => navigate('/gcp/cert-bases')}>Back to Certification Basis</Button>} />
            </div>
          )}
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
        <RegulationDetailDrawer regulation={viewing} sequence={viewingList} basisIds={selected ? new Set(selected.regulationIds) : undefined}
          onClose={() => setViewing(null)} onEdit={(r) => { setEditing(r); setViewing(null) }} />
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
