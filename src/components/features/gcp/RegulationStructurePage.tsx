import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layers, ListTree, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/patterns/AppShell'
import { EmptyState } from '@/components/patterns/EmptyState'
import { SortableTh } from '@/components/patterns/SortableTh'
import { useTableSort } from '@/components/patterns/useTableSort'
import { ActionsMenu } from '@/components/patterns/ActionsMenu'
import { ConfirmDialog } from '@/components/patterns/ConfirmDialog'
import { Truncate } from '@/components/patterns/Truncate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useGcpStore } from '@/stores/gcpStore'
import { subpartCodeOfSubsection, titleCaseName } from '@/lib/gcpDisplay'
import type { Subpart, Subsection } from '@/types/gcp'
import { GcpRegulationsTabs } from './GcpRegulationsTabs'
import { SubpartDrawer } from './SubpartDrawer'
import { SubsectionDrawer } from './SubsectionDrawer'

const COLUMNS: { label: string; sort?: 'id' | 'code' | 'title' | 'active'; width: number }[] = [
  { label: 'ID', sort: 'id', width: 64 },
  { label: 'Code', sort: 'code', width: 100 },
  { label: 'Title', sort: 'title', width: 260 },
  { label: 'Part 23', width: 110 },
  { label: 'Part 25', width: 110 },
  { label: 'Part 27', width: 110 },
  { label: 'Part 29', width: 110 },
  { label: 'Active', sort: 'active', width: 92 },
  { label: 'Actions', width: 80 },
]

/**
 * GCP → Regulations → Structure, as one **hierarchical** screen instead of two
 * tabs: every subpart on a rail at the left — the parent level — with the
 * selected subpart's subsections nested in the table at the right, the same
 * master–detail shape Groups uses.
 *
 * The relationship is derived, not stored: the legacy data carries no explicit
 * link, but every subsection's code carries its subpart's letters as a prefix
 * (B04 belongs to B, C14 to C — verified against all 20 rows). Selecting a
 * subpart is what answers "which subsections belong to it" at a glance,
 * instead of scanning a second table by hand.
 */
