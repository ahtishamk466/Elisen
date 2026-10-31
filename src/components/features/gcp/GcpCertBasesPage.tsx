import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, Pencil, Plus, Search, Download, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { AutoLoadFooter } from '@/components/patterns/AutoLoadFooter'
import { useInfiniteReveal } from '@/components/patterns/useInfiniteReveal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import type { CertBasis } from '@/types/gcp'
import { GcpDataGate } from './GcpDataGate'
import { CertBasisImportDrawer } from './CertBasisImportDrawer'
import { CertBasisDrawer } from './CertBasisDrawer'

export function GcpCertBasesPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const bases = useGcpFlowStore((s) => s.bases)
  const links = useGcpFlowStore((s) => s.projectBasis)
  const [query, setQuery] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [deleting, setDeleting] = useState<CertBasis | null>(null)
  const filtered = bases.filter((b) => `${b.aircraftModel} ${b.description ?? ''} ${b.tcdsNumber}`.toLowerCase().includes(query.toLowerCase().trim()))
  const { sorted, sort, setSort } = useTableSort(filtered, { code: (b) => b.aircraftModel, description: (b) => b.description, rules: (b) => b.regulationIds.length, projects: (b) => Object.values(links).filter((id) => id === b.id).length })
  const { visibleCount, loadingMore, loadMore } = useInfiniteReveal(sorted.length, 25)
  const open = (b: CertBasis) => navigate(`/gcp/cert-bases/${b.id}`)
  // Preserve legacy bookmarks while keeping list selection out of the new workspace.
  const bookmarked = bases.find((b) => b.id === params.get('basis'))
  if (bookmarked) return <LegacyBasisRedirect id={bookmarked.id} />
  return <AppShell activeItem="GCP" activeChild="Certification Basis" title="Certification Basis" description="Reusable Masters and their exact regulation amendments."
    headerActions={<><div className="min-w-0 max-w-full" style={{ width: 400 }}><Input id="basis-search" aria-label="Search certification bases" size="sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by code, description or TCDS..." leadingIcon={<Search size={16} />} /></div><Button variant="secondary" leadingIcon={<Download size={16} />} onClick={() => setImportOpen(true)}>Import</Button><Button leadingIcon={<Plus size={16} />} onClick={() => navigate('/gcp/cert-bases/new')}>Add</Button></>}>
    <GcpDataGate><div className="grid gap-lg">
      {sorted.length === 0 ? <EmptyState title={query ? 'No certification bases match your search' : 'No certification bases yet'} description="Create a reusable Master, then add regulations when ready." /> :
      <div className="overflow-x-auto rounded-sm border border-border-default bg-neutral-25"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border-default bg-neutral-50">
        {(['code','description','rules','projects'] as const).map((key) => <SortableTh key={key} sortKey={key} sort={sort} onSortChange={setSort} className="px-lg py-base">{{code:'Code',description:'Description',rules:'Regulations',projects:'Used By'}[key]}</SortableTh>)}<th className="px-lg py-base">Actions</th>
      </tr></thead><tbody>{sorted.slice(0,visibleCount).map((b) => <tr key={b.id} className="border-b border-border-default hover:bg-neutral-50"><td className="px-lg py-base"><Button variant="tertiary" onClick={() => open(b)}>{b.aircraftModel}</Button></td><td className="px-lg py-base">{b.description || '—'}</td><td className="px-lg py-base">{b.regulationIds.length}</td><td className="px-lg py-base">{Object.values(links).filter((id) => id === b.id).length}</td><td className="px-lg py-base"><ActionsMenu ariaLabel={`Actions for ${b.aircraftModel}`} items={[{label:'View',icon:<Eye size={16}/>,onSelect:() => open(b)},{label:'Edit',icon:<Pencil size={16}/>,onSelect:() => navigate(`/gcp/cert-bases/${b.id}/edit`)},{label:'Delete',icon:<Trash2 size={16}/>,tone:'danger',onSelect:() => setDeleting(b)}]} /></td></tr>)}</tbody></table><AutoLoadFooter total={sorted.length} visibleCount={visibleCount} loading={loadingMore} onLoadMore={loadMore} itemLabel="bases" /></div>}
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
