import { FrozenTable } from '@/components/patterns/FrozenTable'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Pencil, Plus, Search, Download, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortMenu } from '@/components/patterns/SortMenu'
import { SortableTh } from '@/components/patterns/SortableTh'
import { StackedCell } from '@/components/patterns/StackedCell'
import { useTableSort } from '@/components/patterns/useTableSort'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { duplicateSections } from '@/lib/certBasisLevel'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import type { CertBasis, Regulation } from '@/types/gcp'
import { GcpDataGate } from './GcpDataGate'
import { CertBasisImportDrawer } from './CertBasisImportDrawer'
import { CertBasisDrawer } from './CertBasisDrawer'

/** Header cell: the Projects List heading style (small, semibold, secondary). */
const TH = 'px-base py-base text-sm font-semibold text-text-secondary'

export function GcpCertBasesPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const bases = useGcpFlowStore((s) => s.bases)
  const links = useGcpFlowStore((s) => s.projectBasis)
  const [query, setQuery] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [deleting, setDeleting] = useState<CertBasis | null>(null)
  const filtered = bases.filter((b) => `${b.aircraftModel} ${b.description ?? ''} ${b.tcdsNumber}`.toLowerCase().includes(query.toLowerCase().trim()))
  const usage = (b: CertBasis) => Object.values(links).filter((id) => id === b.id).length
  const regulations = useGcpStore((s) => s.regulations)
  /* Bases carrying a section at more than one amendment (13 of the 40 legacy
     bases) are flagged on their row, as the old basis rail did. */
  const duplicateCount = useMemo(() => {
    const byId = new Map(regulations.map((r) => [r.id, r]))
    return new Map(bases.map((b) => [b.id, duplicateSections(b.regulationIds.map((id) => byId.get(id)).filter((r): r is Regulation => !!r)).length]))
  }, [bases, regulations])
  const duplicateLabel = (b: CertBasis) => {
    const n = duplicateCount.get(b.id) ?? 0
    return n > 0 ? `${n} duplicate section${n === 1 ? '' : 's'}` : ''
  }
  const { sorted, sort, setSort } = useTableSort(filtered, { code: (b) => b.aircraftModel, description: (b) => b.description, tcds: (b) => b.tcdsNumber, rules: (b) => b.regulationIds.length, projects: usage })
  const { visibleCount, loadingMore, loadMore } = useInfiniteReveal(sorted.length, 25)
  const open = (b: CertBasis) => navigate(`/gcp/cert-bases/${b.id}`)
  // Preserve legacy bookmarks while keeping list selection out of the new workspace.
  const bookmarked = bases.find((b) => b.id === params.get('basis'))
  if (bookmarked) return <LegacyBasisRedirect id={bookmarked.id} />
  return <AppShell activeItem="GCP" activeChild="Certification Basis" title="Certification Basis" description="Shared certification bases and the regulations each one applies."
    headerActions={<><div className="min-w-0 max-w-full" style={{ width: 400 }}><Input id="basis-search" aria-label="Search certification bases" size="sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by code, description or TCDS..." leadingIcon={<Search size={16} />} /></div><Button variant="secondary" leadingIcon={<Download size={16} />} onClick={() => setImportOpen(true)}>Import</Button><Button leadingIcon={<Plus size={16} />} onClick={() => navigate('/gcp/cert-bases/new')}>Add</Button></>}>
    <GcpDataGate><div className="grid gap-lg">
      {sorted.length === 0 ? <EmptyState title={query ? 'No certification bases match your search' : 'No certification bases yet'} description="Create a reusable Master, then add regulations when ready." /> :
      <div className="rounded-sm border border-border-default bg-neutral-25"><FrozenTable footer={<AutoLoadFooter total={sorted.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="bases" />} columns={['auto', 160, 130, 110, 64]} minWidth={860}
              columnLabels={['Basis', 'TCDS', 'Regulations', 'Used By', 'Actions']} caption="Certification bases"
              tableClassName="w-full text-left text-sm" header={<thead><tr className="border-b border-border-default bg-neutral-50">
        {/* Code leads, as on Projects List: it is how a basis is asked for, with its description under it as the line that confirms the row. */}
        <SortableTh ownsKeys={['code', 'description']} sort={sort} onSortChange={setSort} className={TH}><SortMenu label="Basis" options={[{ key: 'code', label: 'Code' }, { key: 'description', label: 'Description' }]} sort={sort} onChange={setSort} /></SortableTh>
        {(['tcds','rules','projects'] as const).map((key) => <SortableTh key={key} sortKey={key} sort={sort} onSortChange={setSort} className={TH}>{{tcds:'TCDS',rules:'Regulations',projects:'Used By'}[key]}</SortableTh>)}<th className={TH}>Actions</th>
      </tr></thead>}><tbody>{sorted.slice(0,visibleCount).map((b) => <tr key={b.id} onClick={() => open(b)} className="cursor-pointer border-b border-border-default transition-colors duration-fast hover:bg-accent-subtle">
        <td className="px-base py-base"><StackedCell identifier={b.aircraftModel} detail={b.description || '—'} trailing={duplicateLabel(b) ? <Badge tone="warning">{duplicateLabel(b)}</Badge> : undefined} onClick={() => open(b)} /></td>
        <td className="truncate px-base py-base text-sm text-text-primary">{b.tcdsNumber || '—'}</td>
        <td className="px-base py-base text-sm tabular-nums text-text-primary">{b.regulationIds.length}</td>
        <td className="px-base py-base text-sm tabular-nums text-text-primary">{usage(b)}</td>
        <td className="px-base py-base" onClick={(e) => e.stopPropagation()}><ActionsMenu ariaLabel={`Actions for ${b.aircraftModel}`} items={[{label:'View',icon:<Eye size={16}/>,onSelect:() => open(b)},{label:'Edit',icon:<Pencil size={16}/>,onSelect:() => navigate(`/gcp/cert-bases/${b.id}/edit`)},{label:'Delete',icon:<Trash2 size={16}/>,tone:'danger',onSelect:() => setDeleting(b)}]} /></td></tr>)}</tbody></FrozenTable></div>}
    </div></GcpDataGate>
    {importOpen && <CertBasisImportDrawer onClose={() => setImportOpen(false)} onImported={open} />}
    <ConfirmDialog open={!!deleting} title="Delete certification basis?" description="This removes the Master and its project associations. Regulations and existing compliance plans remain available." confirmLabel="Delete Basis" tone="danger" onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) useGcpFlowStore.getState().removeBasis(deleting.id); setDeleting(null) }} />
  </AppShell>
}

function LegacyBasisRedirect({ id }: { id: string }) {
  const navigate = useNavigate()
  useEffect(() => { navigate(`/gcp/cert-bases/${id}`, { replace: true }) }, [id, navigate])
  return null
}

export function CertBasisCreatePage() {
  const navigate = useNavigate()
  return <GcpDataGate><CertBasisDrawer mode="create" onClose={() => navigate('/gcp/cert-bases')} onSubmit={(b) => { useGcpFlowStore.getState().saveBasis(b); navigate(`/gcp/cert-bases/${b.id}`) }} /></GcpDataGate>
}