export function RegulationStructurePage() {
  const subparts = useGcpStore((s) => s.subparts)
  const subsections = useGcpStore((s) => s.subsections)
  const regulations = useGcpStore((s) => s.regulations)
  const addSubpart = useGcpStore((s) => s.addSubpart)
  const updateSubpart = useGcpStore((s) => s.updateSubpart)
  const removeSubpart = useGcpStore((s) => s.removeSubpart)
  const addSubsection = useGcpStore((s) => s.addSubsection)
  const updateSubsection = useGcpStore((s) => s.updateSubsection)
  const removeSubsection = useGcpStore((s) => s.removeSubsection)

  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [subpartDrawer, setSubpartDrawer] = useState<{ mode: 'create' | 'edit'; subpart?: Subpart } | null>(null)
  const [subsectionDrawer, setSubsectionDrawer] = useState<{ mode: 'create' | 'edit'; subsection?: Subsection } | null>(null)
  const [deletingSubpart, setDeletingSubpart] = useState<Subpart | null>(null)
  const [deletingSubsection, setDeletingSubsection] = useState<Subsection | null>(null)
  const railRef = useRef<HTMLDivElement>(null)

  const subsectionsOf = (subpartCode: string) => subsections.filter((s) => subpartCodeOfSubsection(s.code) === subpartCode)
  const rulesUnderSubpart = (code: string) => regulations.filter((r) => r.subpartCode === code).length
  const rulesUnderSubsection = (code: string) => regulations.filter((r) => r.subsectionCode === code).length

  /** Search spans a subpart's own text *and* the subsections nested under it,
      so a subsection code or title finds the subpart that carries it. */
  const q = query.trim().toLowerCase()
  const filtered = q
    ? subparts.filter((sp) =>
        `${sp.code} ${sp.description}`.toLowerCase().includes(q)
        || subsectionsOf(sp.code).some((ss) => `${ss.code} ${ss.title}`.toLowerCase().includes(q)))
    : subparts

  /* Selection lives in the URL (?subpart=…) so a subpart is linkable. */
  const urlCode = searchParams.get('subpart')
  const selected = filtered.find((sp) => sp.code === urlCode) ?? filtered.find((sp) => sp.active) ?? filtered[0] ?? null
  const select = (sp: Subpart) => {
    const p = new URLSearchParams(searchParams)
    p.set('subpart', sp.code)
    setSearchParams(p, { replace: true })
  }

  useEffect(() => {
    railRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected?.code])

  const selectedSubsections = selected ? subsectionsOf(selected.code) : []
  const { sorted, sort, setSort } = useTableSort(selectedSubsections, {
    id: (s) => Number(s.id),
    code: (s) => s.code,
    title: (s) => s.title,
    active: (s) => s.active,
  })

  const deletingSubpartUse = deletingSubpart
    ? rulesUnderSubpart(deletingSubpart.code) + subsectionsOf(deletingSubpart.code).length
    : 0
  const deletingSubsectionUse = deletingSubsection ? rulesUnderSubsection(deletingSubsection.code) : 0

  return (
    <AppShell
      activeItem="GCP"
      activeChild="Regulations"
      title="Regulations"
      description="The rule library shared by every certification basis."
      fill
      headerActions={
        <>
          <div className="min-w-0" style={{ width: 320 }}>
            <label htmlFor="struct-search" className="sr-only">Search subparts and subsections</label>
            <Input id="struct-search" size="sm" leadingIcon={<Search size={16} />}
              placeholder="Search by subpart or subsection..."
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button size="md" leadingIcon={<Plus size={16} />} onClick={() => setSubpartDrawer({ mode: 'create' })}>
            Add New Subpart
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-lg">
        <GcpRegulationsTabs active="Structure" />

        {filtered.length === 0 ? (
          <div className="rounded-sm border border-border-default bg-neutral-25">
            <EmptyState
              icon={<Layers size={48} strokeWidth={1.5} />}
              title={query ? 'No subparts match your search' : 'No subparts yet'}
              description={query
                ? 'Try a subpart code, or a nested subsection code or title.'
                : 'Add the FAA subparts the rules are grouped under.'}
              action={query
                ? <Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>
                : <Button leadingIcon={<Plus size={16} />} onClick={() => setSubpartDrawer({ mode: 'create' })}>Add New Subpart</Button>}
            />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-lg laptop:grid-cols-[320px_minmax(0,1fr)]">
            {/* ------- The subpart rail — the parent level ------- */}
            <nav aria-label="Subparts" className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
              <div className="flex shrink-0 items-center gap-sm border-b border-border-default bg-neutral-50 px-base py-base">
                <span className="min-w-0 flex-1 text-xs font-semibold text-text-secondary">Subpart</span>
                <span className="shrink-0 text-xs font-semibold text-text-secondary">Subsections</span>
              </div>
              <div ref={railRef} className="min-h-0 flex-1 overflow-y-auto">
                <ul>
                  {filtered.map((sp) => {
                    const isSel = sp.code === selected?.code
                    const count = subsectionsOf(sp.code).length
                    return (
                      <li key={sp.id} className="border-b border-border-default last:border-b-0">
                        <button
                          type="button"
                          onClick={() => select(sp)}
                          aria-current={isSel ? 'true' : undefined}
                          className={`flex w-full items-center gap-sm border-l-2 px-base py-base text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-primary
                            ${isSel ? 'border-accent bg-neutral-100' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          <span className="grid min-w-0 flex-1 gap-xxss">
                            <span className={`flex items-center gap-sm truncate text-sm ${isSel ? 'font-semibold' : ''} ${sp.active ? 'text-text-primary' : 'text-text-muted'}`}>
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-xs font-bold text-accent">{sp.code}</span>
                              <Truncate lines={1}>{titleCaseName(sp.description)}</Truncate>
                            </span>
                            {!sp.active && <span className="block text-xs text-text-muted">Inactive</span>}
                          </span>
                          <span aria-hidden className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border border-border-default px-xs text-xs font-semibold tabular-nums text-text-secondary">
                            {count}
                          </span>
                          <span className="sr-only">
                            Subpart {sp.code}, {titleCaseName(sp.description)}, {count} subsection{count === 1 ? '' : 's'}{sp.active ? '' : ', inactive'}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </nav>

            {/* ------- The selected subpart's subsections — the child level ------- */}
            {selected && (
              <section aria-label={`Subpart ${selected.code}`} className="flex min-h-0 flex-col overflow-hidden rounded-sm border border-border-default bg-neutral-25">
                <header className="flex shrink-0 flex-wrap items-center gap-sm px-lg py-lg">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent-subtle text-sm font-bold text-accent">
                    {selected.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-text-primary">{titleCaseName(selected.description)}</h2>
                    <p className="text-xs text-text-muted">Sort {selected.sort} · {selectedSubsections.length} subsection{selectedSubsections.length === 1 ? '' : 's'} nested under this subpart</p>
                  </div>
                  <Badge tone={selected.active ? 'success' : 'neutral'}>{selected.active ? 'Active' : 'Inactive'}</Badge>
                  <ActionsMenu
                    ariaLabel={`Actions for subpart ${selected.code}`}
                    items={[
                      { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setSubpartDrawer({ mode: 'edit', subpart: selected }) },
                      { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingSubpart(selected), tone: 'danger' },
                    ]}
                  />
                </header>

                <div className="flex shrink-0 items-center justify-between gap-sm border-t border-border-default px-lg py-lg">
                  <div className="grid gap-xxss">
                    <h3 className="text-sm font-semibold text-text-primary">Subsections</h3>
                    <p className="text-xs text-text-muted">Nested under subpart {selected.code} — the rule ranges they cover in each Part.</p>
                  </div>
                  <Button size="sm" leadingIcon={<Plus size={14} />}
                    onClick={() => setSubsectionDrawer({ mode: 'create' })}>
                    Add Subsection
                  </Button>
                </div>

                {selectedSubsections.length === 0 ? (
                  <div className="border-t border-border-default">
                    <EmptyState
                      icon={<ListTree size={48} strokeWidth={1.5} />}
                      title="No subsections yet"
                      description={`No subsections are nested under subpart ${selected.code}.`}
                    />
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-auto border-t border-border-default">
                    <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 1030 }}>
                      <caption className="sr-only">Subsections under subpart {selected.code}</caption>
                      <thead>
                        <tr className="border-b border-border-default bg-neutral-50">
                          {COLUMNS.map((c) => (
                            <SortableTh key={c.label} sortKey={c.sort} sort={sort} onSortChange={setSort}
                              style={{ width: c.width }}
                              className="px-lg py-base text-sm font-semibold text-text-secondary">{c.label}</SortableTh>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((ss) => (
                          <tr key={ss.id} className="border-b border-border-default last:border-b-0">
                            <td className="px-lg py-base text-sm text-text-muted">{ss.id}</td>
                            {/* The parent's code prefix, dimmed, then the
                                subsection's own digits — the inherited half of
                                the code reads as inherited. */}
                            <td className="px-lg py-base text-sm text-text-primary">
                              <span className="text-text-muted">{selected.code}</span>{ss.code.slice(selected.code.length)}
                            </td>
                            <td className="px-lg py-base text-sm text-text-primary"><Truncate lines={2}>{titleCaseName(ss.title)}</Truncate></td>
                            <td className="break-words px-lg py-base text-sm text-text-primary">{ss.part23}</td>
                            <td className="break-words px-lg py-base text-sm text-text-primary">{ss.part25}</td>
                            <td className="break-words px-lg py-base text-sm text-text-primary">{ss.part27}</td>
                            <td className="break-words px-lg py-base text-sm text-text-primary">{ss.part29}</td>
                            <td className="px-lg py-base">
                              <Badge tone={ss.active ? 'success' : 'neutral'}>{ss.active ? 'Active' : 'Inactive'}</Badge>
                            </td>
                            <td className="px-lg py-base">
                              <ActionsMenu
                                ariaLabel={`Actions for subsection ${ss.code}`}
                                items={[
                                  { label: 'Edit', icon: <Pencil size={16} />, onSelect: () => setSubsectionDrawer({ mode: 'edit', subsection: ss }) },
                                  { label: 'Delete', icon: <Trash2 size={16} />, onSelect: () => setDeletingSubsection(ss), tone: 'danger' },
                                ]}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {subpartDrawer && (
        <SubpartDrawer
          key={subpartDrawer.subpart?.id ?? 'new'}
          mode={subpartDrawer.mode}
          initial={subpartDrawer.subpart}
          onClose={() => setSubpartDrawer(null)}
          onSubmit={(sp) => {
            if (subpartDrawer.mode === 'edit') updateSubpart(sp.id, sp)
            else { addSubpart(sp); select(sp) }
          }}
        />
      )}
      {subsectionDrawer && (
        <SubsectionDrawer
          key={subsectionDrawer.subsection?.id ?? 'new'}
          mode={subsectionDrawer.mode}
          initial={subsectionDrawer.subsection}
          codePrefix={selected?.code}
          onClose={() => setSubsectionDrawer(null)}
          onSubmit={(ss) => { if (subsectionDrawer.mode === 'edit') updateSubsection(ss.id, ss); else addSubsection(ss) }}
        />
      )}

      <ConfirmDialog
        open={!!deletingSubpart}
        title={deletingSubpartUse > 0 ? `Subpart ${deletingSubpart?.code} is in use` : `Delete subpart ${deletingSubpart?.code}?`}
        description={deletingSubpart
          ? deletingSubpartUse > 0
            ? `${subsectionsOf(deletingSubpart.code).length} subsection${subsectionsOf(deletingSubpart.code).length === 1 ? '' : 's'} and ${rulesUnderSubpart(deletingSubpart.code)} regulation${rulesUnderSubpart(deletingSubpart.code) === 1 ? '' : 's'} are filed under ${deletingSubpart.code}. Retiring it keeps them intact and takes the subpart out of the pickers.`
            : `"${deletingSubpart.code}: ${titleCaseName(deletingSubpart.description)}" will be permanently removed. This cannot be undone.`
          : ''}
        confirmLabel={deletingSubpartUse > 0 ? 'Retire it instead' : 'Delete subpart'}
        tone={deletingSubpartUse > 0 ? 'primary' : 'danger'}
        onConfirm={() => {
          if (!deletingSubpart) return
          if (deletingSubpartUse > 0) updateSubpart(deletingSubpart.id, { active: false })
          else removeSubpart(deletingSubpart.id)
          setDeletingSubpart(null)
        }}
        onCancel={() => setDeletingSubpart(null)}
      />
      <ConfirmDialog
        open={!!deletingSubsection}
        title={deletingSubsectionUse > 0 ? `Subsection ${deletingSubsection?.code} is in use` : `Delete subsection ${deletingSubsection?.code}?`}
        description={deletingSubsection
          ? deletingSubsectionUse > 0
            ? `${deletingSubsectionUse} regulation${deletingSubsectionUse === 1 ? ' is' : 's are'} filed under ${deletingSubsection.code}. Retiring it keeps them intact and takes the code out of the pickers.`
            : `"${titleCaseName(deletingSubsection.title)}" will be permanently removed. This cannot be undone.`
          : ''}
        confirmLabel={deletingSubsectionUse > 0 ? 'Retire it instead' : 'Delete subsection'}
        tone={deletingSubsectionUse > 0 ? 'primary' : 'danger'}
        onConfirm={() => {
          if (!deletingSubsection) return
          if (deletingSubsectionUse > 0) updateSubsection(deletingSubsection.id, { active: false })
          else removeSubsection(deletingSubsection.id)
          setDeletingSubsection(null)
        }}
        onCancel={() => setDeletingSubsection(null)}
      />
    </AppShell>
  )
}
