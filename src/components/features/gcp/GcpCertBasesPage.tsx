import { useState } from 'react'
import { Download, Eye, FolderKanban, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { Truncate } from '@/components/patterns/Truncate'
import { useTableSort } from '@/components/patterns/useTableSort'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import { useGcpFlowStore } from '@/stores/gcpFlowStore'
import { useTccaStore } from '@/stores/tccaStore'
import { codeName, subpartParts, subsectionParts } from '@/lib/gcpDisplay'
import type { CertBasis, Regulation } from '@/types/gcp'
import { CertBasisDrawer } from './CertBasisDrawer'
import { CertBasisImportDrawer } from './CertBasisImportDrawer'
import { RegulationDetailDrawer } from './RegulationDetailDrawer'
import { RegulationDrawer } from './RegulationDrawer'

const COLUMNS: { label: string; sort: 'section' | 'amdt' | 'title' | 'active'; width: number }[] = [
  { label: 'Regulation Section', sort: 'section', width: 150 },
  { label: 'Regulation Amdt', sort: 'amdt', width: 130 },
  { label: 'Regulation Title', sort: 'title', width: 320 },
  { label: 'Status', sort: 'active', width: 110 },
]
const ACTIONS_WIDTH = 64
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0) + ACTIONS_WIDTH

/**
 * Cert Basis, as one table — client instruction, 2026-09-24, replacing the
 * earlier master–detail (a rail, and the selected basis's regulations in a
 * separate pane beside it): two sections reading as two separate screens,
 * when the client wanted one. Every basis's regulations now sit in the same
 * table, one basis after another, each introduced by its own group row
 * (name, TCDS/"Project-specific", regulation count, and that basis's own
 * Edit/Delete — the only place those two actions live now that there's no
 * rail row to carry them) followed by its Regulation Section, Regulation
 * Amdt, Regulation Title, Status, Actions rows. Sorting is one shared state
 * (the frozen header's own `SortableTh`s) applied within each group rather
 * than across the whole table — clicking "Regulation Section" reorders every
 * basis's own rows, it doesn't interleave one basis's rows into another's.
 * Import is a header action here, not a per-basis one — the legacy tool
 * builds a basis's rule set from an FAA/TCCA export in one pass; linking a
 * basis to a project is GCP Projects' own Certification Basis step, not
 * this page.
 */
