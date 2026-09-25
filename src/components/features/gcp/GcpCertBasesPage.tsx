import { useState } from 'react'
import { Download, Eye, FolderKanban, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useSyncedScroll } from '@/components/patterns/useSyncedScroll'
import { proportionalWidths } from '@/lib/tableWidths'
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

type SortKey = 'basis' | 'section' | 'amdt' | 'title' | 'active'

const COLUMNS: { label: string; sort: SortKey; width: number }[] = [
  { label: 'Cert Basis', sort: 'basis', width: 190 },
  { label: 'Regulation Section', sort: 'section', width: 150 },
  { label: 'Regulation Amdt', sort: 'amdt', width: 130 },
  { label: 'Regulation Title', sort: 'title', width: 320 },
  { label: 'Status', sort: 'active', width: 110 },
]
const ACTIONS_WIDTH = 64
const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0) + ACTIONS_WIDTH
/** `%` per column in the same proportion as the pixel weights above, so a
    screen wider than the table grows all five columns instead of leaving a
    blank void past Actions (client instruction, 2026-09-25 — see
    `lib/tableWidths.ts`). */
const COL_WIDTHS = proportionalWidths([...COLUMNS.map((c) => c.width), ACTIONS_WIDTH])

/** One row per basis↔regulation link, or one placeholder row (`regulation:
    null`) for a basis with none yet — never nothing at all, so a basis
    someone just created (or cleared every regulation off of) still has a
    row to manage it from. */
type Row = { basis: CertBasis; regulation: Regulation | null }

/**
 * Cert Basis, as **one flat table** — client instruction, 2026-09-25,
 * pointed at the legacy `cert-basis/index` screen: a plain, ungrouped list
 * (there, every basis↔regulation link across the whole fleet, 14k+ rows),
 * not the stacked per-aircraft group-header banners this page used to have
 * (those were themselves a client instruction, 2026-09-24 — replacing an
 * earlier master–detail rail+pane — but read as "boxy" and not "one table"
 * once there was real multi-basis data to look at). The legacy screen's own
 * data lives behind a login this app never performs, so this rebuilds its
 * *shape* — one sortable, flat table, this app's own components and tokens,
 * not its dated grid chrome — rather than its literal rows.
 *
 * Every row still carries which basis it belongs to (**Cert Basis** column:
 * aircraft model, TCDS/"Project-specific" underneath) instead of losing
 * that identity the way a truly flat re-list of "every regulation" would.
 * Basis-level actions (**Edit Cert Basis** / **Delete Cert Basis**) ride in
 * every row's own `ActionsMenu` alongside that row's regulation actions —
 * the same "mix the parent record's actions into the child row's menu"
 * shape `DocumentsPage` already uses (`Edit {kind}` / `Edit revision` /
 * `Delete {kind}` together). Import is still a header action, not a
 * per-basis one — the legacy tool builds a basis's rule set from an
 * FAA/TCCA export in one pass; linking a basis to a project is GCP
 * Projects' own Certification Basis step, not this page.
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

  /* One row per link, or one placeholder row for a basis with none — see
     `Row` above. Genuinely flat now: every row sorts against every other
     row in the table, not within its own basis, which is the whole point
     of "one table" over the old grouped layout. */
  const rows: Row[] = filtered.flatMap((b): Row[] => {
    const regs = regsOf(b)
    return regs.length > 0 ? regs.map((r) => ({ basis: b, regulation: r })) : [{ basis: b, regulation: null }]
  })
  const { sorted, sort, setSort } = useTableSort(rows, {
    basis: (row) => row.basis.aircraftModel,
    section: (row) => row.regulation?.section,
    amdt: (row) => row.regulation?.amdt,
    title: (row) => row.regulation?.title,
    active: (row) => row.regulation?.active,
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
                {COLUMNS.map((c, i) => <col key={c.label} style={{ width: COL_WIDTHS[i] }} />)}
                <col style={{ width: COL_WIDTHS[COLUMNS.length] }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border-default bg-neutral-50">
                  {COLUMNS.map((c) => (
                    <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                      className="px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                  ))}
                  <SortableTh className="px-lg py-base text-sm font-semibold text-text-secondary">Actions</SortableTh>
                </tr>
              </thead>
            </table>
          </div>
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-scroll scrollbar-none" onScroll={onBodyScroll}>
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: TABLE_WIDTH }}>
              <caption className="sr-only">Every Cert Basis and its regulations, one row per link</caption>
              <colgroup>
                {COLUMNS.map((c, i) => <col key={c.label} style={{ width: COL_WIDTHS[i] }} />)}
                <col style={{ width: COL_WIDTHS[COLUMNS.length] }} />
              </colgroup>
              <tbody>
                {sorted.map(({ basis: b, regulation: r }) => (
                  <tr key={r ? `${b.id}-${r.id}` : `empty-${b.id}`} className="border-b border-border-default last:border-b-0">
                    <td className="px-lg py-base">
                      <span className="block truncate text-sm font-semibold text-text-primary">{b.aircraftModel}</span>
                      <span className="block truncate text-xs text-text-muted">
                        {b.tcdsNumber ? `TCDS ${b.tcdsNumber}` : 'Project-specific'}
                      </span>
                    </td>
                    {r ? (
                      <>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.section}</td>
                        <td className="whitespace-nowrap px-lg py-base text-sm text-text-primary">{r.amdt}</td>
                        <td className="px-lg py-base text-sm text-text-primary"><Truncate lines={2}>{r.title}</Truncate></td>
                        <td className="px-lg py-base">
                          <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Active' : 'Inactive'}</Badge>
                        </td>
                      </>
                    ) : (
                      <td colSpan={4} className="px-lg py-base text-sm text-text-muted">No regulations yet.</td>
                    )}
                    <td className="px-lg py-base">
                      <ActionsMenu
                        ariaLabel={r ? `Actions for ${r.section} · ${r.amdt}` : `Actions for cert basis ${b.aircraftModel}`}
                        items={[
                          /* Regulation actions only exist for a real link row;
                             the basis's own Edit/Delete are on every row of
                             that basis regardless (including the placeholder),
                             the same "parent actions ride in the child row's
                             menu" shape `DocumentsPage` already uses. */
                          ...(r
                            ? [
                                { label: 'View', icon: <Eye size={16} />, onSelect: () => setViewing(r) },
                                { label: 'Edit regulation', icon: <Pencil size={16} />, onSelect: () => setEditing(r) },
                                { label: 'Remove from basis', icon: <Trash2 size={16} />, onSelect: () => setRemovingReg({ basis: b, regulation: r }), tone: 'danger' as const },
                              ]
                            : []),
                          { label: 'Edit Cert Basis', icon: <Pencil size={16} />, onSelect: () => setBasisDrawer({ mode: 'edit', basis: b }) },
                          { label: 'Delete Cert Basis', icon: <Trash2 size={16} />, onSelect: () => setDeletingBasis(b), tone: 'danger' as const },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
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