export function GcpCertBasesPage() {
  const bases = useGcpFlowStore((s) => s.bases)
  const saveBasis = useGcpFlowStore((s) => s.saveBasis)
  const regulations = useGcpStore((s) => s.regulations)
  const tccaProjects = useTccaStore((s) => s.tccaProjects)
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const updateRegulation = useGcpStore((s) => s.updateRegulation)

  const [query, setQuery] = useState('')
  const [basisDrawer, setBasisDrawer] = useState<{ mode: 'create' | 'edit'; basis?: CertBasis } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [deletingBasis, setDeletingBasis] = useState<CertBasis | null>(null)
  const [viewing, setViewing] = useState<Regulation | null>(null)
  const [editing, setEditing] = useState<Regulation | null>(null)
  const [removingReg, setRemovingReg] = useState<{ basis: CertBasis; regulation: Regulation } | null>(null)

  const regsOf = (b: CertBasis) => b.regulationIds
    .map((id) => regulations.find((r) => r.id === id))
    .filter((r): r is Regulation => !!r)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? bases.filter((b) =>
        `${b.aircraftModel} ${b.tcdsNumber}`.toLowerCase().includes(q)
        || regsOf(b).some((r) => `${r.section} ${r.amdt} ${r.title}`.toLowerCase().includes(q)))
    : bases

  /* One shared sort, applied within each basis's own rows — sorting every
     visible regulation together, then filtering each group back down to its
     own basis, keeps each group's relative order correct without a
     `useTableSort` instance per basis (hooks can't run in a loop). */
  const allRegs = filtered.flatMap((b) => regsOf(b).map((r) => ({ ...r, basisId: b.id })))
  const { sorted, sort, setSort } = useTableSort(allRegs, {
    section: (r) => r.section,
    amdt: (r) => r.amdt,
    title: (r) => r.title,
    active: (r) => r.active,
  })
  const { headerRef, onBodyScroll } = useSyncedScroll()

  const removeFromBasis = (basis: CertBasis, regId: string) => {
    saveBasis({ ...basis, regulationIds: basis.regulationIds.filter((id) => id !== regId) })
  }

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Cert Basis"
      title="Cert Basis"
      description="Each aircraft's rule set: which regulation, at which amendment."
      fill
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 280 }}>
            <label htmlFor="cert-bases-search" className="sr-only">Search Cert Basis and their regulations</label>
            <Input id="cert-bases-search" size="sm" leadingIcon={<Search size={16} />}
              placeholder="Search by aircraft, TCDS or regulation..."
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button variant="secondary" leadingIcon={<Download size={16} />} onClick={() => setImportOpen(true)}>
            Import
          </Button>
          <Button leadingIcon={<Plus size={16} />} onClick={() => setBasisDrawer({ mode: 'create' })}>
            Add Cert Basis
          </Button>
        </>
      }
    >
      {toast && <div className="mb-lg shrink-0"><Alert tone="info" title={toast} /></div>}

      {bases.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<FolderKanban size={48} strokeWidth={1.5} />}
            title="No Cert Basis yet"
            description="Add one for an aircraft's type certificate, or import a regulation export to build one automatically."
            action={<Button leadingIcon={<Plus size={16} />} onClick={() => setBasisDrawer({ mode: 'create' })}>Add Cert Basis</Button>}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border border-border-default bg-neutral-25">
          <EmptyState
            icon={<FolderKanban size={48} strokeWidth={1.5} />}
            title="No Cert Basis match your search"
            description="Try another aircraft, TCDS or regulation."
            action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
          {/* Frozen header, own table, full width — a scrollbar never runs
              alongside a table's header (docs/COMPONENTS.md). `headerRef` +
              `onBodyScroll` keep it in horizontal sync with the body. */}
          <div ref={headerRef} className="shrink-0 overflow-x-hidden overflow-y-scroll scrollbar-none">
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
              <colgroup>
                {COLUMNS.map((c) => <col key={c.label} style={{ width: c.width }} />)}
                <col style={{ width: ACTIONS_WIDTH }} />
                {/* Soaks up whatever's left past `TABLE_WIDTH` on a screen
                    wider than the table's real content, instead of leaving
                    it as dead space to the card's right (client instruction,
                    2026-09-24) — every other column keeps its own explicit
                    width regardless, since `table-fixed` only redistributes
                    into columns without one. */}
                <col />
              </colgroup>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {COLUMNS.map((c) => (
                    <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                      className="px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                  ))}
                  <SortableTh className="px-lg py-base text-sm font-semibold text-text-secondary">Actions</SortableTh>
                  <th aria-hidden />
                </tr>
              </thead>
            </table>
          </div>
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll scrollbar-none" onScroll={onBodyScroll}>
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
              <caption className="sr-only">Every Cert Basis and its regulations</caption>
              <colgroup>
                {COLUMNS.map((c) => <col key={c.label} style={{ width: c.width }} />)}
                <col style={{ width: ACTIONS_WIDTH }} />
                <col />
              </colgroup>
              {filtered.map((b) => {
                const count = regsOf(b).length
                const basisRegs = sorted.filter((r) => r.basisId === b.id)
                return (
                  <tbody key={b.id} className="border-b border-border-default last:border-b-0">
                    <tr className="bg-neutral-50">
                      <td colSpan={COLUMNS.length} className="px-lg py-base">
                        <div className="flex min-w-0 items-center gap-sm">
                          <span className="truncate text-sm font-semibold text-text-primary">{b.aircraftModel}</span>
                          <span className="shrink-0 text-xs text-text-muted">
                            {b.tcdsNumber ? `TCDS ${b.tcdsNumber}` : 'Project-specific'} · {count} regulation{count === 1 ? '' : 's'}
                          </span>
                        </div>
                      </td>
                      <td colSpan={2} className="bg-neutral-50 px-lg py-base">
                        <ActionsMenu
                          ariaLabel={`Actions for cert basis ${b.aircraftModel}`}
                          items={[
                            { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setBasisDrawer({ mode: 'edit', basis: b }) },
                            { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingBasis(b), tone: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                    {basisRegs.length === 0 ? (
                      <tr className="border-b border-border-default last:border-b-0">
                        <td colSpan={COLUMNS.length + 2} className="px-lg py-base text-sm text-text-muted">
                          No regulations yet.
                        </td>
                      </tr>
                    ) : (
                      basisRegs.map((r) => (
                        <tr key={r.id} className="border-b border-border-default last:border-b-0">
                          <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.section}</td>
                          <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.amdt}</td>
                          <td className="px-lg py-base text-sm text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
                          <td className="px-lg py-base">
                            <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</Badge>
                          </td>
                          <td className="px-lg py-base">
                            <ActionsMenu
                              ariaLabel={`Actions for ${r.section} · ${r.amdt}`}
                              items={[
                                { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewing(r) },
                                { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setEditing(r) },
                                { label: 'Remove', icon: <Trash2 size={16} />, onSelect: () => setRemovingReg({ basis: b, regulation: r }), tone: 'danger' },
                              ]}
                            />
                          </td>
                          <td aria-hidden />
                        </tr>
                      ))
                    )}
                  </tbody>
                )
              })}
            </table>
          </div>
        </div>
      )}

      {basisDrawer && (
        <CertBasisDrawer
          mode={basisDrawer.mode}
          initial={basisDrawer.basis}
          onClose={() => setBasisDrawer(null)}
          onSubmit={(b) => saveBasis(b)}
        />
      )}

      {importOpen && (
        <CertBasisImportDrawer
          onClose={() => setImportOpen(false)}
          onImport={(file, projectId) => {
            const project = tccaProjects.find((t) => t.id === projectId)
            setToast(`"${file.name}" received for ${project?.number ?? 'the selected project'}. Cert basis import needs a real backend, so nothing was actually processed yet.`)
          }}
        />
      )}

      {deletingBasis && (
        <ConfirmDialog
          open
          title={`Delete "${deletingBasis.aircraftModel}"?`}
          description={`${regsOf(deletingBasis).length} regulation${regsOf(deletingBasis).length === 1 ? '' : 's'} allocated to this basis will no longer be attached to it. This cannot be undone.`}
          confirmLabel="Delete"
          tone="danger"
          onConfirm={() => {
            saveBasis({ ...deletingBasis, regulationIds: [] })
            useGcpFlowStore.setState((s) => ({ bases: s.bases.filter((b) => b.id !== deletingBasis.id) }))
            setDeletingBasis(null)
          }}
          onCancel={() => setDeletingBasis(null)}
        />
      )}

      {viewing && (
        <RegulationDetailDrawer
          regulation={viewing}
          subpart={codeName(subpartParts(viewing.subpartCode, subparts))}
          subsection={codeName(subsectionParts(viewing.subsectionCode, subsections))}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null) }}
        />
      )}

      {editing && (
        <RegulationDrawer
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(r) => updateRegulation(r.id, r)}
        />
      )}

      {removingReg && (
        <ConfirmDialog
          open
          title={`Remove "${removingReg.regulation.section} · ${removingReg.regulation.amdt}" from this basis?`}
          description="The regulation stays in the library; only its place in this cert basis is removed."
          confirmLabel="Remove"
          tone="danger"
          onConfirm={() => { removeFromBasis(removingReg.basis, removingReg.regulation.id); setRemovingReg(null) }}
          onCancel={() => setRemovingReg(null)}
        />
      )}
    </AppShell>
  )
}
